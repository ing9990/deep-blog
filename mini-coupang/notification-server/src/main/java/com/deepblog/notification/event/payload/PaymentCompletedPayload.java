package com.deepblog.notification.event.payload;

public record PaymentCompletedPayload(
    String paymentId,
    String orderRef,
    Long amount
) {
}
