package com.deepblog.minicoupang.infrastructure.clients.payment.dto;

public record PaymentChargeHttpRequest(
    String orderRef,
    long amount,
    boolean simulateFailure
) {
}
