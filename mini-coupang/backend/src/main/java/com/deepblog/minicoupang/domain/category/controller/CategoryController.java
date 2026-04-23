package com.deepblog.minicoupang.domain.category.controller;

import com.deepblog.minicoupang.domain.category.application.CategoryService;
import com.deepblog.minicoupang.domain.category.controller.dto.CategoryResponse;
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
