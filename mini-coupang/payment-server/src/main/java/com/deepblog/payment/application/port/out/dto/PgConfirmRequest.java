package com.deepblog.payment.application.port.out.dto;

public record PgConfirmRequest(
    String paymentKey,
    String orderRef,
    long amount
) {
}
