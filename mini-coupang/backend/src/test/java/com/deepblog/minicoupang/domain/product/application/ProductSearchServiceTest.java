package com.deepblog.minicoupang.domain.product.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsQuery;
import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsResult;
import com.deepblog.minicoupang.domain.product.application.port.out.EmbedPort;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchHit;
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

class ProductSearchServiceTest {

    private ProductRepository productRepository;
    private EmbedPort embedPort;
    private ProductSearchService service;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        embedPort = mock(EmbedPort.class);
        service = new ProductSearchService(productRepository, embedPort);
    }

    @Test
    @DisplayName("combines lexical and semantic ids through RRF, preserves order via findAllById lookup")
    void combinesAndPreservesOrder() {
        given(productRepository.searchIdsByKeyword(
                any(), any(), any(), any(), any(ProductStatus.class), any(Pageable.class)))
            .willReturn(List.of(10L, 20L, 30L));
        given(embedPort.search(any())).willReturn(List.of(
            new ProductSearchHit(30L, 0.9f),
            new ProductSearchHit(40L, 0.8f),
            new ProductSearchHit(10L, 0.7f)
        ));
        given(productRepository.findAllById(any()))
            .willReturn(List.of(
                stubProduct(10L),
                stubProduct(20L),
                stubProduct(30L),
                stubProduct(40L)
            ));

        SearchProductsResult result = service.search(
            new SearchProductsQuery("텀블러", 1L, 1000L, 50000L, 3));

        ArgumentCaptor<List<Long>> idsCaptor = ArgumentCaptor.forClass(List.class);
        verify(productRepository).findAllById(idsCaptor.capture());
        List<Long> requestedIds = idsCaptor.getValue();
        assertThat(requestedIds).hasSize(3);
        assertThat(requestedIds).startsWith(10L, 30L);

        assertThat(result.items()).hasSize(3);
        assertThat(result.items().get(0).productId()).isEqualTo(requestedIds.get(0));
    }

    @Test
    @DisplayName("empty lexical and empty semantic returns empty result without calling findAllById")
    void emptyChannels() {
        given(productRepository.searchIdsByKeyword(
                any(), any(), any(), any(), any(ProductStatus.class), any(Pageable.class)))
            .willReturn(List.of());
        given(embedPort.search(any())).willReturn(List.of());

        SearchProductsResult result = service.search(
            new SearchProductsQuery("zzz없는단어", null, null, null, 20));

        assertThat(result.items()).isEmpty();
        verify(productRepository, never()).findAllById(any());
    }

    private static Product stubProduct(long id) {
        Seller seller = Seller.builder().id(999L).build();
        Product product = Product.create(seller, 1L, "상품" + id, "설명" + id, 10_000L);
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }
}
