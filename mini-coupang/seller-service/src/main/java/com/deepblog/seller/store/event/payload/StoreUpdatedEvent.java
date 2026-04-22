package com.deepblog.seller.store.event.payload;

import com.deepblog.common.event.BaseEvent;
import com.deepblog.seller.store.entity.Store;

public final class StoreUpdatedEvent extends BaseEvent<StoreUpdatedEvent.Payload> {

    public static final String TYPE = "STORE_UPDATED";

    private final Payload payload;

    public StoreUpdatedEvent(Store store) {
        this.payload = new Payload(
            store.getId(),
            store.getSellerId(),
            store.getName(),
            store.getDescription(),
            store.getLogoImageUrl(),
            store.getCoverImageUrl()
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
        String description,
        String logoImageUrl,
        String coverImageUrl
    ) {
    }
}
