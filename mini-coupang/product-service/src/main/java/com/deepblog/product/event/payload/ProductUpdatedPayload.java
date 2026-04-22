package com.deepblog.product.event.payload;

public record ProductUpdatedPayload(
    Long productId,
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
}
