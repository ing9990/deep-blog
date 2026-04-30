package com.deepblog.product.controller.dto;

import com.deepblog.product.application.result.SearchProductsResult;
import java.util.List;

public record SearchProductsResponse(int size, List<Item> items) {

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

    public static SearchProductsResponse from(SearchProductsResult result) {
        List<Item> items = result.items().stream()
            .map(i -> new Item(
                i.productId(),
                i.sellerId(),
                i.categoryId(),
                i.name(),
                i.description(),
                i.basePrice(),
                i.status(),
                i.score()
            ))
            .toList();
        return new SearchProductsResponse(items.size(), items);
    }
}
