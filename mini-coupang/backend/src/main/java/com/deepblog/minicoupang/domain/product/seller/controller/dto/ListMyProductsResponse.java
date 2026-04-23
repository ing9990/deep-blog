package com.deepblog.minicoupang.domain.product.seller.controller.dto;

import com.deepblog.minicoupang.domain.product.seller.application.ListMyProductsResult;
import java.time.Instant;
import java.util.List;

public record ListMyProductsResponse(List<Item> items, int page, int size, long total) {

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

    public static ListMyProductsResponse from(ListMyProductsResult r) {
        List<Item> items = r.items().stream()
            .map(i -> new Item(
                i.productId(), i.categoryId(), i.name(), i.basePrice(),
                i.status(), i.optionCount(), i.imageCount(), i.createdAt()))
            .toList();
        return new ListMyProductsResponse(items, r.page(), r.size(), r.total());
    }
}
