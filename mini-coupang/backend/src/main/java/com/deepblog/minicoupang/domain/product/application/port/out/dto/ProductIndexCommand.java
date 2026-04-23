package com.deepblog.minicoupang.domain.product.application.port.out.dto;

/**
 * Domain-side instruction to add or refresh a product in the search index.
 * The adapter translates this into whatever wire format the indexer uses.
 */
public record ProductIndexCommand(
    long productId,
    String name,
    String description,
    long categoryId,
    long basePrice,
    String status,
    long sellerId
) {}
