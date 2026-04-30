package com.deepblog.order.controller.dto;

import com.deepblog.order.application.result.ConfirmOrderResult;

public record ConfirmOrderResponse(
    Long orderId,
    Long memberId,
    String status,
    Long totalAmount,
    String paymentId
) {

    public static ConfirmOrderResponse from(ConfirmOrderResult r) {
        return new ConfirmOrderResponse(
            r.orderId(),
            r.memberId(),
            r.status(),
            r.totalAmount(),
            r.paymentId()
        );
    }
}
