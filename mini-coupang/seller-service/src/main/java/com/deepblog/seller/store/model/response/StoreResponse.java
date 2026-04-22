package com.deepblog.seller.store.model.response;

import com.deepblog.seller.store.entity.Store;
import java.time.LocalDateTime;

public record StoreResponse(
    Long id,
    Long sellerId,
    String name,
    String slug,
    String description,
    String logoImageUrl,
    String coverImageUrl,
    String status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime closedAt
) {
    public static StoreResponse from(Store store) {
        return new StoreResponse(
            store.getId(),
            store.getSellerId(),
            store.getName(),
            store.getSlug(),
            store.getDescription(),
            store.getLogoImageUrl(),
            store.getCoverImageUrl(),
            store.getStatus().name(),
            store.getCreatedAt(),
            store.getUpdatedAt(),
            store.getClosedAt()
        );
    }
}
