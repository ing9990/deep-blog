package com.deepblog.product.event.payload;

public record OrderConfirmedPayload(
    Long orderId,
    Long memberId,
    Long optionId,
    Long quantity,
    Long totalAmount
) {
}
