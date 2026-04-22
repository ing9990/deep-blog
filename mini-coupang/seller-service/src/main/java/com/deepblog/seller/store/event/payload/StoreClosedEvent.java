package com.deepblog.seller.store.event.payload;

import com.deepblog.common.event.BaseEvent;
import com.deepblog.seller.store.entity.Store;

public final class StoreClosedEvent extends BaseEvent<StoreClosedEvent.Payload> {

    public static final String TYPE = "STORE_CLOSED";

    private final Payload payload;

    public StoreClosedEvent(Store store) {
        this.payload = new Payload(
            store.getId(),
            store.getSellerId(),
            store.getClosedAt() == null ? null : store.getClosedAt().toString()
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
        String closedAt
    ) {
    }
}
