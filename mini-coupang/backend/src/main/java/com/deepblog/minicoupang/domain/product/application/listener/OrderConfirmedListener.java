package com.deepblog.minicoupang.domain.product.application.listener;

import com.deepblog.minicoupang.domain.order.application.event.OrderConfirmed;
import com.deepblog.minicoupang.domain.product.application.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

// 주문확정 이벤트를 받아 ProductService 의 트랜잭션 메서드로 위임한다.
// in-process @EventListener (동기, 같은 트랜잭션) 이므로 OrderService 의 write 트랜잭션 안에서
// publishEvent → 리스너 → decreaseQuantityIfEnough 가 한 트랜잭션으로 묶여 commit 한 번에 끝난다.
// "주문 INSERT 가 커밋되었는데 재고는 차감 안 됨" 같은 어긋남이 발생하지 않는다.
//
// 트레이드오프: 비동기 Kafka 분리 대비 결합도가 높다 (재고 차감 실패가 주문 트랜잭션을 롤백시킨다).
// Outbox + Kafka + ProcessedEvent 멱등 컨슈머 풀스펙은 별도 글에서 다룬다.
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderConfirmedListener {

    private final ProductService productService;

    @EventListener
    public void on(OrderConfirmed event) {
        productService.decreaseStockOnOrderConfirmed(event);
    }
}
