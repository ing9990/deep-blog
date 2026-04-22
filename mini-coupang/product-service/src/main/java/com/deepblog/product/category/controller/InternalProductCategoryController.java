package com.deepblog.product.category.controller;

import com.deepblog.common.error.BusinessException;
import com.deepblog.common.response.CommonResponse;
import com.deepblog.product.category.common.exception.CategoryErrorCode;
import com.deepblog.product.category.service.ProductCategoryQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/categories")
@RequiredArgsConstructor
public class InternalProductCategoryController {

    private final ProductCategoryQueryService queryService;

    @GetMapping("/{id}/exists")
    public ResponseEntity<CommonResponse<Void>> requireExists(@PathVariable Long id) {
        if (!queryService.existsActive(id)) {
            throw new BusinessException(CategoryErrorCode.CATEGORY_NOT_FOUND);
        }
        return ResponseEntity.ok(CommonResponse.ok(null));
    }
}
