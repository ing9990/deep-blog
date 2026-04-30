package com.deepblog.product.controller.dto;

import com.deepblog.product.application.result.StockReserveResult;

public record StockReserveResponse(
    long optionId,
    long reservedQuantity,
    long remainingStock
) {

    public static StockReserveResponse from(StockReserveResult result) {
        return new StockReserveResponse(
            result.optionId(),
            result.reservedQuantity(),
            result.remainingStock()
        );
    }
}
