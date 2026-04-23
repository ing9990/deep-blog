package com.deepblog.minicoupang.domain.product.application;

import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsQuery;
import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsResult;
import com.deepblog.minicoupang.domain.product.application.port.out.EmbedPort;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchFilter;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchHit;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchQuery;
import com.deepblog.minicoupang.domain.product.application.ranking.RrfRanker;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductStatus;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hybrid product search. Issues a keyword query against MySQL and a vector
 * query against the semantic index in parallel channels, fuses both rankings
 * with Reciprocal Rank Fusion, then fetches the top products by id from
 * MySQL preserving the fused order.
 *
 * <p>Both channels are restricted to {@link ProductStatus#ACTIVE} because
 * shop policy hides suspended and sold-out products from discovery. The
 * underlying stores are status-neutral; this service owns the default.
 */
@Service
@RequiredArgsConstructor
public class ProductSearchService {

    private static final ProductStatus DEFAULT_VISIBLE_STATUS = ProductStatus.ACTIVE;
    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 100;
    private static final int CHANNEL_POOL_FLOOR = 100;

    private final ProductRepository productRepository;
    private final EmbedPort embedPort;

    @Transactional(readOnly = true)
    public SearchProductsResult search(SearchProductsQuery query) {
        int limit = clamp(query.limit(), MIN_LIMIT, MAX_LIMIT);
        int poolSize = Math.max(limit, CHANNEL_POOL_FLOOR);

        List<Long> lexical = productRepository.searchIdsByKeyword(
            query.q(),
            query.categoryId(),
            query.minPrice(),
            query.maxPrice(),
            DEFAULT_VISIBLE_STATUS,
            PageRequest.of(0, poolSize)
        );

        List<Long> semantic = embedPort.search(new ProductSearchQuery(
            query.q(),
            poolSize,
            new ProductSearchFilter(
                query.categoryId(),
                query.minPrice(),
                query.maxPrice(),
                DEFAULT_VISIBLE_STATUS.name()
            )
        )).stream().map(ProductSearchHit::productId).toList();

        List<Long> fused = RrfRanker.combine(lexical, semantic).stream()
            .limit(limit)
            .toList();

        if (fused.isEmpty()) {
            return new SearchProductsResult(List.of());
        }

        Map<Long, Product> byId = productRepository.findAllById(fused).stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));

        List<SearchProductsResult.Item> items = fused.stream()
            .map(byId::get)
            .filter(p -> p != null)
            .map(ProductSearchService::toItem)
            .toList();
        return new SearchProductsResult(items);
    }

    private static SearchProductsResult.Item toItem(Product p) {
        return new SearchProductsResult.Item(
            p.getId(),
            p.getSeller().getId(),
            p.getCategoryId(),
            p.getName(),
            p.getDescription(),
            p.getBasePrice(),
            p.getStatus().name()
        );
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
