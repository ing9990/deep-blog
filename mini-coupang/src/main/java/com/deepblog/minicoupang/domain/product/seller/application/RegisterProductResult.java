package com.deepblog.minicoupang.domain.product.seller.application;

import com.deepblog.minicoupang.domain.product.domain.Product;

public record RegisterProductResult(
    Long productId,
    Long sellerId,
    Long categoryId,
    String name,
    Long basePrice,
    String status,
    int optionCount,
    int imageCount
) {

    public static RegisterProductResult from(Product product) {
        return new RegisterProductResult(
            product.getId(),
            product.getSeller().getId(),
            product.getCategoryId(),
            product.getName(),
            product.getBasePrice(),
            product.getStatus().name(),
            product.getOptions().size(),
            product.getImages().size()
        );
    }
}
