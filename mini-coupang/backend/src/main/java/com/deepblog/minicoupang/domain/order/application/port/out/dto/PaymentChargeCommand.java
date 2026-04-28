package com.deepblog.minicoupang.domain.order.application.port.out.dto;

/**
 * Domain command for charging a payment. Carries the minimum the gateway needs.
 * `simulateFailure` is a stub-only knob to drive the §4 보상 시나리오 테스트.
 */
public record PaymentChargeCommand(
    String orderRef,
    long amount,
    boolean simulateFailure
) {
}
