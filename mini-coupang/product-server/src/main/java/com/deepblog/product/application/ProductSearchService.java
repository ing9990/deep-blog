package com.deepblog.product.application;

import com.deepblog.product.application.command.SearchProductsQuery;
import com.deepblog.product.application.result.SearchProductsResult;
import com.deepblog.product.domain.Product;
import com.deepblog.product.domain.ProductStatus;
import com.deepblog.product.repository.ProductRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 단일 채널 상품 검색 (MySQL LIKE). 추후 hybrid (sparse + dense + RRF) 도입 가능성 있음.
 *
 * <p>현재는 ACTIVE 상태만 노출 (suspended/sold-out 제외). 가격·카테고리 필터는 SQL WHERE 절에서
 * 같이 적용. score 는 동등 비교 후 ID 순이라 1.0 로 채운다.
 */
@Service
@RequiredArgsConstructor
public class ProductSearchService {

    private static final ProductStatus DEFAULT_VISIBLE_STATUS = ProductStatus.ACTIVE;
    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 100;

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public SearchProductsResult search(SearchProductsQuery query) {
        int limit = clamp(query.limit(), MIN_LIMIT, MAX_LIMIT);

        List<Long> ids = productRepository.searchIdsByKeyword(
            query.q(), DEFAULT_VISIBLE_STATUS,
            query.categoryId(), query.minPrice(), query.maxPrice(),
            PageRequest.of(0, limit)
        );
        if (ids.isEmpty()) {
            return new SearchProductsResult(List.of());
        }

        Map<Long, Product> byId = productRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));

        List<SearchProductsResult.Item> items = ids.stream()
            .map(id -> {
                Product p = byId.get(id);
                return p == null ? null : toItem(p);
            })
            .filter(Objects::nonNull)
            .toList();
        return new SearchProductsResult(items);
    }

    private static SearchProductsResult.Item toItem(Product p) {
        return new SearchProductsResult.Item(
            p.getId(),
            p.getSellerId(),
            p.getCategoryId(),
            p.getName(),
            p.getDescription(),
            p.getBasePrice(),
            p.getStatus().name(),
            1.0
        );
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
