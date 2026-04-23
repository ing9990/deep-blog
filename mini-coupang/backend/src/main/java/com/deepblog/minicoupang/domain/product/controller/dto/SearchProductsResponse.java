package com.deepblog.minicoupang.domain.product.controller.dto;

import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsResult;
import java.util.List;

public record SearchProductsResponse(int size, List<Item> items) {

    public record Item(
        Long productId,
        Long sellerId,
        Long categoryId,
        String name,
        String description,
        Long basePrice,
        String status
    ) {}

    public static SearchProductsResponse from(SearchProductsResult result) {
        List<Item> items = result.items().stream()
            .map(i -> new Item(
                i.productId(),
                i.sellerId(),
                i.categoryId(),
                i.name(),
                i.description(),
                i.basePrice(),
                i.status()
            ))
            .toList();
        return new SearchProductsResponse(items.size(), items);
    }
}
