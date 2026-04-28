package com.deepblog.minicoupang.domain.order.concurrency;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.application.OrderService;
import com.deepblog.minicoupang.domain.order.application.PlaceOrderCommand;
import com.deepblog.minicoupang.domain.order.application.port.out.PaymentPort;
import com.deepblog.minicoupang.domain.order.application.port.out.dto.PaymentChargeOutcome;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.domain.order.support.OrderConcurrencyScenario;
import com.deepblog.minicoupang.domain.order.support.OrderConcurrencyScenario.Prepared;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductStockRedisRepository;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

// Unit 2 §4: Lua reserveStock + Saga release 동시성 측정.
//
// 시나리오: 재고 100, 200 스레드 동시 placeOrder. 그 중 5% 는 simulateFailure=true 로
// 결제 실패를 주입한다 (실제 운영의 결제 취소 / 게이트웨이 오류 가정).
//
// 검증할 불변식:
//   1) success + insufficient + paymentFailed == 200
//   2) success <= 100 (Redis 초기 재고를 넘을 수 없다)
//   3) finalRedisStock + success == 100 (성공만 Redis 차감을 영구로 남긴다)
//   4) MySQL `option_stock` 은 AFTER_COMMIT 이벤트 처리 후 100 - success 로 수렴
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@Import(PlaceOrderLuaSagaConcurrencyTest.LuaSagaTestConfig.class)
@DisplayName("주문 동시성 §4 Lua + Saga (200 thread, 5% failure)")
class PlaceOrderLuaSagaConcurrencyTest {

    private static final int THREADS = 200;
    private static final long INITIAL_STOCK = 100L;
    private static final int FAILURE_INJECTED_THREADS = 10;

    @Container
    static final GenericContainer<?> redis = new GenericContainer<>("redis:7.4-alpine")
        .withExposedPorts(6379);

    @TestConfiguration
    static class LuaSagaTestConfig {

        @Bean(destroyMethod = "shutdown")
        RedissonClient redissonClient() {
            Config config = new Config();
            config.useSingleServer()
                .setAddress("redis://" + redis.getHost() + ":" + redis.getMappedPort(6379));
            return Redisson.create(config);
        }

        // 실제 PaymentFeignAdapter 대신 사용하는 stub. simulateFailure=true 면 실패 응답.
        // payment-service 를 별도 프로세스로 띄우지 않고 §4 동시성 거동만 측정하기 위함.
        @Bean
        @Primary
        PaymentPort stubPaymentPort() {
            return command -> {
                if (command.simulateFailure()) {
                    return PaymentChargeOutcome.failure("SIMULATED_FAILURE");
                }
                return PaymentChargeOutcome.success("PAY-" + UUID.randomUUID());
            };
        }
    }

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OptionStockRepository optionStockRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private SellerRepository sellerRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ProductStockRedisRepository stockRedisRepository;

    private OrderConcurrencyScenario scenario;
    private Prepared prepared;

    @BeforeEach
    void setUp() {
        scenario = new OrderConcurrencyScenario(
            accountRepository, sellerRepository, productRepository, optionStockRepository,
            memberRepository, orderRepository, passwordEncoder);
        scenario.clearAll();
        prepared = scenario.prepare("lua-saga", INITIAL_STOCK);
        // §4 의 정합성은 Redis 가 hot path 의 원장. MySQL 은 AFTER_COMMIT 이벤트로 수렴.
        stockRedisRepository.setStock(prepared.optionId(), INITIAL_STOCK);
    }

    @Test
    @DisplayName("재고 100 에 200 스레드(5% 결제 실패 주입)가 동시 주문하면 정합 상태로 수렴한다")
    void place_200concurrent_5percentFailureInjected_convergesConsistently() throws Exception {
        // given
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
            final boolean injectFailure = i < FAILURE_INJECTED_THREADS;
            executor.submit(() -> {
                try {
                    barrier.await();
                    PlaceOrderCommand command = new PlaceOrderCommand(
                        prepared.optionId(), 1L, injectFailure);
                    orderService.placeOrder(prepared.memberAccountId(), command);
                    success.incrementAndGet();
                } catch (BusinessException e) {
                    if (e.errorCode() == ErrorCode.INSUFFICIENT_AMOUNT) {
                        insufficient.incrementAndGet();
                    } else if (e.errorCode() == ErrorCode.PAYMENT_FAILED) {
                        paymentFailed.incrementAndGet();
                    } else {
                        other.incrementAndGet();
                        otherTypes.merge(e.errorCode().name(), 1, Integer::sum);
                    }
                } catch (Exception e) {
                    other.incrementAndGet();
                    otherTypes.merge(e.getClass().getSimpleName() + ":" + e.getMessage(), 1, Integer::sum);
                } finally {
                    done.countDown();
                }
            });
        }
        barrier.countDown();
        boolean finished = done.await(60, TimeUnit.SECONDS);
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        // then
        long finalRedisStock = stockRedisRepository.getCurrentStock(prepared.optionId());

        scenario.dumpState(
            "200-thread lua-saga (5% failure)",
            prepared, THREADS, INITIAL_STOCK,
            success.get(), insufficient.get(), other.get()
        );
        System.out.printf(
            "paymentFailed  : %d%nfinalRedisStock: %d%n",
            paymentFailed.get(), finalRedisStock);
        if (!otherTypes.isEmpty()) {
            System.out.println("----- otherTypes -----");
            otherTypes.forEach((k, v) -> System.out.printf("  %s : %d%n", k, v));
        }

        assertThat(finished).as("모든 요청이 60초 내에 완료되어야 한다").isTrue();
        assertThat(other.get()).as("기대한 분류 외 예외").isZero();

        // 1. 합계 불변식
        assertThat(success.get() + insufficient.get() + paymentFailed.get())
            .as("성공 + 재고부족 + 결제실패 = 전체 스레드")
            .isEqualTo(THREADS);

        // 2. 성공이 초기 재고를 넘지 않는다
        assertThat(success.get())
            .as("성공 주문 수 ≤ 초기 재고")
            .isLessThanOrEqualTo((int) INITIAL_STOCK);

        // 3. Redis 재고 + 성공 주문 = 초기 재고 (성공만 영구 차감, 실패는 release 로 환원)
        assertThat(finalRedisStock + success.get())
            .as("Redis 재고 + 성공 = 초기 재고")
            .isEqualTo(INITIAL_STOCK);

        // 4. MySQL 재고는 AFTER_COMMIT 이벤트가 모두 처리된 뒤 (100 - success) 로 수렴
        Awaitility.await()
            .atMost(Duration.ofSeconds(10))
            .untilAsserted(() -> {
                long mysqlStock = optionStockRepository.findByOptionId(prepared.optionId())
                    .orElseThrow()
                    .getQuantity();
                assertThat(mysqlStock)
                    .as("MySQL 재고는 100 - 성공 주문 수로 수렴")
                    .isEqualTo(INITIAL_STOCK - success.get());
            });

        // 5. 저장된 주문 수 = 성공 카운트
        assertThat(orderRepository.count())
            .as("저장된 주문 수 = 성공 카운트")
            .isEqualTo(success.get());
    }
}
