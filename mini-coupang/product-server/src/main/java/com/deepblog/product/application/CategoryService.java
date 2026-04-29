package com.deepblog.product.application;

import com.deepblog.product.application.result.CategoryListResult;
import com.deepblog.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryListResult listAll() {
        var items = categoryRepository.findAll().stream()
            .map(c -> new CategoryListResult.Item(c.getId(), c.getName(), c.getParentId()))
            .toList();
        return new CategoryListResult(items);
    }
}
