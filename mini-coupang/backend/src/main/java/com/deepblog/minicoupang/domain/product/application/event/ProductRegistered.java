package com.deepblog.minicoupang.domain.product.application.event;

import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductIndexCommand;
import com.deepblog.minicoupang.domain.product.domain.Product;
import java.time.Instant;

/**
 * Published by {@code SellerProductService} after a product row is committed.
 * Carries the snapshot needed by downstream indexers so listeners do not have
 * to re-read the database. {@code publishedAt} is stamped at publication time
 * so async listeners can measure queue wait and end-to-end indexing latency
 * against the same origin clock.
 */
public record ProductRegistered(
    long productId,
    String name,
    String description,
    long categoryId,
    long basePrice,
    String status,
    long sellerId,
    Instant publishedAt
) {

    public static ProductRegistered from(Product product) {
        return new ProductRegistered(
            product.getId(),
            product.getName(),
            product.getDescription(),
            product.getCategoryId(),
            product.getBasePrice(),
            product.getStatus().name(),
            product.getSeller().getId(),
            Instant.now()
        );
    }

    public ProductIndexCommand toIndexCommand() {
        return new ProductIndexCommand(
            productId,
            name,
            description,
            categoryId,
            basePrice,
            status,
            sellerId
        );
    }
}
