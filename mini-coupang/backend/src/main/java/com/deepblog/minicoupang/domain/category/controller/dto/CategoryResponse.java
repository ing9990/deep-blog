package com.deepblog.minicoupang.domain.category.controller.dto;

import com.deepblog.minicoupang.domain.category.domain.Category;
import java.util.List;

public record CategoryResponse(List<Item> items) {

    public record Item(Long id, String name, Long parentId) {}

    public static CategoryResponse from(List<Category> categories) {
        List<Item> items = categories.stream()
            .map(c -> new Item(c.getId(), c.getName(), c.getParentId()))
            .toList();
        return new CategoryResponse(items);
    }
}
