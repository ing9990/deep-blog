package com.deepblog.minicoupang.domain.product.application;

import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsQuery;
// stage 2 ES 도입 시 다시 평가하므로 import 는 주석으로 보존한다.
// import com.deepblog.minicoupang.domain.product.application.port.out.EmbedPort;
// import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchFilter;
// import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchQuery;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchHit;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductStatus;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.global.observability.MeasureStep;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

/**
 * Stage 1 baseline: MySQL LIKE 단일 채널. 4b4101c 의 hybrid 경로(gRPC + Qdrant
 * FusionQuery RRF) 는 stage 2 ES 도입까지 호출 경로만 끊은 상태로 둔다.
 * EmbedPort 와 EmbedGrpcAdapter 는 보존되어 stage 3 personalization 도메인이
 * 다시 들어올 때 재활용한다.
 */
@Component
@RequiredArgsConstructor
class SearchSteps {

    private final ProductRepository productRepository;
    // private final EmbedPort embedPort;

    @MeasureStep("search.embed")
    public List<ProductSearchHit> embedAndSearch(SearchProductsQuery q, int limit, ProductStatus status) {
        // gRPC + Qdrant hybrid 호출 (stage 2 ES 도입 시 재평가):
        // return embedPort.search(new ProductSearchQuery(
        //     q.q(),
        //     limit,
        //     new ProductSearchFilter(q.categoryId(), q.minPrice(), q.maxPrice(), status.name())
        // ));
        List<Long> ids = productRepository.searchIdsByKeyword(
            q.q(), status, q.categoryId(), q.minPrice(), q.maxPrice(),
            PageRequest.of(0, limit)
        );
        return ids.stream()
            .map(id -> new ProductSearchHit(id, 1.0f))
            .toList();
    }

    @MeasureStep("search.fetch")
    public Map<Long, Product> fetch(List<Long> ids) {
        return productRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(Product::getId, Function.identity()));
    }
}
