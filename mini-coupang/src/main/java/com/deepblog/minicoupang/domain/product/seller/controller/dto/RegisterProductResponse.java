package com.deepblog.minicoupang.domain.product.seller.controller.dto;

import com.deepblog.minicoupang.domain.product.seller.application.RegisterProductResult;

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
