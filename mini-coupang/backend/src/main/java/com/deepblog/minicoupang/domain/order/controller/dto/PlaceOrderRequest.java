package com.deepblog.minicoupang.domain.order.controller.dto;

import com.deepblog.minicoupang.domain.order.application.PlaceOrderCommand;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PlaceOrderRequest(
    @NotNull(message = "옵션 ID 는 필수입니다.")
    Long optionId,

    @NotNull(message = "주문 수량은 필수입니다.")
    @Min(value = 1L, message = "주문 수량은 1 이상이어야 합니다.")
    Long quantity
) {

    public PlaceOrderCommand toCommand() {
        return new PlaceOrderCommand(optionId, quantity);
    }
}
