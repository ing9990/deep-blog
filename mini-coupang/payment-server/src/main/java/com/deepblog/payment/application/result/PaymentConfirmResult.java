package com.deepblog.payment.application.result;

public record PaymentConfirmResult(
    boolean paid,
    String paymentId,
    String reason
) {

    public static PaymentConfirmResult success(String paymentId) {
        return new PaymentConfirmResult(true, paymentId, null);
    }

    public static PaymentConfirmResult failure(String reason) {
        return new PaymentConfirmResult(false, null, reason);
    }
}
