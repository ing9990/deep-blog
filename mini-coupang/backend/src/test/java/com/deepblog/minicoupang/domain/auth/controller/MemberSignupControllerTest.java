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
class MemberSignupControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper om;

    @Test
    void signup_member_creates_account_and_member_atomically() throws Exception {
        Map<String, Object> body = Map.of(
            "email", "buyer@example.com",
            "password", "password123",
            "name", "홍길동",
            "phoneNumber", "01012345678",
            "nickname", "gildong"
        );

        mockMvc.perform(MockMvcRequestBuilders.post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accountId").exists())
            .andExpect(jsonPath("$.memberId").exists())
            .andExpect(jsonPath("$.email").value("buyer@example.com"));
    }

    @Test
    void signup_member_rejects_duplicate_email() throws Exception {
        Map<String, Object> body = Map.of(
            "email", "dup@example.com",
            "password", "password123",
            "name", "홍길동",
            "phoneNumber", "01011112222"
        );

        mockMvc.perform(MockMvcRequestBuilders.post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isCreated());

        Map<String, Object> dup = Map.of(
            "email", "dup@example.com",
            "password", "password456",
            "name", "김길동",
            "phoneNumber", "01033334444"
        );

        mockMvc.perform(MockMvcRequestBuilders.post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(dup)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"));
    }

    @Test
    void signup_member_rejects_invalid_phone() throws Exception {
        Map<String, Object> body = Map.of(
            "email", "badphone@example.com",
            "password", "password123",
            "name", "홍길동",
            "phoneNumber", "123"
        );

        mockMvc.perform(MockMvcRequestBuilders.post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
