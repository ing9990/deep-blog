package com.deepblog.product.category.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.product.category.model.response.CategoryNodeResponse;
import com.deepblog.product.category.service.ProductCategoryQueryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class ProductCategoryQueryController {

    private final ProductCategoryQueryService queryService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<CategoryNodeResponse>>> tree() {
        return ResponseEntity.ok(CommonResponse.ok(queryService.findActiveTree()));
    }
}
