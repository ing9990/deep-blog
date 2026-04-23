package com.deepblog.minicoupang.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.minicoupang.domain.auth.context.SessionKeys;
import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private SellerRepository sellerRepository;

    @BeforeEach
    void cleanDatabase() {
        // Delete child rows first to avoid FK constraint violations
        memberRepository.deleteAll();
        sellerRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    void signup_then_login_sets_session() throws Exception {
        // Use member signup so that /auth/login (member portal) can succeed
        mockMvc.perform(post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"alice@example.com","password":"password123","name":"홍길동","phoneNumber":"01011112222"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accountId").isNumber())
            .andExpect(jsonPath("$.email").value("alice@example.com"));

        MvcResult loginResult = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "alice@example.com", "password": "password123"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountId").isNumber())
            .andExpect(jsonPath("$.memberId").isNumber())
            .andReturn();

        HttpSession session = loginResult.getRequest().getSession(false);
        assertThat(session).isNotNull();
        assertThat(session.getAttribute(SessionKeys.AUTH_ACCOUNT_ID)).isInstanceOf(Long.class);
    }

    @Test
    void signup_duplicate_email_returns_409() throws Exception {
        String body = """
            {"email":"bob@example.com","password":"password123","name":"홍길동","phoneNumber":"01011112222"}
            """;

        mockMvc.perform(post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"));
    }

    @Test
    void login_wrong_password_returns_401() throws Exception {
        mockMvc.perform(post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"carol@example.com","password":"password123","name":"홍길동","phoneNumber":"01011112222"}
                    """))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "carol@example.com", "password": "wrong-password"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void login_unknown_email_returns_401() throws Exception {
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "nobody@example.com", "password": "password123"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void signup_invalid_email_returns_400() throws Exception {
        mockMvc.perform(post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"not-an-email","password":"password123","name":"홍길동","phoneNumber":"01011112222"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void signup_short_password_returns_400() throws Exception {
        mockMvc.perform(post("/auth/signup/member")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"dave@example.com","password":"short","name":"홍길동","phoneNumber":"01011112222"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
