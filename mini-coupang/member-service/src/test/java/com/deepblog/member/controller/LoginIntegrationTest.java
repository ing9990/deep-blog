package com.deepblog.member.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.member.infrastructure.redis.RefreshTokenStore;
import com.deepblog.member.model.request.LoginRequest;
import com.deepblog.member.repository.MemberRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class LoginIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7").withExposedPorts(6379);

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry reg) {
        reg.add("spring.datasource.url", postgres::getJdbcUrl);
        reg.add("spring.datasource.username", postgres::getUsername);
        reg.add("spring.datasource.password", postgres::getPassword);
        reg.add("spring.data.redis.host", redis::getHost);
        reg.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired MemberRepository memberRepo;
    @Autowired RefreshTokenStore refreshStore;

    @Test
    void 첫_로그인이면_자동_가입되고_토큰을_발급한다() throws Exception {
        var req = new LoginRequest("alice@example.com", "password!23");

        MvcResult result = mvc.perform(post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.email").value("alice@example.com"))
            .andExpect(jsonPath("$.data.name").value("alice"))
            .andExpect(jsonPath("$.data.newMember").value(true))
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
            .andReturn();

        JsonNode data = om.readTree(result.getResponse().getContentAsString()).get("data");
        long memberId = data.get("memberId").asLong();
        assertThat(memberRepo.findById(memberId)).isPresent();
        assertThat(refreshStore.find(memberId)).isEqualTo(data.get("refreshToken").asText());
    }

    @Test
    void 등록된_사용자가_올바른_비밀번호로_로그인하면_새_토큰을_발급한다() throws Exception {
        var first = new LoginRequest("bob@example.com", "password!23");
        mvc.perform(post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(om.writeValueAsString(first)))
            .andExpect(status().isCreated());

        mvc.perform(post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(om.writeValueAsString(first)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.newMember").value(false))
            .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    void 등록된_사용자가_틀린_비밀번호로_로그인하면_401() throws Exception {
        var signup = new LoginRequest("carol@example.com", "password!23");
        mvc.perform(post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(om.writeValueAsString(signup)))
            .andExpect(status().isCreated());

        var wrong = new LoginRequest("carol@example.com", "wrong!password");
        mvc.perform(post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(om.writeValueAsString(wrong)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("AUTH_001"));
    }

    @Test
    void 비밀번호가_8자_미만이면_400() throws Exception {
        var req = new LoginRequest("dave@example.com", "short");

        mvc.perform(post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(om.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_001"));
    }
}
