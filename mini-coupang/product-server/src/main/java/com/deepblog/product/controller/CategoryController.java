package com.deepblog.product.controller;

import com.deepblog.product.application.CategoryService;
import com.deepblog.product.controller.dto.CategoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<CategoryResponse> list() {
        return ResponseEntity.ok(CategoryResponse.from(categoryService.listAll()));
    }
}
