package com.deepblog.order.application.result;

import com.deepblog.order.domain.Order;

/**
 * confirm 결과. paymentId 는 payment-server 가 발급한 자체 결제 식별자.
 */
public record ConfirmOrderResult(
    Long orderId,
    Long memberId,
    String status,
    Long totalAmount,
    String paymentId
) {

    public static ConfirmOrderResult of(Order order, String paymentId) {
        return new ConfirmOrderResult(
            order.getId(),
            order.getMemberId(),
            order.getStatus().name(),
            order.getTotalAmount(),
            paymentId
        );
    }
}
