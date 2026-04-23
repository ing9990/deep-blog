package com.deepblog.minicoupang.domain.product.controller;

import com.deepblog.minicoupang.domain.product.application.ProductSearchService;
import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsQuery;
import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsResult;
import com.deepblog.minicoupang.domain.product.controller.dto.SearchProductsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductSearchController {

    private final ProductSearchService productSearchService;

    @GetMapping("/search")
    public ResponseEntity<SearchProductsResponse> search(
        @RequestParam("q") String q,
        @RequestParam(value = "category_id", required = false) Long categoryId,
        @RequestParam(value = "min_price", required = false) Long minPrice,
        @RequestParam(value = "max_price", required = false) Long maxPrice,
        @RequestParam(value = "limit", defaultValue = "20") int limit
    ) {
        SearchProductsResult result = productSearchService.search(
            new SearchProductsQuery(q, categoryId, minPrice, maxPrice, limit)
        );
        return ResponseEntity.ok(SearchProductsResponse.from(result));
    }
}
