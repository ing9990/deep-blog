package com.deepblog.order.application.event;

import com.deepblog.common.event.BaseEvent;

/**
 * 재고는 선점됐지만 결제에서 실패한 시점에 발행된다. order-server 는 주문을 영속화하지 않으므로
 * 트랜잭션이 없다. 발행은 Kafka 토픽 {@code order.payment-failed} 로 직접 나가며,
 * product-server consumer 가 받아 Redis 재고를 보상 복구한다.
 */
public class OrderPaymentFailedEvent extends BaseEvent<OrderPaymentFailedEvent.Payload> {

    public OrderPaymentFailedEvent(Long memberId, Long optionId, Long quantity, String reason) {
        super(OrderEventType.ORDER_PAYMENT_FAILED.name(),
              new Payload(memberId, optionId, quantity, reason));
    }

    public record Payload(
        Long memberId,
        Long optionId,
        Long quantity,
        String reason
    ) {
    }
}
