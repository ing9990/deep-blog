package com.deepblog.seller.store.service;

import com.deepblog.common.error.BusinessException;
import com.deepblog.common.event.BaseEvent;
import com.deepblog.seller.outbox.entity.OutboxEvent;
import com.deepblog.seller.outbox.repository.OutboxEventRepository;
import com.deepblog.seller.store.common.exception.StoreErrorCode;
import com.deepblog.seller.store.entity.Store;
import com.deepblog.seller.store.event.payload.StoreClosedEvent;
import com.deepblog.seller.store.event.payload.StoreCreatedEvent;
import com.deepblog.seller.store.event.payload.StoreUpdatedEvent;
import com.deepblog.seller.store.model.request.CreateStoreRequest;
import com.deepblog.seller.store.model.request.UpdateStoreRequest;
import com.deepblog.seller.store.repository.StoreRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreCommandService {

    private static final String AGGREGATE_TYPE = "seller.store";

    private final StoreRepository storeRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Store create(Long sellerId, CreateStoreRequest request) {
        if (storeRepository.existsBySlug(request.slug())) {
            throw new BusinessException(StoreErrorCode.SLUG_ALREADY_EXISTS);
        }
        Store store = Store.openNew(
            sellerId,
            request.name(),
            request.slug(),
            request.description(),
            request.logoImageUrl(),
            request.coverImageUrl()
        );
        Store saved;
        try {
            saved = storeRepository.save(store);
        } catch (DataIntegrityViolationException concurrent) {
            throw new BusinessException(StoreErrorCode.SLUG_ALREADY_EXISTS);
        }
        recordOutbox(saved, StoreCreatedEvent.TYPE, new StoreCreatedEvent(saved));
        return saved;
    }

    @Transactional
    public Store update(Long sellerId, Long storeId, UpdateStoreRequest request) {
        Store store = loadOwned(sellerId, storeId);
        if (store.isClosed()) {
            throw new BusinessException(StoreErrorCode.STORE_ALREADY_CLOSED);
        }
        store.update(
            request.name(),
            request.description(),
            request.logoImageUrl(),
            request.coverImageUrl()
        );
        recordOutbox(store, StoreUpdatedEvent.TYPE, new StoreUpdatedEvent(store));
        return store;
    }

    @Transactional
    public Store close(Long sellerId, Long storeId) {
        Store store = loadOwned(sellerId, storeId);
        if (store.isClosed()) {
            throw new BusinessException(StoreErrorCode.STORE_ALREADY_CLOSED);
        }
        store.close();
        recordOutbox(store, StoreClosedEvent.TYPE, new StoreClosedEvent(store));
        return store;
    }

    private Store loadOwned(Long sellerId, Long storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new BusinessException(StoreErrorCode.STORE_NOT_FOUND));
        if (!store.isOwnedBy(sellerId)) {
            throw new BusinessException(StoreErrorCode.STORE_FORBIDDEN);
        }
        return store;
    }

    private void recordOutbox(Store store, String eventType, BaseEvent<?> event) {
        outboxEventRepository.save(OutboxEvent.of(
            AGGREGATE_TYPE,
            store.getId().toString(),
            eventType,
            serialize(event)
        ));
    }

    private String serialize(BaseEvent<?> event) {
        try {
            return objectMapper.writeValueAsString(event.toEnvelope(objectMapper));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(
                "failed to serialize event " + event.eventType(), e
            );
        }
    }
}
