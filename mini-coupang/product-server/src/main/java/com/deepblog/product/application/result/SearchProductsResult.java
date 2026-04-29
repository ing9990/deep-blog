package com.deepblog.product.application.result;

import java.util.List;

/**
 * 검색 결과. items 는 검색 ID 순서를 그대로 보존.
 */
public record SearchProductsResult(List<Item> items) {

    public record Item(
        Long productId,
        Long sellerId,
        Long categoryId,
        String name,
        String description,
        Long basePrice,
        String status,
        double score
    ) {}
}
