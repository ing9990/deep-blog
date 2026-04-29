package com.deepblog.payment.controller.dto;

import com.deepblog.payment.application.result.PaymentConfirmResult;

public record PaymentConfirmResponse(
    boolean paid,
    String paymentId,
    String reason
) {

    public static PaymentConfirmResponse from(PaymentConfirmResult result) {
        return new PaymentConfirmResponse(result.paid(), result.paymentId(), result.reason());
    }
}
