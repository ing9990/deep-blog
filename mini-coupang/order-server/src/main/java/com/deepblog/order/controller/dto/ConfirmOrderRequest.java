package com.deepblog.order.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * 결제 승인 요청. 토스 successUrl 에서 받은 paymentKey 와 amount 를 그대로 전달.
 *
 * <p>{@code simulateFailure} 는 테스트용 스텁 플래그.
 */
public record ConfirmOrderRequest(
    @NotBlank(message = "paymentKey 는 필수입니다.")
    String paymentKey,

    @NotNull(message = "amount 는 필수입니다.")
    @PositiveOrZero(message = "amount 는 0 이상이어야 합니다.")
    Long amount,

    boolean simulateFailure
) {
}
