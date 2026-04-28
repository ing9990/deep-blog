package com.deepblog.payment.charge;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record PaymentChargeRequest(
    @NotBlank String orderRef,
    @PositiveOrZero long amount,
    boolean simulateFailure
) {
}
