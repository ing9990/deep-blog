package com.deepblog.minicoupang.domain.auth.controller;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SellerSignupControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;

    @Test
    void signup_seller_creates_account_and_seller_atomically() throws Exception {
        Map<String, Object> body = Map.of(
            "email", "seller@example.com",
            "password", "password123",
            "businessName", "갓김치마켓",
            "businessRegistrationNumber", "1234567890",
            "representativeName", "김판매",
            "phoneNumber", "01012345678"
        );

        mockMvc.perform(MockMvcRequestBuilders.post("/auth/signup/seller")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accountId").exists())
            .andExpect(jsonPath("$.sellerId").exists())
            .andExpect(jsonPath("$.email").value("seller@example.com"));
    }

    @Test
    void signup_seller_rejects_duplicate_business_registration_number() throws Exception {
        Map<String, Object> first = Map.of(
            "email", "s1@example.com",
            "password", "password123",
            "businessName", "가게일호",
            "businessRegistrationNumber", "9999999999",
            "representativeName", "대표일호",
            "phoneNumber", "01011112222"
        );
        mockMvc.perform(MockMvcRequestBuilders.post("/auth/signup/seller")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(first)))
            .andExpect(status().isCreated());

        Map<String, Object> dup = Map.of(
            "email", "s2@example.com",
            "password", "password123",
            "businessName", "가게이호",
            "businessRegistrationNumber", "9999999999",
            "representativeName", "대표이호",
            "phoneNumber", "01033334444"
        );
        mockMvc.perform(MockMvcRequestBuilders.post("/auth/signup/seller")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(dup)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_SELLER"));
    }

    @Test
    void signup_seller_rejects_duplicate_email() throws Exception {
        Map<String, Object> first = Map.of(
            "email", "dup@example.com",
            "password", "password123",
            "businessName", "가게A",
            "businessRegistrationNumber", "1111111111",
            "representativeName", "대표A",
            "phoneNumber", "01011112222"
        );
        mockMvc.perform(MockMvcRequestBuilders.post("/auth/signup/seller")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(first)))
            .andExpect(status().isCreated());

        Map<String, Object> dup = Map.of(
            "email", "dup@example.com",
            "password", "password456",
            "businessName", "가게B",
            "businessRegistrationNumber", "2222222222",
            "representativeName", "대표B",
            "phoneNumber", "01033334444"
        );
        mockMvc.perform(MockMvcRequestBuilders.post("/auth/signup/seller")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(dup)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"));
    }
}
