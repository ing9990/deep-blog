package com.deepblog.product.catalog.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.product.catalog.model.response.CatalogProductResponse;
import com.deepblog.product.catalog.service.CatalogProductQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class CatalogProductController {

    private final CatalogProductQueryService queryService;

    @GetMapping("/{productId}")
    public CommonResponse<CatalogProductResponse> get(@PathVariable Long productId) {
        return CommonResponse.ok(CatalogProductResponse.from(queryService.get(productId)));
    }
}
