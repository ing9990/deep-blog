package com.deepblog.minicoupang.domain.product.seller.controller.dto;

import com.deepblog.minicoupang.domain.product.domain.Product;

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

    public static RegisterProductResponse from(Product product) {
        return new RegisterProductResponse(
            product.getId(),
            product.getSellerId(),
            product.getCategoryId(),
            product.getName(),
            product.getBasePrice(),
            product.getStatus().name(),
            product.getOptions().size(),
            product.getImages().size()
        );
    }
}
