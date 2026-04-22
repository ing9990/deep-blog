package com.deepblog.seller.product.event.payload;

import com.deepblog.common.event.BaseEvent;
import com.deepblog.seller.product.entity.Product;

public final class ProductUpdatedEvent extends BaseEvent<ProductUpdatedEvent.Payload> {

    public static final String TYPE = "PRODUCT_UPDATED";

    private final Payload payload;

    public ProductUpdatedEvent(Product product) {
        this.payload = new Payload(
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

    @Override
    public String eventType() {
        return TYPE;
    }

    @Override
    public Payload payload() {
        return payload;
    }

    public record Payload(
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
}
