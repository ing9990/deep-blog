package com.deepblog.order.client.dto;

public record PaymentChargeHttpResponse(
    boolean paid,
    String paymentId,
    String reason
) {
}
