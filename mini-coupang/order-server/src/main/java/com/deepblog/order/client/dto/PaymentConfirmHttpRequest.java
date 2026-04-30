package com.deepblog.order.client.dto;

public record PaymentConfirmHttpRequest(
    String paymentKey,
    String orderRef,
    long amount,
    boolean simulateFailure
) {
}
