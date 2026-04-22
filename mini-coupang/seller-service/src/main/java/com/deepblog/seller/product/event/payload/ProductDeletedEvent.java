package com.deepblog.seller.product.event.payload;

import com.deepblog.common.event.BaseEvent;
import com.deepblog.seller.product.entity.Product;

public final class ProductDeletedEvent extends BaseEvent<ProductDeletedEvent.Payload> {

    public static final String TYPE = "PRODUCT_DELETED";

    private final Payload payload;

    public ProductDeletedEvent(Product product) {
        this.payload = new Payload(
            product.getId(),
            product.getSellerId(),
            product.getStoreId()
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

    public record Payload(Long productId, Long sellerId, Long storeId) {
    }
}
