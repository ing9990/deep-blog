package com.deepblog.minicoupang.domain.product.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.minicoupang.domain.product.application.ProductSearchService;
import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsQuery;
import com.deepblog.minicoupang.domain.product.application.dto.SearchProductsResult;
import java.util.List;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = ProductSearchController.class)
@ActiveProfiles("test")
class ProductSearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductSearchService productSearchService;

    @Test
    void search_mapsAllQueryParamsIntoQueryRecord() throws Exception {
        given(productSearchService.search(any())).willReturn(new SearchProductsResult(List.of()));

        mockMvc.perform(get("/api/products/search")
                .param("q", "텀블러")
                .param("category_id", "1")
                .param("min_price", "1000")
                .param("max_price", "50000")
                .param("limit", "5"))
            .andExpect(status().isOk());

        ArgumentCaptor<SearchProductsQuery> captor = ArgumentCaptor.forClass(SearchProductsQuery.class);
        verify(productSearchService).search(captor.capture());
        SearchProductsQuery query = captor.getValue();
        assertThat(query.q()).isEqualTo("텀블러");
        assertThat(query.categoryId()).isEqualTo(1L);
        assertThat(query.minPrice()).isEqualTo(1000L);
        assertThat(query.maxPrice()).isEqualTo(50000L);
        assertThat(query.limit()).isEqualTo(5);
    }

    @Test
    void search_missingOptionalParams_limitDefaultsTo20() throws Exception {
        given(productSearchService.search(any())).willReturn(new SearchProductsResult(List.of()));

        mockMvc.perform(get("/api/products/search").param("q", "anything"))
            .andExpect(status().isOk());

        ArgumentCaptor<SearchProductsQuery> captor = ArgumentCaptor.forClass(SearchProductsQuery.class);
        verify(productSearchService).search(captor.capture());
        assertThat(captor.getValue().limit()).isEqualTo(20);
        assertThat(captor.getValue().categoryId()).isNull();
        assertThat(captor.getValue().minPrice()).isNull();
        assertThat(captor.getValue().maxPrice()).isNull();
    }

    @Test
    void search_missingRequiredQ_returns400() throws Exception {
        mockMvc.perform(get("/api/products/search"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void search_response_exposesSizeAndItems() throws Exception {
        given(productSearchService.search(any())).willReturn(new SearchProductsResult(List.of(
            new SearchProductsResult.Item(1L, 2L, 3L, "텀블러", "보온", 10_000L, "ACTIVE"),
            new SearchProductsResult.Item(4L, 2L, 3L, "텀블러 2", "보냉", 11_000L, "ACTIVE")
        )));

        mockMvc.perform(get("/api/products/search").param("q", "텀블러"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.size").value(2))
            .andExpect(jsonPath("$.items", Matchers.hasSize(2)))
            .andExpect(jsonPath("$.items[0].productId").value(1))
            .andExpect(jsonPath("$.items[0].name").value("텀블러"))
            .andExpect(jsonPath("$.items[0].status").value("ACTIVE"))
            .andExpect(jsonPath("$.items[1].productId").value(4));
    }
}
