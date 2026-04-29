package com.deepblog.integration.support;

import static com.deepblog.integration.support.HttpSupport.json;

import com.deepblog.integration.MsaEndpoints;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import java.util.ArrayList;
import java.util.List;
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

    private static final String SEED_SCRIPT = "test-seed.sql";

    private final DataSource productDs = JdbcSupport.dataSource("product");
    private final JdbcTemplate productJdbc = new JdbcTemplate(productDs);

    public Prepared prepare(int memberCount) {
        applySeed();
        resetRedisAndSetStock();
        List<String> sessionCookies = signupAndLogin(memberCount);
        return new Prepared(PRODUCT_ID, OPTION_ID, sessionCookies);
    }

    private void applySeed() {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(
            new ClassPathResource(SEED_SCRIPT));
        populator.execute(productDs);
    }

    private void resetRedisAndSetStock() {
        try (RedisClient client = RedisSupport.client();
             StatefulRedisConnection<String, String> conn = RedisSupport.connect(client)) {
            for (String key : conn.sync().keys("stock:option:*")) {
                conn.sync().del(key);
            }
            for (String key : conn.sync().keys("spring:session:*")) {
                conn.sync().del(key);
            }
            RedisSupport.setStock(conn.sync(), OPTION_ID, INITIAL_STOCK);
        }
    }

    private List<String> signupAndLogin(int memberCount) {
        String memberServer = MsaEndpoints.memberServer();
        List<String> sessionCookies = new ArrayList<>(memberCount);
        long suffix = System.currentTimeMillis();
        for (int i = 0; i < memberCount; i++) {
            String email = "it-" + suffix + "-" + i + "@test.local";
            String password = "passw0rd!";
            String phone = String.format("010%07d", i);

            String signupBody = json(
                "email", email,
                "password", password,
                "name", "회원" + i,
                "phoneNumber", phone,
                "nickname", "닉" + i
            );
            HttpSupport.Result signupRes = HttpSupport.postJson(
                memberServer + "/auth/signup/member", signupBody, null);
            if (signupRes.status() != 201 && signupRes.status() != 200) {
                throw new IllegalStateException(
                    "signup failed: status=" + signupRes.status() + " body=" + signupRes.body());
            }

            String loginBody = json("email", email, "password", password);
            HttpSupport.Result loginRes = HttpSupport.postJson(
                memberServer + "/auth/login", loginBody, null);
            if (loginRes.status() != 200 || loginRes.sessionCookie() == null) {
                throw new IllegalStateException(
                    "login failed: status=" + loginRes.status() + " body=" + loginRes.body());
            }
            sessionCookies.add(loginRes.sessionCookie());
        }
        return sessionCookies;
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

    public record Prepared(Long productId, Long optionId, List<String> sessionCookies) {
    }
}
