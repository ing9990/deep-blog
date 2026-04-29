package com.deepblog.product.application.command;

/**
 * 상품 검색 입력. {@code null} 필드는 해당 축에 제약 없음을 의미.
 */
public record SearchProductsQuery(
    String q,
    Long categoryId,
    Long minPrice,
    Long maxPrice,
    int limit
) {
}
