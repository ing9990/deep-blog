package com.deepblog.product.catalog.model.response;

import com.deepblog.product.catalog.entity.CatalogProduct;

public record CatalogProductResponse(
    Long id,
    Long storeId,
    String storeName,
    Long sellerId,
    Long categoryId,
    String categoryPath,
    String name,
    long price,
    String currency,
    String mainImageUrl,
    String status
) {

    public static CatalogProductResponse from(CatalogProduct product) {
        return new CatalogProductResponse(
            product.getId(),
            product.getStoreId(),
            product.getStoreName(),
            product.getSellerId(),
            product.getCategoryId(),
            product.getCategoryPath(),
            product.getName(),
            product.getPrice(),
            product.getCurrency(),
            product.getMainImageUrl(),
            product.getStatus().name()
        );
    }
}
