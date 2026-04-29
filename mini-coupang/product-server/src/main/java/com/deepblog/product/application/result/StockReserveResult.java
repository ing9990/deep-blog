package com.deepblog.product.application.result;

public record StockReserveResult(
    long optionId,
    long reservedQuantity,
    long remainingStock
) {

    public static StockReserveResult of(long optionId, long reservedQuantity, long remainingStock) {
        return new StockReserveResult(optionId, reservedQuantity, remainingStock);
    }
}
