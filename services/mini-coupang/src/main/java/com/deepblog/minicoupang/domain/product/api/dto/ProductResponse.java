package com.deepblog.minicoupang.domain.product.api.dto;

import com.deepblog.minicoupang.domain.product.Product;

public record ProductResponse(
        Long id,
        Long sellerId,
        String sellerName,
        String name,
        Long price,
        Integer stock
) {
    public static ProductResponse from(Product product) {
        if (product.getId() == null) {
            throw new IllegalStateException("persisted Product must have id");
        }
        return new ProductResponse(
                product.getId(),
                product.getSellerId(),
                product.getSellerName(),
                product.getName(),
                product.getPrice(),
                product.getStock());
    }
}
