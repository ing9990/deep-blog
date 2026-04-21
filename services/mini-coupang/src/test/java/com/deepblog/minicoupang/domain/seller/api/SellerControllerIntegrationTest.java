package com.deepblog.minicoupang.domain.seller.api;

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

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class SellerControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void POST_creates_seller_and_returns_201_with_Location() throws Exception {
        mockMvc.perform(post("/api/v1/sellers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Toss Seller","email":"toss@example.com","password":"password123"}
                            """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/v1/sellers/")))
                .andExpect(jsonPath("$.name").value("Toss Seller"))
                .andExpect(jsonPath("$.email").value("toss@example.com"))
                .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    void GET_existing_returns_200() throws Exception {
        String created = mockMvc.perform(post("/api/v1/sellers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Seller A","email":"a@example.com","password":"password123"}
                            """))
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(created).get("id").asLong();

        mockMvc.perform(get("/api/v1/sellers/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value((int) id))
                .andExpect(jsonPath("$.name").value("Seller A"));
    }

    @Test
    void GET_non_existing_returns_404() throws Exception {
        mockMvc.perform(get("/api/v1/sellers/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void POST_with_blank_name_returns_400() throws Exception {
        mockMvc.perform(post("/api/v1/sellers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"","email":"x@example.com","password":"password123"}
                            """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void POST_with_duplicate_email_returns_409() throws Exception {
        mockMvc.perform(post("/api/v1/sellers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"First","email":"dup@example.com","password":"password123"}
                            """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/sellers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Second","email":"dup@example.com","password":"password123"}
                            """))
                .andExpect(status().isConflict());
    }
}
