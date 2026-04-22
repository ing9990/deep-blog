package com.deepblog.seller.product.model.response;

import com.deepblog.seller.product.entity.Product;

public record ProductResponse(
    Long id,
    Long sellerId,
    Long storeId,
    Long categoryId,
    String sku,
    String name,
    long price,
    String currency,
    String mainImageUrl,
    String status
) {

    public static ProductResponse from(Product product) {
        return new ProductResponse(
            product.getId(),
            product.getSellerId(),
            product.getStoreId(),
            product.getCategoryId(),
            product.getSku(),
            product.getName(),
            product.getPrice(),
            product.getCurrency(),
            product.getMainImageUrl(),
            product.getStatus().name()
        );
    }
}
