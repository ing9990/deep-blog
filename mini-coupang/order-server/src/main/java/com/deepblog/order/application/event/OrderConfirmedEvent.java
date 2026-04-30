package com.deepblog.order.application.event;

import com.deepblog.common.event.BaseEvent;

/**
 * 결제까지 성공해 주문이 확정된 시점에 발행된다. AFTER_COMMIT 단계에서 Kafka 토픽
 * {@code order.confirmed} 로 나간다. product-server consumer 가 받아 MySQL OptionStock 차감.
 */
public class OrderConfirmedEvent extends BaseEvent<OrderConfirmedEvent.Payload> {

    public OrderConfirmedEvent(Long orderId, Long memberId, Long optionId, Long quantity, Long totalAmount) {
        super(OrderEventType.ORDER_CONFIRMED.name(),
              new Payload(orderId, memberId, optionId, quantity, totalAmount));
    }

    public record Payload(
        Long orderId,
        Long memberId,
        Long optionId,
        Long quantity,
        Long totalAmount
    ) {
    }
}
