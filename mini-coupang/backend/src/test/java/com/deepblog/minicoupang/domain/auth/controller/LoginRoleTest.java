package com.deepblog.minicoupang.domain.auth.controller;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.deepblog.minicoupang.domain.member.application.MemberSignupCommand;
import com.deepblog.minicoupang.domain.member.application.MemberSignupService;
import com.deepblog.minicoupang.domain.seller.application.SellerSignupCommand;
import com.deepblog.minicoupang.domain.seller.application.SellerSignupService;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
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
class LoginRoleTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;
    @Autowired MemberSignupService memberSignup;
    @Autowired SellerSignupService sellerSignup;

    @BeforeEach
    void prep() {
        memberSignup.signup(new MemberSignupCommand(
            "buyer@example.com", "password123", "홍길동", "01011112222", null));
        sellerSignup.signup(new SellerSignupCommand(
            "seller@example.com", "password123", "가게이름", "1234567890", "대표자", "01033334444"));
    }

    @Test
    void member_login_succeeds_and_returns_memberId() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "email", "buyer@example.com", "password", "password123"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountId").exists())
            .andExpect(jsonPath("$.memberId").exists());
    }

    @Test
    void member_login_rejects_seller_only_account() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "email", "seller@example.com", "password", "password123"))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("NOT_A_MEMBER"));
    }

    @Test
    void seller_login_succeeds_and_returns_sellerId() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/auth/login/seller")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "email", "seller@example.com", "password", "password123"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountId").exists())
            .andExpect(jsonPath("$.sellerId").exists());
    }

    @Test
    void seller_login_rejects_member_only_account() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/auth/login/seller")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                    "email", "buyer@example.com", "password", "password123"))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("SELLER_NOT_REGISTERED"));
    }
}
