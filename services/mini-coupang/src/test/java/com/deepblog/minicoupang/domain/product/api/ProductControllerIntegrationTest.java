package com.deepblog.minicoupang.domain.product.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ProductControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String validBody(Map<String, Object> overrides) throws Exception {
        Map<String, Object> base = new HashMap<>();
        base.put("sellerId", 1);
        base.put("sellerName", "Coupang Seller");
        base.put("name", "스마트폰");
        base.put("price", 1_200_000);
        base.put("stock", 10);
        base.putAll(overrides);
        return objectMapper.writeValueAsString(base);
    }

    @Test
    void POST_creates_product_and_returns_201_with_Location() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody(Map.of())))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/v1/products/")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.sellerId").value(1))
                .andExpect(jsonPath("$.sellerName").value("Coupang Seller"))
                .andExpect(jsonPath("$.name").value("스마트폰"))
                .andExpect(jsonPath("$.price").value(1_200_000))
                .andExpect(jsonPath("$.stock").value(10));
    }

    @Test
    void GET_existing_returns_200() throws Exception {
        String created = mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody(Map.of("name", "노트북"))))
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(created).get("id").asLong();

        mockMvc.perform(get("/api/v1/products/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("노트북"));
    }

    @Test
    void GET_non_existing_returns_404() throws Exception {
        mockMvc.perform(get("/api/v1/products/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void POST_with_blank_name_returns_400() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody(Map.of("name", ""))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void POST_with_negative_price_returns_400() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBody(Map.of("price", -100))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void GET_by_sellerId_returns_only_that_seller_products() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validBody(Map.of("sellerId", 77, "name", "TV"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validBody(Map.of("sellerId", 77, "name", "Tablet"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validBody(Map.of("sellerId", 88, "name", "Other"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/products").param("sellerId", "77"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}
