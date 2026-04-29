package com.deepblog.order.client.dto;

public record PaymentConfirmHttpResponse(
    boolean paid,
    String paymentId,
    String reason
) {
}
