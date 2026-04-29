package com.deepblog.notification.event.payload;

public record OrderPaymentFailedPayload(
    Long memberId,
    Long optionId,
    Long quantity,
    String reason
) {
}
