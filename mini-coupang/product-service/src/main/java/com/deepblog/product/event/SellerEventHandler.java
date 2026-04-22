package com.deepblog.product.event;

import com.deepblog.common.event.EventEnvelope;
import com.deepblog.product.catalog.entity.CatalogProduct;
import com.deepblog.product.catalog.entity.CatalogProductStatus;
import com.deepblog.product.catalog.entity.CatalogStore;
import com.deepblog.product.catalog.repository.CatalogProductRepository;
import com.deepblog.product.catalog.repository.CatalogStoreRepository;
import com.deepblog.product.category.entity.ProductCategory;
import com.deepblog.product.category.repository.ProductCategoryRepository;
import com.deepblog.product.common.idempotency.ProcessedEvent;
import com.deepblog.product.common.idempotency.ProcessedEventRepository;
import com.deepblog.product.event.payload.ProductDeletedPayload;
import com.deepblog.product.event.payload.ProductRegisteredPayload;
import com.deepblog.product.event.payload.ProductUpdatedPayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class SellerEventHandler {

    private final CatalogProductRepository catalogProductRepository;
    private final CatalogStoreRepository catalogStoreRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProcessedEventRepository processedEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void handle(EventEnvelope envelope) throws Exception {
        try {
            processedEventRepository.saveAndFlush(
                ProcessedEvent.mark(envelope.eventId(), envelope.eventType())
            );
        } catch (DataIntegrityViolationException duplicate) {
            log.info("duplicate event skipped eventId={} eventType={}",
                envelope.eventId(), envelope.eventType());
            return;
        }
        switch (envelope.eventType()) {
            case "PRODUCT_REGISTERED" -> applyProductRegistered(
                objectMapper.treeToValue(envelope.payload(), ProductRegisteredPayload.class)
            );
            case "PRODUCT_UPDATED" -> applyProductUpdated(
                objectMapper.treeToValue(envelope.payload(), ProductUpdatedPayload.class)
            );
            case "PRODUCT_DELETED" -> applyProductDeleted(
                objectMapper.treeToValue(envelope.payload(), ProductDeletedPayload.class)
            );
            default -> log.debug("skip eventType={}", envelope.eventType());
        }
    }

    private void applyProductRegistered(ProductRegisteredPayload p) {
        String storeName = catalogStoreRepository.findById(p.storeId())
            .map(CatalogStore::getName)
            .orElse("");
        String categoryPath = categoryRepository.findById(p.categoryId())
            .map(ProductCategory::getPath)
            .orElse(null);

        CatalogProduct product = CatalogProduct.builder()
            .id(p.productId())
            .storeId(p.storeId())
            .storeName(storeName)
            .sellerId(p.sellerId())
            .categoryId(p.categoryId())
            .categoryPath(categoryPath)
            .name(p.name())
            .price(p.price())
            .currency(p.currency())
            .mainImageUrl(p.mainImageUrl())
            .shortDescription(null)
            .status(CatalogProductStatus.valueOf(p.status()))
            .build();
        catalogProductRepository.save(product);
    }

    private void applyProductUpdated(ProductUpdatedPayload p) {
        catalogProductRepository.findById(p.productId()).ifPresent(existing ->
            existing.applyUpdate(
                p.categoryId(),
                p.name(),
                p.price(),
                p.mainImageUrl(),
                CatalogProductStatus.valueOf(p.status())
            )
        );
    }

    private void applyProductDeleted(ProductDeletedPayload p) {
        catalogProductRepository.findById(p.productId())
            .ifPresent(CatalogProduct::markDeleted);
    }
}
