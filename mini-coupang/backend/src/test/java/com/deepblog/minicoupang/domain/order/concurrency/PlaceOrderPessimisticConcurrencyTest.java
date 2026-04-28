package com.deepblog.minicoupang.domain.order.concurrency;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.application.PlaceOrderCommand;
import com.deepblog.minicoupang.domain.order.application.v1_deprecated.OrderServicePessimistic;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.domain.order.support.OrderConcurrencyScenario;
import com.deepblog.minicoupang.domain.order.support.OrderConcurrencyScenario.Prepared;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductOptionRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

// Unit 2 §3 (블로그 자산). OrderServicePessimistic 은 v1_deprecated 로 이동했고 @Service 등록을
// 끊었으므로, 이 테스트에서만 @TestConfiguration 으로 빈을 등록해 @Transactional AOP 프록시를 받는다.
// 새 §4(OrderService = Lua + Saga) 와 빈이 충돌하지 않도록 운영 등록은 하지 않는다.
@SpringBootTest
@ActiveProfiles("test")
@Import(PlaceOrderPessimisticConcurrencyTest.PessimisticTestConfig.class)
@DisplayName("주문 동시성 §3 비관적 락 (200 thread, asset)")
class PlaceOrderPessimisticConcurrencyTest {

    private static final int THREADS = 200;
    private static final long INITIAL_STOCK = 100L;

    @TestConfiguration
    static class PessimisticTestConfig {

        @Bean
        OrderServicePessimistic orderServicePessimistic(
            MemberRepository memberRepository,
            ProductOptionRepository productOptionRepository,
            OptionStockRepository optionStockRepository,
            OrderRepository orderRepository
        ) {
            return new OrderServicePessimistic(
                memberRepository, productOptionRepository, optionStockRepository, orderRepository);
        }
    }

    @Autowired private OrderServicePessimistic orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OptionStockRepository optionStockRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private SellerRepository sellerRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private OrderConcurrencyScenario scenario;
    private Prepared prepared;

    @BeforeEach
    void setUp() {
        scenario = new OrderConcurrencyScenario(
            accountRepository, sellerRepository, productRepository, optionStockRepository,
            memberRepository, orderRepository, passwordEncoder);
        scenario.clearAll();
        prepared = scenario.prepare("pessimistic", INITIAL_STOCK);
    }

    @Test
    @DisplayName("재고 100 에 같은 SKU 로 200 스레드가 동시 주문하면 100 건만 성공해야 한다")
    void place_200concurrent_sameSku_stock100_only100succeed() throws Exception {
        // given
        ExecutorService executor = Executors.newFixedThreadPool(THREADS);
        CountDownLatch barrier = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(THREADS);
        AtomicInteger success = new AtomicInteger();
        AtomicInteger insufficient = new AtomicInteger();
        AtomicInteger other = new AtomicInteger();

        // when
        for (int i = 0; i < THREADS; i++) {
            executor.submit(() -> {
                try {
                    barrier.await();
                    PlaceOrderCommand command = new PlaceOrderCommand(prepared.optionId(), 1L);
                    orderService.placeOrder(prepared.memberAccountId(), command);
                    success.incrementAndGet();
                } catch (BusinessException e) {
                    if (e.errorCode() == ErrorCode.INSUFFICIENT_AMOUNT) {
                        insufficient.incrementAndGet();
                    } else {
                        other.incrementAndGet();
                    }
                } catch (Exception e) {
                    other.incrementAndGet();
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
        scenario.dumpState(
            "200-thread pessimistic",
            prepared, THREADS, INITIAL_STOCK,
            success.get(), insufficient.get(), other.get()
        );
        long finalStock = optionStockRepository.findByOptionId(prepared.optionId())
            .orElseThrow()
            .getQuantity();

        assertThat(finished).as("모든 요청이 60초 내에 완료되어야 한다").isTrue();
        assertThat(other.get()).as("기대한 INSUFFICIENT_AMOUNT 외 예외").isZero();
        assertThat(success.get()).as("주문 성공 수").isEqualTo((int) INITIAL_STOCK);
        assertThat(insufficient.get())
            .as("재고 부족 실패 수")
            .isEqualTo(THREADS - (int) INITIAL_STOCK);
        assertThat(finalStock).as("최종 재고").isZero();
        assertThat(orderRepository.count())
            .as("저장된 주문 수")
            .isEqualTo(INITIAL_STOCK);
    }
}
