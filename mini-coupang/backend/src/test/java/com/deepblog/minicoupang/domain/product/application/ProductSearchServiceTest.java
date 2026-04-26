package com.deepblog.minicoupang.domain.product.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsQuery;
import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsResult;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductStatus;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Stage 1 baseline: ProductSearchService 가 MySQL LIKE 단일 채널로 동작하는지 검증한다.
 * gRPC + Qdrant FusionQuery RRF 경로(4b4101c) 는 stage 2 ES 도입 시 다시 평가한다.
 */
class ProductSearchServiceTest {

    private ProductRepository productRepository;
    private ProductSearchService service;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        service = new ProductSearchService(new SearchSteps(productRepository));
    }

    @Test
    @DisplayName("forwards keyword + filter to MySQL LIKE and preserves repository order")
    void forwardsAndPreservesOrder() {
        // searchIdsByKeyword 가 ORDER BY p.id ASC 로 돌려준 순서를 응답이 그대로 유지해야 한다.
        given(productRepository.searchIdsByKeyword(
                eq("텀블러"), eq(ProductStatus.ACTIVE), eq(1L), eq(1000L), eq(50000L), any(Pageable.class)))
            .willReturn(List.of(10L, 20L, 30L));
        given(productRepository.findAllById(List.of(10L, 20L, 30L)))
            .willReturn(List.of(stubProduct(20L), stubProduct(10L), stubProduct(30L)));

        SearchProductsResult result = service.search(
            new SearchProductsQuery("텀블러", 1L, 1000L, 50000L, 3));

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).searchIdsByKeyword(
            eq("텀블러"), eq(ProductStatus.ACTIVE), eq(1L), eq(1000L), eq(50000L), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(3);

        assertThat(result.items()).hasSize(3);
        assertThat(result.items().get(0).productId()).isEqualTo(10L);
        assertThat(result.items().get(1).productId()).isEqualTo(20L);
        assertThat(result.items().get(2).productId()).isEqualTo(30L);
        // stage 1 baseline 의 score 는 placeholder(1.0). 진짜 ranking score 는 stage 2 ES 에서 부활.
        assertThat(result.items()).allMatch(item -> item.score() == 1.0);
    }

    @Test
    @DisplayName("empty hits returns empty result without calling findAllById")
    void emptyHits() {
        given(productRepository.searchIdsByKeyword(
                any(), any(), any(), any(), any(), any(Pageable.class)))
            .willReturn(List.of());

        SearchProductsResult result = service.search(
            new SearchProductsQuery("zzz없는단어", null, null, null, 20));

        assertThat(result.items()).isEmpty();
        verify(productRepository, never()).findAllById(any());
    }

    @Test
    @DisplayName("missing product (deleted between search and fetch) is filtered from result")
    void missingProductIsFiltered() {
        given(productRepository.searchIdsByKeyword(
                any(), any(), any(), any(), any(), any(Pageable.class)))
            .willReturn(List.of(10L, 99L));
        given(productRepository.findAllById(List.of(10L, 99L)))
            .willReturn(List.of(stubProduct(10L)));

        SearchProductsResult result = service.search(
            new SearchProductsQuery("텀블러", null, null, null, 5));

        assertThat(result.items()).hasSize(1);
        assertThat(result.items().get(0).productId()).isEqualTo(10L);
    }

    private static Product stubProduct(long id) {
        Seller seller = Seller.builder().id(999L).build();
        Product product = Product.create(seller, 1L, "상품" + id, "설명" + id, 10_000L);
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }
}
