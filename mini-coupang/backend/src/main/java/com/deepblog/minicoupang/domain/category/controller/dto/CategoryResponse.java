package com.deepblog.minicoupang.domain.category.controller.dto;

import com.deepblog.minicoupang.domain.category.application.CategoryListResult;
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
