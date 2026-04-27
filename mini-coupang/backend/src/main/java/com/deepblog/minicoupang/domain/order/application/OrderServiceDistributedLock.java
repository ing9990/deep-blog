package com.deepblog.minicoupang.domain.order.application;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.domain.Order;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.domain.product.domain.OptionStock;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductOptionRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import java.util.concurrent.TimeUnit;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

// Unit 2 §D (asset): Redis 분산 락(Redisson RLock).
// §C 비관적 락이 단일 DB 인스턴스 안에서 직렬화한다면, §D 는 잠금 주체를 외부 KV(Redis) 로 옮긴다.
// JVM 인스턴스가 N 개여도 같은 키(lock:option:{optionId}) 를 가리키는 모든 트랜잭션이 단일 Redis 노드에서 직렬화된다.
//
// 트랜잭션 경계 함정 (§B 와 동일):
//   @Transactional + 메서드 자체에 락을 걸면 잠금이 트랜잭션 커밋보다 먼저 풀린다.
//   해결: 락 획득 → TransactionTemplate.execute(...) → 커밋 → 락 해제 순서를 직접 보장.
//
// leaseTime 정책: tryLock(waitTime, unit) 시그니처를 사용해 Redisson watchdog 모드를 활성화한다.
//   - 락 보유 동안 약 10초 주기로 만료를 자동 연장한다 (default lock watchdog timeout 30s).
//   - 트랜잭션이 길어져도 만료 race 가 발생하지 않는다.
//   - 단, 클라이언트가 죽으면 watchdog 도 멈추므로 default timeout 후 자동 해제된다 (deadlock 방지).
//
// §E(Lua atomic decrement) 비교용 자산으로 보존. 빈 등록은 의도적으로 비활성화 (아래 @Service 주석).
// @Service
@Deprecated
public class OrderServiceDistributedLock {

    private static final String LOCK_KEY_PREFIX = "lock:option:";
    private static final long WAIT_TIME_SECONDS = 3L;

    private final MemberRepository memberRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OptionStockRepository optionStockRepository;
    private final OrderRepository orderRepository;
    private final TransactionTemplate transactionTemplate;
    private final RedissonClient redissonClient;

    public OrderServiceDistributedLock(
        MemberRepository memberRepository,
        ProductOptionRepository productOptionRepository,
        OptionStockRepository optionStockRepository,
        OrderRepository orderRepository,
        PlatformTransactionManager transactionManager,
        RedissonClient redissonClient
    ) {
        this.memberRepository = memberRepository;
        this.productOptionRepository = productOptionRepository;
        this.optionStockRepository = optionStockRepository;
        this.orderRepository = orderRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.redissonClient = redissonClient;
    }

    public PlaceOrderResult placeOrder(Long accountId, PlaceOrderCommand command) {
        RLock lock = redissonClient.getLock(LOCK_KEY_PREFIX + command.optionId());
        boolean acquired = false;
        try {
            acquired = lock.tryLock(WAIT_TIME_SECONDS, TimeUnit.SECONDS);
            if (!acquired) {
                throw new BusinessException(ErrorCode.LOCK_ACQUIRE_FAILED);
            }
            return transactionTemplate.execute(status -> doPlaceOrder(accountId, command));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.LOCK_INTERRUPTED, e);
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    private PlaceOrderResult doPlaceOrder(Long accountId, PlaceOrderCommand command) {
        Member member = memberRepository.findByAccountId(accountId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_A_MEMBER));

        ProductOption option = productOptionRepository.findById(command.optionId())
            .orElseThrow(() -> new BusinessException(ErrorCode.OPTION_NOT_FOUND));
        OptionStock stock = optionStockRepository.findByOptionId(command.optionId())
            .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_NOT_FOUND));

        try {
            stock.decrease(command.quantity());
        } catch (BusinessException e) {
            if (e.errorCode() == ErrorCode.INSUFFICIENT_STOCK) {
                throw new BusinessException(ErrorCode.INSUFFICIENT_AMOUNT, e);
            }
            throw e;
        }

        Product product = option.getProduct();
        long unitPrice = product.getBasePrice() + option.getAdditionalPrice();

        Order order = Order.create(member);
        order.addItem(
            product.getId(),
            option.getId(),
            option.getSku(),
            product.getName(),
            option.getOptionName(),
            unitPrice,
            command.quantity()
        );

        Order saved = orderRepository.save(order);
        return PlaceOrderResult.from(saved);
    }
}
