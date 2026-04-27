package com.deepblog.minicoupang.domain.order.application;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.domain.Order;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductOptionRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.transaction.annotation.Transactional;

// Unit 2 §D (asset): Redis 분산 락(Redisson RLock) + @Modifying 원자 UPDATE.
// 잠금 책임을 두 층으로 나눈다.
//   1) 분산 코디네이션: Redisson RLock 으로 같은 키(lock:option:{optionId}) 를 가리키는
//      모든 JVM 인스턴스의 트랜잭션을 직렬화 후보로 만든다.
//   2) 정합성: @Modifying UPDATE 가 잡는 DB 행 X 락이 트랜잭션 커밋까지 유지돼,
//      Redis 락이 커밋보다 먼저 풀려도 동시 UPDATE 가 직렬화된다(lost update 차단).
//
// 그 결과 §B 의 트랜잭션 경계 함정(`@Transactional` 만 두면 락이 커밋 전 풀림) 을
// TransactionTemplate 없이 풀 수 있다. 정합성 보증 주체는 사실상 DB 행 락이며,
// Redis 락은 멀티 인스턴스 환경에서 DB 진입 자체를 줄이는 코디네이션 도구로 남는다.
//
// leaseTime 정책: tryLock(waitTime, unit) 시그니처로 watchdog 모드 활성화.
//   - 락 보유 동안 약 10초 주기로 만료 자동 연장 (default lock watchdog timeout 30s).
//   - 클라이언트 사망 시 default timeout 후 자동 해제 → deadlock 방지.
//
// §E(Lua atomic decrement) 비교용 자산으로 보존. 빈 등록은 의도적으로 비활성화.
// @Service
@Deprecated
@RequiredArgsConstructor
public class OrderServiceDistributedLock {

    private static final String LOCK_KEY_PREFIX = "lock:option:";
    private static final long WAIT_TIME_SECONDS = 3L;

    private final MemberRepository memberRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OptionStockRepository optionStockRepository;
    private final OrderRepository orderRepository;
    private final RedissonClient redissonClient;

    @Transactional
    public PlaceOrderResult placeOrder(Long accountId, PlaceOrderCommand command) {
        RLock lock = redissonClient.getLock(LOCK_KEY_PREFIX + command.optionId());
        try {
            boolean acquired = lock.tryLock(WAIT_TIME_SECONDS, TimeUnit.SECONDS);
            if (!acquired) {
                throw new BusinessException(ErrorCode.LOCK_ACQUIRE_FAILED);
            }
            return doPlaceOrder(accountId, command);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.LOCK_INTERRUPTED, e);
        } finally {
            lock.unlock();
        }
    }

    private PlaceOrderResult doPlaceOrder(Long accountId, PlaceOrderCommand command) {
        Member member = memberRepository.findByAccountId(accountId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_A_MEMBER));

        ProductOption option = productOptionRepository.findById(command.optionId())
            .orElseThrow(() -> new BusinessException(ErrorCode.OPTION_NOT_FOUND));

        int updated = optionStockRepository.decreaseQuantityIfEnough(
            command.optionId(), command.quantity());
        if (updated == 0) {
            // affected=0 은 (a) stock 행 부재 또는 (b) quantity < qty 둘 중 하나.
            // 시드/트리거로 옵션과 stock 행이 1:1 보장되므로, 운영상 의미는 재고 부족이다.
            throw new BusinessException(ErrorCode.INSUFFICIENT_AMOUNT);
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
