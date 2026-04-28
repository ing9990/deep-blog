package com.deepblog.minicoupang.domain.product.application;

import com.deepblog.minicoupang.domain.order.application.event.OrderConfirmed;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

// Unit 2 §4: 주문확정 후 MySQL `option_stock` 을 영구 차감한다.
//
// `decreaseQuantityIfEnough` 의 WHERE quantity >= :qty 가 마지막 안전망 역할을 한다.
// affected=0 은 (Redis 재고 유실 등으로) Redis 와 MySQL 이 어긋난 케이스이며, 이때는
// 결제는 끝났는데 영구 차감은 실패한 상태가 남는다. 로그로만 노출하고 사후 보상 흐름
// (환불/재고 복구) 은 별도 글에서 다룬다.
//
// 호출자는 OrderConfirmedListener (AFTER_COMMIT). 리스너 메서드와 @Transactional 메서드를
// 별도 빈으로 두는 것은 Spring 6.2 이후 RestrictedTransactionalEventListenerFactory 가
// @TransactionalEventListener + @Transactional 동일 메서드를 차단하기 때문.
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final OptionStockRepository optionStockRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void decreaseStockOnOrderConfirmed(OrderConfirmed event) {
        int updated = optionStockRepository.decreaseQuantityIfEnough(event.optionId(), event.quantity());
        if (updated == 0) {
            log.error(
                "OrderConfirmed received but MySQL stock decrement failed (Redis-MySQL drift?). orderId={}, optionId={}, quantity={}",
                event.orderId(), event.optionId(), event.quantity()
            );
        }
    }
}
