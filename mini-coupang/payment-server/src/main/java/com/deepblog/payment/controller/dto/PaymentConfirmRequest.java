package com.deepblog.payment.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record PaymentConfirmRequest(
    @NotBlank String paymentKey,
    @NotBlank String orderRef,
    @PositiveOrZero long amount,
    boolean simulateFailure
) {
}
