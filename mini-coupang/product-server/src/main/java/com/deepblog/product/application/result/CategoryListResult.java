package com.deepblog.product.application.result;

import java.util.List;

public record CategoryListResult(List<Item> items) {
    public record Item(Long id, String name, Long parentId) {}
}
