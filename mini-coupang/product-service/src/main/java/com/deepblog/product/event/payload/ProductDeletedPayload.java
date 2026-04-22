package com.deepblog.product.event.payload;

public record ProductDeletedPayload(Long productId, Long sellerId, Long storeId) {
}
