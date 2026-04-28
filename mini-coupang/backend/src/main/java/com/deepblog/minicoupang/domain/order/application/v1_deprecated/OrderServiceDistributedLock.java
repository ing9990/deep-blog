package com.deepblog.minicoupang.domain.order.application.v1_deprecated;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.application.PlaceOrderCommand;
import com.deepblog.minicoupang.domain.order.application.PlaceOrderResult;
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

// Unit 2 구 §4 (블로그 자산, Lua + Saga 로 교체됨): Redis 분산 락(Redisson RLock) + @Modifying 원자 UPDATE.
// 정합성 보증의 실주체는 DB 행 X 락이고, Redis 락은 멀티 인스턴스 환경에서 DB 진입 자체를 줄이는
// 코디네이션 도구로 작동했다. 락이 commit 보다 먼저 풀린다는 점이 본질적 한계.
// 새 §4 (Redis Lua reserveStock + Saga release) 와 비교용 자산으로 보존.
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
        boolean acquired = false;
        try {
            acquired = lock.tryLock(WAIT_TIME_SECONDS, TimeUnit.SECONDS);
            if (!acquired) {
                throw new BusinessException(ErrorCode.LOCK_ACQUIRE_FAILED);
            }
            return doPlaceOrder(accountId, command);
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

        int updated = optionStockRepository.decreaseQuantityIfEnough(
            command.optionId(), command.quantity());
        if (updated == 0) {
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
