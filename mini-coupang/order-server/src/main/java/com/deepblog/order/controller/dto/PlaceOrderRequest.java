package com.deepblog.order.controller.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * 단건 주문 요청. {@code simulateFailure} 는 보상 시나리오 측정용 스텁 플래그
 * (실제 클라이언트는 false 또는 생략).
 */
public record PlaceOrderRequest(
    @NotNull(message = "옵션 식별자는 필수입니다.")
    @Positive(message = "옵션 식별자는 양수여야 합니다.")
    Long optionId,

    @NotNull(message = "수량은 필수입니다.")
    @Positive(message = "수량은 1 이상이어야 합니다.")
    Long quantity,

    boolean simulateFailure
) {
}
