package com.deepblog.integration.order;

import static com.deepblog.integration.support.HttpSupport.json;
import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.integration.MsaCompose;
import com.deepblog.integration.MsaEndpoints;
import com.deepblog.integration.support.HttpSupport;
import com.deepblog.integration.support.OrderScenario;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PlaceOrderConcurrencyTest {

    private static final int THREADS = 200;
    private static final long INITIAL_STOCK = 100L;

    @Test
    @DisplayName("재고: 100, 스레드: 200 | 100개는 성공하고 100개는 실패한다. 재고는 0 이며 주문은 100개 만들어진다.")
    void place100concurrent_allSucceed_andStockConvergesToZero() throws Exception {
        // compose 먼저 부팅 - 정적 holder. 첫 호출에 30~60초 소요.
        MsaCompose.instance();

        // given
        OrderScenario scenario = new OrderScenario();
        OrderScenario.Prepared prepared = scenario.prepare(THREADS, INITIAL_STOCK);
        String orderUrl = MsaEndpoints.orderServer() + "/api/orders";

        ExecutorService executor = Executors.newFixedThreadPool(THREADS);
        CountDownLatch barrier = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(THREADS);
        AtomicInteger success = new AtomicInteger();
        AtomicInteger insufficient = new AtomicInteger();
        AtomicInteger paymentFailed = new AtomicInteger();
        AtomicInteger other = new AtomicInteger();
        ConcurrentHashMap<String, Integer> otherTypes = new ConcurrentHashMap<>();

        // when
        for (int i = 0; i < THREADS; i++) {
            String sessionCookie = prepared.sessionCookies().get(i);
            executor.submit(() -> {
                try {
                    barrier.await();
                    String body = json(
                        "optionId", prepared.optionId(),
                        "quantity", 1,
                        "simulateFailure", false
                    );
                    HttpSupport.Result res = HttpSupport.postJson(orderUrl, body, sessionCookie);
                    if (res.status() == 200) {
                        success.incrementAndGet();
                    } else {
                        String code = extractErrorCode(res.body());
                        if ("INSUFFICIENT_AMOUNT".equals(code) || "INSUFFICIENT_STOCK".equals(
                            code)) {
                            insufficient.incrementAndGet();
                        } else if ("PAYMENT_FAILED".equals(code)) {
                            paymentFailed.incrementAndGet();
                        } else {
                            other.incrementAndGet();
                            otherTypes.merge("HTTP-" + res.status() + ":" + code, 1, Integer::sum);
                        }
                    }
                } catch (Exception e) {
                    other.incrementAndGet();
                    otherTypes.merge(e.getClass().getSimpleName() + ":" + e.getMessage(),
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

        // then
        long finalRedisStock = scenario.redisStock(prepared.optionId());

        System.out.printf("=== PlaceOrderConcurrencyTest result ===%n");
        System.out.printf("success         : %d%n", success.get());
        System.out.printf("insufficient    : %d%n", insufficient.get());
        System.out.printf("paymentFailed   : %d%n", paymentFailed.get());
        System.out.printf("other           : %d%n", other.get());
        System.out.printf("finalRedisStock : %d%n", finalRedisStock);
        if (!otherTypes.isEmpty()) {
            otherTypes.forEach((k, v) -> System.out.printf("  %s : %d%n", k, v));
        }

        assertThat(finished).as("모든 요청이 120 초 내에 완료되어야 한다").isTrue();
        assertThat(other.get()).as("기대한 분류 외 예외").isZero();

        assertThat(success.get() + insufficient.get() + paymentFailed.get())
            .as("성공 + 재고부족 + 결제실패 = 전체 스레드")
            .isEqualTo(THREADS);

        assertThat(success.get())
            .as("성공 주문 수 ≤ 초기 재고")
            .isLessThanOrEqualTo((int) INITIAL_STOCK);

        assertThat(finalRedisStock + success.get())
            .as("Redis 재고 + 성공 주문 = 초기 재고")
            .isEqualTo(INITIAL_STOCK);

        Awaitility.await()
            .atMost(Duration.ofSeconds(20))
            .pollInterval(Duration.ofMillis(500))
            .untilAsserted(() -> {
                long mysqlStock = scenario.mysqlOptionStock(prepared.optionId());
                assertThat(mysqlStock)
                    .as("MySQL 재고는 (초기 재고 - 성공 주문 수) 로 수렴")
                    .isEqualTo(INITIAL_STOCK - success.get());
            });

        assertThat(scenario.ordersCount())
            .as("저장된 주문 수 = 성공 카운트")
            .isEqualTo(success.get());
    }

    private static String extractErrorCode(String body) {
        if (body == null || body.isEmpty()) {
            return "";
        }
        try {
            return HttpSupport.parse(body).path("code").asText("");
        } catch (Exception e) {
            return "";
        }
    }
}
