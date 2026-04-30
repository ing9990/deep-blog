package com.deepblog.product.application.result;

import java.time.Instant;
import java.util.List;

public record ListMyProductsResult(List<Item> items, int page, int size, long total) {

    public record Item(
        Long productId,
        Long categoryId,
        String name,
        Long basePrice,
        String status,
        int optionCount,
        int imageCount,
        Instant createdAt
    ) {}
}
