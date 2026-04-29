package com.deepblog.integration.support;

import static com.deepblog.integration.support.HttpSupport.json;
import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.integration.MsaCompose;
import com.deepblog.integration.MsaEndpoints;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

public abstract class IntegrationTest {

    protected OrderScenario scenario;

    @BeforeAll
    static void bootCompose() {
        MsaCompose.instance();
    }

    @BeforeEach
    void initScenario() {
        scenario = new OrderScenario();
    }

    protected HttpSupport.Result placeOrder(
        String sessionCookie,
        long optionId,
        long quantity,
        boolean simulateFailure
    ) {
        String body = json(
            "optionId", optionId,
            "quantity", quantity,
            "simulateFailure", simulateFailure
        );
        return HttpSupport.postJson(
            MsaEndpoints.orderServer() + "/api/orders", body, sessionCookie);
    }

    protected OrderResult fireConcurrent(OrderScenario.Prepared prepared, int threads)
        throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch barrier = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger success = new AtomicInteger();
        AtomicInteger insufficient = new AtomicInteger();
        AtomicInteger paymentFailed = new AtomicInteger();
        AtomicInteger other = new AtomicInteger();
        ConcurrentHashMap<String, Integer> otherTypes = new ConcurrentHashMap<>();

        for (int i = 0; i < threads; i++) {
            String sessionCookie = prepared.sessionCookies().get(i);
            executor.submit(() -> {
                try {
                    barrier.await();
                    HttpSupport.Result res = placeOrder(
                        sessionCookie, prepared.optionId(), 1L, false);
                    if (res.status() == 200) {
                        success.incrementAndGet();
                    } else {
                        String code = errorCode(res.body());
                        if ("INSUFFICIENT_AMOUNT".equals(code)
                            || "INSUFFICIENT_STOCK".equals(code)) {
                            insufficient.incrementAndGet();
                        } else if ("PAYMENT_FAILED".equals(code)) {
                            paymentFailed.incrementAndGet();
                        } else {
                            other.incrementAndGet();
                            otherTypes.merge(
                                "HTTP-" + res.status() + ":" + code, 1, Integer::sum);
                        }
                    }
                } catch (Exception e) {
                    other.incrementAndGet();
                    otherTypes.merge(
                        e.getClass().getSimpleName() + ":" + e.getMessage(),
                        1, Integer::sum);
                } finally {
                    done.countDown();
                }
            });
        }
        barrier.countDown();
        boolean finished = done.await(120, TimeUnit.SECONDS);
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        return new OrderResult(
            finished, success.get(), insufficient.get(), paymentFailed.get(),
            other.get(), otherTypes);
    }

    protected void awaitMysqlOptionStock(long optionId, long expected) {
        Awaitility.await()
            .atMost(Duration.ofSeconds(20))
            .pollInterval(Duration.ofMillis(500))
            .untilAsserted(() ->
                assertThat(scenario.mysqlOptionStock(optionId)).isEqualTo(expected));
    }

    protected void awaitRedisStock(long optionId, long expected) {
        Awaitility.await()
            .atMost(Duration.ofSeconds(15))
            .pollInterval(Duration.ofMillis(200))
            .untilAsserted(() ->
                assertThat(scenario.redisStock(optionId)).isEqualTo(expected));
    }

    protected static String errorCode(String body) {
        if (body == null || body.isEmpty()) {
            return "";
        }
        try {
            return HttpSupport.parse(body).path("code").asText("");
        } catch (Exception e) {
            return "";
        }
    }

    public record OrderResult(
        boolean finished,
        int success,
        int insufficient,
        int paymentFailed,
        int other,
        java.util.Map<String, Integer> otherTypes
    ) {
    }
}
