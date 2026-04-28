package com.deepblog.minicoupang.infrastructure.clients.payment.dto;

public record PaymentChargeHttpResponse(
    boolean paid,
    String paymentId,
    String reason
) {
}
