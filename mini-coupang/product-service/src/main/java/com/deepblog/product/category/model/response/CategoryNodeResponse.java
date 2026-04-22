package com.deepblog.product.category.model.response;

import com.deepblog.product.category.entity.ProductCategory;
import java.util.ArrayList;
import java.util.List;

public record CategoryNodeResponse(
    Long id,
    Long parentId,
    String name,
    String slug,
    int depth,
    String path,
    int displayOrder,
    List<CategoryNodeResponse> children
) {
    public static CategoryNodeResponse of(ProductCategory c, List<CategoryNodeResponse> children) {
        return new CategoryNodeResponse(
            c.getId(),
            c.getParentId(),
            c.getName(),
            c.getSlug(),
            c.getDepth(),
            c.getPath(),
            c.getDisplayOrder(),
            children == null ? new ArrayList<>() : children
        );
    }
}
