package com.deepblog.minicoupang.domain.product.seller.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.minicoupang.domain.auth.context.SessionKeys;
import com.deepblog.minicoupang.domain.category.repository.CategoryRepository;
import com.deepblog.minicoupang.domain.product.seller.application.RegisterProductCommand;
import com.deepblog.minicoupang.domain.product.seller.application.SellerProductService;
import com.deepblog.minicoupang.domain.seller.application.SellerSignupCommand;
import com.deepblog.minicoupang.domain.seller.application.SellerSignupResult;
import com.deepblog.minicoupang.domain.seller.application.SellerSignupService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ListMyProductsControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired SellerSignupService sellerSignup;
    @Autowired SellerProductService sellerProductService;
    @Autowired CategoryRepository categoryRepository;

    @Test
    void list_returns_sellers_products_desc_by_createdAt() throws Exception {
        var cat = categoryRepository.save(
            com.deepblog.minicoupang.domain.category.domain.Category.create("테스트", null));
        SellerSignupResult s = sellerSignup.signup(
            new SellerSignupCommand("s@example.com", "password123", "가게이름", "1112223334", "대표자", "01011112222"));
        for (int i = 0; i < 3; i++) {
            sellerProductService.registerProduct(s.accountId(),
                new RegisterProductCommand(cat.getId(), "상품 " + i, "설명", 10000L, List.of(), List.of()));
        }
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionKeys.AUTH_ACCOUNT_ID, s.accountId());

        mockMvc.perform(get("/api/seller/products").session(session)
                .param("page", "0").param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items", hasSize(3)))
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.size").value(20))
            .andExpect(jsonPath("$.total").value(3))
            .andExpect(jsonPath("$.items[0].name").value("상품 2"))
            .andExpect(jsonPath("$.items[2].name").value("상품 0"));
    }
}
