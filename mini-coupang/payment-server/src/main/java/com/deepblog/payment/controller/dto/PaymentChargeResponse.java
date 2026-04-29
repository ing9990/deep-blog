package com.deepblog.payment.controller.dto;

import com.deepblog.payment.application.result.PaymentChargeResult;

public record PaymentChargeResponse(
    boolean paid,
    String paymentId,
    String reason
) {

    public static PaymentChargeResponse from(PaymentChargeResult result) {
        return new PaymentChargeResponse(result.paid(), result.paymentId(), result.reason());
    }
}
