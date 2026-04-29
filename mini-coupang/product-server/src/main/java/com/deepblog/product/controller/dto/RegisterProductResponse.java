package com.deepblog.product.controller.dto;

import com.deepblog.product.application.result.RegisterProductResult;

public record RegisterProductResponse(
    Long productId,
    Long sellerId,
    Long categoryId,
    String name,
    Long basePrice,
    String status,
    int optionCount,
    int imageCount
) {

    public static RegisterProductResponse from(RegisterProductResult result) {
        return new RegisterProductResponse(
            result.productId(),
            result.sellerId(),
            result.categoryId(),
            result.name(),
            result.basePrice(),
            result.status(),
            result.optionCount(),
            result.imageCount()
        );
    }
}
