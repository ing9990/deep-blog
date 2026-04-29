package com.deepblog.product.controller.dto;

import com.deepblog.product.application.result.CategoryListResult;
import java.util.List;

public record CategoryResponse(List<Item> items) {

    public record Item(Long id, String name, Long parentId) {}

    public static CategoryResponse from(CategoryListResult result) {
        List<Item> items = result.items().stream()
            .map(i -> new Item(i.id(), i.name(), i.parentId()))
            .toList();
        return new CategoryResponse(items);
    }
}
