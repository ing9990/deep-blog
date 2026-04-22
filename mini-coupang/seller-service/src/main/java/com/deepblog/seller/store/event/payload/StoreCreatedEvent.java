package com.deepblog.seller.store.event.payload;

import com.deepblog.common.event.BaseEvent;
import com.deepblog.seller.store.entity.Store;

public final class StoreCreatedEvent extends BaseEvent<StoreCreatedEvent.Payload> {

    public static final String TYPE = "STORE_CREATED";

    private final Payload payload;

    public StoreCreatedEvent(Store store) {
        this.payload = new Payload(
            store.getId(),
            store.getSellerId(),
            store.getName(),
            store.getSlug(),
            store.getDescription(),
            store.getLogoImageUrl(),
            store.getCoverImageUrl(),
            store.getStatus().name()
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
        Long storeId,
        Long sellerId,
        String name,
        String slug,
        String description,
        String logoImageUrl,
        String coverImageUrl,
        String status
    ) {
    }
}
