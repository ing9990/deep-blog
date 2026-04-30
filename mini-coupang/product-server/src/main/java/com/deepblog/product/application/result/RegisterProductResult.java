package com.deepblog.product.application.result;

import com.deepblog.product.domain.Product;

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
