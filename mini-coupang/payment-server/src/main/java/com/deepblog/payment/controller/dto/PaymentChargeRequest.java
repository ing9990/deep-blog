package com.deepblog.payment.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record PaymentChargeRequest(
    @NotBlank String orderRef,
    @PositiveOrZero long amount,
    boolean simulateFailure
) {
}
