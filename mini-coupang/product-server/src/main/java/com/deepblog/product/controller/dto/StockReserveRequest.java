package com.deepblog.product.controller.dto;

import jakarta.validation.constraints.Positive;

public record StockReserveRequest(
    @Positive(message = "수량은 1 이상이어야 합니다.")
    long quantity
) {
}
