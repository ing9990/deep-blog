package com.deepblog.minicoupang.domain.product.application.port.out.dto;

/**
 * Optional filters for search and similar-product queries. Any field may be
 * {@code null}, meaning "do not constrain on this axis".
 */
public record ProductSearchFilter(
    Long categoryId,
    Long minPrice,
    Long maxPrice,
    String status
) {}
