package com.deepblog.minicoupang.domain.order.application.port.out.dto;

/**
 * Domain result for a payment charge attempt.
 *
 * `paid` 가 false 면 OrderService 가 Saga 보상으로 reserveStock 을 되돌려야 한다.
 */
public record PaymentChargeOutcome(
    boolean paid,
    String paymentId,
    String reason
) {

    public static PaymentChargeOutcome success(String paymentId) {
        return new PaymentChargeOutcome(true, paymentId, null);
    }

    public static PaymentChargeOutcome failure(String reason) {
        return new PaymentChargeOutcome(false, null, reason);
    }
}
