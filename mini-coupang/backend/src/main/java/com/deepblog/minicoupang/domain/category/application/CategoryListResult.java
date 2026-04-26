package com.deepblog.minicoupang.domain.category.application;

import java.util.List;

public record CategoryListResult(List<Item> items) {
    public record Item(Long id, String name, Long parentId) {}
}
