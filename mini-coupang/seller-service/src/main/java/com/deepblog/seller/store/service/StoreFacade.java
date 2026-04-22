package com.deepblog.seller.store.service;

import com.deepblog.common.event.EventTopic;
import com.deepblog.common.event.KafkaEventPublisher;
import com.deepblog.seller.store.entity.Store;
import com.deepblog.seller.store.event.payload.StoreClosedEvent;
import com.deepblog.seller.store.event.payload.StoreCreatedEvent;
import com.deepblog.seller.store.event.payload.StoreUpdatedEvent;
import com.deepblog.seller.store.model.request.CreateStoreRequest;
import com.deepblog.seller.store.model.request.UpdateStoreRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StoreFacade {

    private final StoreCommandService commandService;
    private final KafkaEventPublisher eventPublisher;

    public Store create(Long sellerId, CreateStoreRequest request) {
        Store store = commandService.create(sellerId, request);
        eventPublisher.publish(
            EventTopic.SELLER,
            partitionKey(store),
            new StoreCreatedEvent(store)
        );
        return store;
    }

    public Store update(Long sellerId, Long storeId, UpdateStoreRequest request) {
        Store store = commandService.update(sellerId, storeId, request);
        eventPublisher.publish(
            EventTopic.SELLER,
            partitionKey(store),
            new StoreUpdatedEvent(store)
        );
        return store;
    }

    public Store close(Long sellerId, Long storeId) {
        Store store = commandService.close(sellerId, storeId);
        eventPublisher.publish(
            EventTopic.SELLER,
            partitionKey(store),
            new StoreClosedEvent(store)
        );
        return store;
    }

    private String partitionKey(Store store) {
        return store.getId().toString();
    }
}
