package com.deepblog.minicoupang.domain.order.concurrency;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.application.OrderService;
import com.deepblog.minicoupang.domain.order.application.PlaceOrderCommand;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.domain.order.support.OrderConcurrencyScenario;
import com.deepblog.minicoupang.domain.order.support.OrderConcurrencyScenario.Prepared;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

// Unit 2 §C. OrderService(@Service)는 비관적 락(SELECT ... FOR UPDATE) 기반이므로
// 빈을 그대로 주입받아 시나리오를 돌린다. §B(synchronized)와 동일한 200 thread/stock 100
// 시나리오로 측정해 두 구현의 차이를 비교한다.
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("주문 동시성 §C 비관적 락 (200 thread)")
class PlaceOrderPessimisticConcurrencyTest {

    private static final int THREADS = 200;
    private static final long INITIAL_STOCK = 100L;

    @Autowired
    private OrderService orderService;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private OptionStockRepository optionStockRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private SellerRepository sellerRepository;
    @Autowired
    private MemberRepository memberRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

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
