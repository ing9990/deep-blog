package com.deepblog.payment.charge;

public record PaymentChargeResponse(
    boolean paid,
    String paymentId,
    String reason
) {

    public static PaymentChargeResponse success(String paymentId) {
        return new PaymentChargeResponse(true, paymentId, null);
    }

    public static PaymentChargeResponse failure(String reason) {
        return new PaymentChargeResponse(false, null, reason);
    }
}
