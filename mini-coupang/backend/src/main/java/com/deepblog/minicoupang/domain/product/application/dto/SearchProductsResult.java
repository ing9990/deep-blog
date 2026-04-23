package com.deepblog.minicoupang.domain.product.application.dto;

import java.util.List;

/**
 * Service-to-controller result of hybrid product search. Items are in the
 * final RRF order. Controller is responsible for translating this into
 * HTTP response DTOs.
 */
public record SearchProductsResult(List<Item> items) {

    public record Item(
        Long productId,
        Long sellerId,
        Long categoryId,
        String name,
        String description,
        Long basePrice,
        String status
    ) {}
}
