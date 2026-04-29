package com.deepblog.product.application.command;

public record StockReserveCommand(
    long optionId,
    long quantity
) {
}
