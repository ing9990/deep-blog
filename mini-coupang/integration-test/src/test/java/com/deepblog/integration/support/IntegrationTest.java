package com.deepblog.integration.support;

import static com.deepblog.integration.support.HttpSupport.json;
import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.integration.MsaEndpoints;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.awaitility.Awaitility;

/**
 * 통합 테스트 베이스. docker-compose 는 사용자가 미리 띄워 둔 상태를 가정한다 (포트 1xxxx).
 * 서비스가 안 떠 있으면 첫 HTTP 호출에서 ConnectException 으로 그냥 실패시킨다.
 *
 * <p>{@code scenario} 는 inline final 필드. nested @BeforeAll 이 @BeforeEach 보다 먼저
 * 돌기 때문에 lifecycle 메서드 초기화로는 nested 진입 시 null 이 된다.
 */
public abstract class IntegrationTest {

    protected final OrderScenario scenario = new OrderScenario();

    /**
     * 토스 결제 모델에 맞춘 두 단계 호출:
     * <ol>
     *   <li>POST /api/orders/prepare → orderId, amount</li>
     *   <li>POST /api/orders/{orderId}/confirm → 최종 결과</li>
     * </ol>
     *
     * <p>prepare 단계가 실패하면 그 응답을 그대로 반환한다 (INSUFFICIENT_AMOUNT 등).
     * 성공 시 가짜 paymentKey 를 만들어 confirm 호출까지 진행한다.
     */
    protected HttpSupport.Result placeOrder(
        String sessionCookie,
        long optionId,
        long quantity,
        boolean simulateFailure
    ) {
        String prepareBody = json("optionId", optionId, "quantity", quantity);
        HttpSupport.Result prepareRes = HttpSupport.postJson(
            MsaEndpoints.orderServer() + "/api/orders/prepare", prepareBody, sessionCookie);
        if (prepareRes.status() != 200) {
            return prepareRes;
        }

        JsonNode data = HttpSupport.parse(prepareRes.body()).path("data");
        long orderId = data.path("orderId").asLong();
        long amount = data.path("amount").asLong();
        String paymentKey = "TOSS_TEST_" + UUID.randomUUID();

        String confirmBody = json(
            "paymentKey", paymentKey,
            "amount", amount,
            "simulateFailure", simulateFailure
        );
        return HttpSupport.postJson(
            MsaEndpoints.orderServer() + "/api/orders/" + orderId + "/confirm",
            confirmBody,
            sessionCookie
        );
    }

    protected OrderResult fireConcurrent(OrderScenario.Prepared prepared, int threads)
        throws InterruptedException {
        return fireConcurrent(prepared, threads, false);
    }

    protected OrderResult fireConcurrent(
        OrderScenario.Prepared prepared, int threads, boolean simulateFailure
    ) throws InterruptedException {
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
                        sessionCookie, prepared.optionId(), 1L, simulateFailure);
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
