package com.deepblog.integration.support;

import static com.deepblog.integration.support.HttpSupport.json;

import com.deepblog.integration.MsaEndpoints;
import com.fasterxml.jackson.databind.JsonNode;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
public final class OrderScenario {

    private final JdbcTemplate productJdbc = JdbcSupport.jdbc("product");
    private final JdbcTemplate ordersJdbc = JdbcSupport.jdbc("orders");
    private final JdbcTemplate memberJdbc = JdbcSupport.jdbc("member");

    public Prepared prepare(int memberCount, long initialStock) {
        truncate();
        resetRedis();

        Long categoryId = insertCategory("통합테스트카테고리-" + System.currentTimeMillis());
        Long productId = insertProduct(categoryId);
        Long optionId = insertOption(productId);
        insertOptionStock(optionId, initialStock);
        setRedisStock(optionId, initialStock);

        List<String> sessionCookies = signupAndLogin(memberCount);
        return new Prepared(categoryId, productId, optionId, sessionCookies);
    }

    private void truncate() {
        productJdbc.execute("SET FOREIGN_KEY_CHECKS = 0");
        productJdbc.update("TRUNCATE TABLE option_stocks");
        productJdbc.update("TRUNCATE TABLE product_options");
        productJdbc.update("TRUNCATE TABLE products");
        productJdbc.update("TRUNCATE TABLE categories");
        productJdbc.execute("SET FOREIGN_KEY_CHECKS = 1");

        ordersJdbc.execute("SET FOREIGN_KEY_CHECKS = 0");
        try { ordersJdbc.update("TRUNCATE TABLE order_items"); } catch (Exception ignore) {}
        try { ordersJdbc.update("TRUNCATE TABLE orders"); } catch (Exception ignore) {}
        ordersJdbc.execute("SET FOREIGN_KEY_CHECKS = 1");

        memberJdbc.execute("SET FOREIGN_KEY_CHECKS = 0");
        try { memberJdbc.update("TRUNCATE TABLE members"); } catch (Exception ignore) {}
        try { memberJdbc.update("TRUNCATE TABLE sellers"); } catch (Exception ignore) {}
        try { memberJdbc.update("TRUNCATE TABLE accounts"); } catch (Exception ignore) {}
        memberJdbc.execute("SET FOREIGN_KEY_CHECKS = 1");
    }

    private void resetRedis() {
        try (RedisClient client = RedisSupport.client();
             StatefulRedisConnection<String, String> conn = RedisSupport.connect(client)) {
            for (String key : conn.sync().keys("stock:option:*")) {
                conn.sync().del(key);
            }
            for (String key : conn.sync().keys("spring:session:*")) {
                conn.sync().del(key);
            }
        }
    }

    private Long insertCategory(String name) {
        productJdbc.update(
            "INSERT INTO categories (name, parent_id, created_at, updated_at) VALUES (?, NULL, NOW(6), NOW(6))",
            name);
        return productJdbc.queryForObject(
            "SELECT category_id FROM categories WHERE name = ?", Long.class, name);
    }

    private Long insertProduct(Long categoryId) {
        productJdbc.update(
            "INSERT INTO products "
                + "(seller_id, category_id, name, description, base_price, status, created_at, updated_at) "
                + "VALUES (?, ?, ?, ?, ?, 'ACTIVE', NOW(6), NOW(6))",
            1L, categoryId, "통합테스트상품", "concurrency target", 10000L);
        return productJdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private Long insertOption(Long productId) {
        String sku = "IT-SKU-" + System.currentTimeMillis();
        productJdbc.update(
            "INSERT INTO product_options "
                + "(product_id, option_name, sku, additional_price, created_at, updated_at) "
                + "VALUES (?, ?, ?, 0, NOW(6), NOW(6))",
            productId, "기본", sku);
        return productJdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private void insertOptionStock(Long optionId, long initialStock) {
        productJdbc.update(
            "INSERT INTO option_stocks (option_id, quantity, created_at, updated_at) "
                + "VALUES (?, ?, NOW(6), NOW(6))",
            optionId, initialStock);
    }

    private void setRedisStock(Long optionId, long stock) {
        try (RedisClient client = RedisSupport.client();
             StatefulRedisConnection<String, String> conn = RedisSupport.connect(client)) {
            RedisSupport.setStock(conn.sync(), optionId, stock);
        }
    }

    private List<String> signupAndLogin(int memberCount) {
        String memberServer = MsaEndpoints.memberServer();
        List<String> sessionCookies = new ArrayList<>(memberCount);
        for (int i = 0; i < memberCount; i++) {
            String email = "it-" + System.currentTimeMillis() + "-" + i + "@test.local";
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
        Long count = ordersJdbc.queryForObject("SELECT COUNT(*) FROM orders", Long.class);
        return count == null ? 0L : count;
    }

    public JsonNode parseBody(String body) {
        return HttpSupport.parse(body);
    }

    public record Prepared(Long categoryId, Long productId, Long optionId, List<String> sessionCookies) {
    }
}
