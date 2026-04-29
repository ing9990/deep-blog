package com.deepblog.order.controller.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * 주문 준비 요청 (결제 인증 직전).
 */
public record PrepareOrderRequest(
    @NotNull(message = "옵션 식별자는 필수입니다.")
    @Positive(message = "옵션 식별자는 양수여야 합니다.")
    Long optionId,

    @NotNull(message = "수량은 필수입니다.")
    @Positive(message = "수량은 1 이상이어야 합니다.")
    Long quantity
) {
}
