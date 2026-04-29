package com.deepblog.payment.application.result;

public record PaymentChargeResult(
    boolean paid,
    String paymentId,
    String reason
) {

    public static PaymentChargeResult success(String paymentId) {
        return new PaymentChargeResult(true, paymentId, null);
    }

    public static PaymentChargeResult failure(String reason) {
        return new PaymentChargeResult(false, null, reason);
    }
}
