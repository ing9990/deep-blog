package com.deepblog.minicoupang.domain.product.application.port.out.dto;

/**
 * Natural-language search request bound for the semantic side of hybrid search.
 * {@code filter} may be {@code null} when no constraints apply.
 */
public record ProductSearchQuery(
    String query,
    int limit,
    ProductSearchFilter filter
) {}
