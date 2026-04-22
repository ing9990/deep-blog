package com.deepblog.seller.product.service;

import com.deepblog.common.error.BusinessException;
import com.deepblog.common.event.BaseEvent;
import com.deepblog.seller.outbox.entity.OutboxEvent;
import com.deepblog.seller.outbox.repository.OutboxEventRepository;
import com.deepblog.seller.product.common.exception.ProductErrorCode;
import com.deepblog.seller.product.entity.Product;
import com.deepblog.seller.product.event.payload.ProductDeletedEvent;
import com.deepblog.seller.product.event.payload.ProductRegisteredEvent;
import com.deepblog.seller.product.event.payload.ProductUpdatedEvent;
import com.deepblog.seller.product.model.request.CreateProductRequest;
import com.deepblog.seller.product.model.request.UpdateProductRequest;
import com.deepblog.seller.product.repository.ProductRepository;
import com.deepblog.seller.store.common.exception.StoreErrorCode;
import com.deepblog.seller.store.entity.Store;
import com.deepblog.seller.store.repository.StoreRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductCommandService {

    private static final String AGGREGATE_TYPE = "seller.product";

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Product register(Long sellerId, Long storeId, CreateProductRequest request) {
        Store store = loadOwnedStore(sellerId, storeId);
        if (store.isClosed()) {
            throw new BusinessException(StoreErrorCode.STORE_ALREADY_CLOSED);
        }
        if (productRepository.existsBySellerIdAndSku(sellerId, request.sku())) {
            throw new BusinessException(ProductErrorCode.SKU_ALREADY_EXISTS);
        }
        Product product = Product.register(
            sellerId,
            storeId,
            request.categoryId(),
            request.sku(),
            request.name(),
            request.price(),
            request.mainImageUrl()
        );
        Product saved;
        try {
            saved = productRepository.save(product);
        } catch (DataIntegrityViolationException concurrent) {
            throw new BusinessException(ProductErrorCode.SKU_ALREADY_EXISTS);
        }

        recordOutbox(saved.getStoreId(), ProductRegisteredEvent.TYPE,
            new ProductRegisteredEvent(saved));
        return saved;
    }

    @Transactional
    public Product update(Long sellerId, Long productId, UpdateProductRequest request) {
        Product product = loadOwned(sellerId, productId);
        if (product.isDeleted()) {
            throw new BusinessException(ProductErrorCode.PRODUCT_ALREADY_DELETED);
        }
        product.update(
            request.categoryId(),
            request.name(),
            request.price(),
            request.mainImageUrl()
        );
        recordOutbox(product.getStoreId(), ProductUpdatedEvent.TYPE,
            new ProductUpdatedEvent(product));
        return product;
    }

    @Transactional
    public Product delete(Long sellerId, Long productId) {
        Product product = loadOwned(sellerId, productId);
        if (product.isDeleted()) {
            throw new BusinessException(ProductErrorCode.PRODUCT_ALREADY_DELETED);
        }
        product.delete();
        recordOutbox(product.getStoreId(), ProductDeletedEvent.TYPE,
            new ProductDeletedEvent(product));
        return product;
    }

    private Product loadOwned(Long sellerId, Long productId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new BusinessException(ProductErrorCode.PRODUCT_NOT_FOUND));
        if (!product.isOwnedBy(sellerId)) {
            throw new BusinessException(ProductErrorCode.PRODUCT_FORBIDDEN);
        }
        return product;
    }

    private Store loadOwnedStore(Long sellerId, Long storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new BusinessException(StoreErrorCode.STORE_NOT_FOUND));
        if (!store.isOwnedBy(sellerId)) {
            throw new BusinessException(StoreErrorCode.STORE_FORBIDDEN);
        }
        return store;
    }

    private void recordOutbox(Long storeId, String eventType, BaseEvent<?> event) {
        outboxEventRepository.save(OutboxEvent.of(
            AGGREGATE_TYPE,
            storeId.toString(),
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
