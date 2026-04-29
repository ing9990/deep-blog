package com.deepblog.order.client.dto;

public record PaymentChargeHttpRequest(
    String orderRef,
    long amount,
    boolean simulateFailure
) {
}
