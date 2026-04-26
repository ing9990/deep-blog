package com.deepblog.minicoupang.domain.product.application;

import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsQuery;
import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsResult;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchHit;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductStatus;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hybrid product search. The lexical (sparse) channel, the semantic (dense)
 * channel, and the RRF fusion all live inside the Python ML service via
 * Qdrant's Query API (Prefetch + FusionQuery). This service is intentionally
 * thin: one gRPC call to obtain the fused id list and a single MySQL fetch
 * to attach product details.
 *
 * <p>Both channels are restricted to {@link ProductStatus#ACTIVE} because
 * shop policy hides suspended and sold-out products from discovery. The
 * status filter is forwarded as part of the search query; the underlying
 * Qdrant payload index applies it to both prefetch channels in one round-trip.
 *
 * <p>Per-stage latency metrics come from {@code MeasureStepAspect} wrapping
 * {@link SearchSteps}.
 */
@Service
@RequiredArgsConstructor
public class ProductSearchService {

    private static final ProductStatus DEFAULT_VISIBLE_STATUS = ProductStatus.ACTIVE;
    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 100;

    private final SearchSteps steps;

    @Transactional(readOnly = true)
    public SearchProductsResult search(SearchProductsQuery query) {
        int limit = clamp(query.limit(), MIN_LIMIT, MAX_LIMIT);

        List<ProductSearchHit> hits = steps.embedAndSearch(query, limit, DEFAULT_VISIBLE_STATUS);
        if (hits.isEmpty()) {
            return new SearchProductsResult(List.of());
        }

        List<Long> ids = hits.stream().map(ProductSearchHit::productId).toList();
        Map<Long, Product> byId = steps.fetch(ids);

        List<SearchProductsResult.Item> items = hits.stream()
            .map(h -> {
                Product p = byId.get(h.productId());
                return p == null ? null : toItem(p, h.score());
            })
            .filter(Objects::nonNull)
            .toList();
        return new SearchProductsResult(items);
    }

    private static SearchProductsResult.Item toItem(Product p, double score) {
        return new SearchProductsResult.Item(
            p.getId(),
            p.getSeller().getId(),
            p.getCategoryId(),
            p.getName(),
            p.getDescription(),
            p.getBasePrice(),
            p.getStatus().name(),
            score
        );
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
