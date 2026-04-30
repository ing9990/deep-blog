package com.deepblog.order.controller.dto;

import com.deepblog.order.application.result.PrepareOrderResult;

public record PrepareOrderResponse(
    Long orderId,
    Long memberId,
    String status,
    Long amount,
    Long optionId,
    Long quantity
) {

    public static PrepareOrderResponse from(PrepareOrderResult r) {
        return new PrepareOrderResponse(
            r.orderId(),
            r.memberId(),
            r.status(),
            r.amount(),
            r.optionId(),
            r.quantity()
        );
    }
}
