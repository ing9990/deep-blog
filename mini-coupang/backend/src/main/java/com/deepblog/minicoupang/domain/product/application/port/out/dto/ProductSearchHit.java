package com.deepblog.minicoupang.domain.product.application.port.out.dto;

/**
 * One result from the semantic index, carrying the product id and the
 * similarity score (cosine, range [0.0, 1.0]).
 */
public record ProductSearchHit(
    long productId,
    float score
) {}
