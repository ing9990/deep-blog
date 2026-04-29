package com.deepblog.minicoupang.domain.order.concurrency;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.application.v1_deprecated.OrderServiceNoLock;
import com.deepblog.minicoupang.domain.order.application.PlaceOrderCommand;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.minicoupang.domain.order.support.OrderConcurrencyScenario;
import com.deepblog.minicoupang.domain.order.support.OrderConcurrencyScenario.Prepared;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

// Unit 2 §A baseline (asset). OrderServiceNoLock 은 빈으로 등록하지 않으므로
// 자동 주입이 아닌 @BeforeEach 수동 조립으로 사용한다. 다만 수동 new 는 Spring 프록시를
// 거치지 않아 @Transactional 이 적용되지 않고, ProductOption.product 가 LAZY 라
// option.getProduct() 에서 LazyInitializationException 으로 모든 요청이 깨진다.
// 재측정이 필요하면 @TestConfiguration 으로 OrderServiceNoLock 을 빈 등록해
// Spring 프록시를 통해 @Transactional 이 적용되도록 해야 한다.
@SpringBootTest
@ActiveProfiles("test")
@Disabled("§A 베이스라인은 자산. 수동 조립으로는 @Transactional 미적용 → LazyInit. 재측정은 위 (a) 또는 (b) 적용 후 enable")
@DisplayName("주문 동시성 §A 베이스라인 (150 thread, no-lock)")
class PlaceOrderConcurrencyTest {

    private static final int THREADS = 150;
    private static final long INITIAL_STOCK = 100L;

    private OrderServiceNoLock orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OptionStockRepository optionStockRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private SellerRepository sellerRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private com.deepblog.minicoupang.domain.product.repository.ProductOptionRepository productOptionRepository;

    private OrderConcurrencyScenario scenario;
    private Prepared prepared;

    @BeforeEach
    void setUp() {
        scenario = new OrderConcurrencyScenario(
            accountRepository, sellerRepository, productRepository, optionStockRepository,
            memberRepository, orderRepository, passwordEncoder);
        scenario.clearAll();
        prepared = scenario.prepare("concurrency", INITIAL_STOCK);
        orderService = new OrderServiceNoLock(
            memberRepository, productOptionRepository, optionStockRepository, orderRepository);
    }

    @Test
    @DisplayName("재고 100 에 150 스레드가 동시 주문하면 100 건만 성공해야 한다")
    void place_150concurrent_singleOption_stock100_only100succeed() throws Exception {
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
        boolean finished = done.await(30, TimeUnit.SECONDS);
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        // then
        scenario.dumpState(
            "150-thread baseline",
            prepared, THREADS, INITIAL_STOCK,
            success.get(), insufficient.get(), other.get()
        );
        long finalStock = optionStockRepository.findByOptionId(prepared.optionId())
            .orElseThrow()
            .getQuantity();

        assertThat(finished).as("모든 요청이 30초 내에 완료되어야 한다").isTrue();
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
