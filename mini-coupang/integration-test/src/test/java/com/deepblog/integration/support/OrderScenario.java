package com.deepblog.integration.support;

import static com.deepblog.integration.support.HttpSupport.json;

import com.deepblog.integration.MsaEndpoints;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

@Slf4j
public final class OrderScenario {

    public static final long PRODUCT_ID = 1L;
    public static final long OPTION_ID = 1L;
    public static final long INITIAL_STOCK = 100L;
    public static final String SEED_PASSWORD = "passw0rd!";
    public static final int SEED_MEMBER_COUNT = 200;

    private static final String SEED_SCRIPT = "test-seed.sql";

    private final DataSource productDs = JdbcSupport.dataSource("product");
    private final JdbcTemplate productJdbc = new JdbcTemplate(productDs);

    public Prepared prepare(int memberCount) {
        return prepare(memberCount, INITIAL_STOCK);
    }

    /**
     * 시드 적용 + Redis/MySQL 옵션 재고를 {@code initialStock} 으로 강제 세팅 + 병렬 로그인.
     * 시나리오마다 시작 재고를 다르게 두고 싶을 때 사용한다 (재고 0, 1, 10 등).
     */
    public Prepared prepare(int memberCount, long initialStock) {
        if (memberCount > SEED_MEMBER_COUNT) {
            throw new IllegalArgumentException(
                "memberCount(" + memberCount + ") > SEED_MEMBER_COUNT(" + SEED_MEMBER_COUNT
                    + "). test-seed.sql 의 시드 계정 수를 늘리세요.");
        }
        applySeed();
        resetRedisAndSetStock(initialStock);
        setMysqlOptionStock(OPTION_ID, initialStock);
        List<String> sessionCookies = loginPreseededAccounts(memberCount);
        return new Prepared(PRODUCT_ID, OPTION_ID, sessionCookies);
    }

    private void applySeed() {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(
            new ClassPathResource(SEED_SCRIPT));
        populator.execute(productDs);
    }

    private void resetRedisAndSetStock(long initialStock) {
        try (RedisClient client = RedisSupport.client();
             StatefulRedisConnection<String, String> conn = RedisSupport.connect(client)) {
            for (String key : conn.sync().keys("stock:option:*")) {
                conn.sync().del(key);
            }
            for (String key : conn.sync().keys("spring:session:*")) {
                conn.sync().del(key);
            }
            RedisSupport.setStock(conn.sync(), OPTION_ID, initialStock);
        }
    }

    private void setMysqlOptionStock(long optionId, long quantity) {
        productJdbc.update(
            "UPDATE option_stocks SET quantity = ? WHERE option_id = ?", quantity, optionId);
    }

    /**
     * 사전 시드된 계정 (it-1@test.local ~ it-N@test.local) 으로 병렬 로그인.
     * signup HTTP 호출은 건너뛰어 셋업 시간 단축.
     */
    private List<String> loginPreseededAccounts(int memberCount) {
        String memberServer = MsaEndpoints.memberServer();
        String[] sessions = new String[memberCount];
        int poolSize = Math.min(memberCount, 32);
        ExecutorService exec = Executors.newFixedThreadPool(poolSize);
        CountDownLatch done = new CountDownLatch(memberCount);
        for (int i = 0; i < memberCount; i++) {
            final int idx = i;
            exec.submit(() -> {
                try {
                    String email = "it-" + (idx + 1) + "@test.local";
                    String body = json("email", email, "password", SEED_PASSWORD);
                    HttpSupport.Result res = HttpSupport.postJson(
                        memberServer + "/auth/login", body, null);
                    if (res.status() != 200 || res.sessionCookie() == null) {
                        throw new IllegalStateException(
                            "login failed for " + email + ": status=" + res.status()
                                + " body=" + res.body());
                    }
                    sessions[idx] = res.sessionCookie();
                } finally {
                    done.countDown();
                }
            });
        }
        try {
            if (!done.await(120, TimeUnit.SECONDS)) {
                throw new IllegalStateException("login phase timed out (120s)");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("login phase interrupted", e);
        } finally {
            exec.shutdown();
        }
        for (int i = 0; i < memberCount; i++) {
            if (sessions[i] == null) {
                throw new IllegalStateException("login produced null session for index " + i);
            }
        }
        return Arrays.asList(sessions);
    }

    public long mysqlOptionStock(long optionId) {
        return productJdbc.queryForObject(
            "SELECT quantity FROM option_stocks WHERE option_id = ?", Long.class, optionId);
    }

    public long redisStock(long optionId) {
        try (RedisClient client = RedisSupport.client();
             StatefulRedisConnection<String, String> conn = RedisSupport.connect(client)) {
            return RedisSupport.getStock(conn.sync(), optionId);
        }
    }

    public long ordersCount() {
        JdbcTemplate ordersJdbc = JdbcSupport.jdbc("orders");
        Long count = ordersJdbc.queryForObject("SELECT COUNT(*) FROM orders", Long.class);
        return count == null ? 0L : count;
    }

    public long ordersCountByStatus(String status) {
        JdbcTemplate ordersJdbc = JdbcSupport.jdbc("orders");
        Long count = ordersJdbc.queryForObject(
            "SELECT COUNT(*) FROM orders WHERE status = ?", Long.class, status);
        return count == null ? 0L : count;
    }

    public record Prepared(Long productId, Long optionId, List<String> sessionCookies) {
    }
}
