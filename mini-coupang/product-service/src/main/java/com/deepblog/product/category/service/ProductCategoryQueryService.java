package com.deepblog.product.category.service;

import com.deepblog.product.category.entity.ProductCategory;
import com.deepblog.product.category.entity.ProductCategoryStatus;
import com.deepblog.product.category.model.response.CategoryNodeResponse;
import com.deepblog.product.category.repository.ProductCategoryRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductCategoryQueryService {

    private final ProductCategoryRepository repository;

    public List<CategoryNodeResponse> findActiveTree() {
        List<ProductCategory> active = repository
            .findAllByStatusOrderByDepthAscDisplayOrderAsc(ProductCategoryStatus.ACTIVE);
        return buildTree(active);
    }

    public boolean existsActive(Long categoryId) {
        return repository.existsByIdAndStatus(categoryId, ProductCategoryStatus.ACTIVE);
    }

    private List<CategoryNodeResponse> buildTree(List<ProductCategory> flat) {
        Map<Long, List<CategoryNodeResponse>> childrenBuckets = new HashMap<>();
        Map<Long, CategoryNodeResponse> byId = new HashMap<>();
        List<CategoryNodeResponse> roots = new ArrayList<>();

        for (ProductCategory c : flat) {
            List<CategoryNodeResponse> children = new ArrayList<>();
            CategoryNodeResponse node = CategoryNodeResponse.of(c, children);
            byId.put(c.getId(), node);
            childrenBuckets.put(c.getId(), children);

            if (c.isRoot()) {
                roots.add(node);
            } else {
                List<CategoryNodeResponse> parentBucket = childrenBuckets.get(c.getParentId());
                if (parentBucket == null) {
                    roots.add(node);
                } else {
                    parentBucket.add(node);
                }
            }
        }
        return roots;
    }
}
