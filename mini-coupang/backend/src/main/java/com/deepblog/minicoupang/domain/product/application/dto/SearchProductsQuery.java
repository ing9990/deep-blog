package com.deepblog.minicoupang.domain.product.application.dto;

/**
 * Controller-to-service input for hybrid product search.
 * {@code null} fields mean "no constraint on that axis".
 */
public record SearchProductsQuery(
    String q,
    Long categoryId,
    Long minPrice,
    Long maxPrice,
    int limit
) {}
