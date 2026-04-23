package com.deepblog.minicoupang.domain.me.controller;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.minicoupang.domain.auth.context.SessionKeys;
import com.deepblog.minicoupang.domain.member.application.MemberSignupCommand;
import com.deepblog.minicoupang.domain.member.application.MemberSignupResult;
import com.deepblog.minicoupang.domain.member.application.MemberSignupService;
import com.deepblog.minicoupang.domain.seller.application.SellerSignupCommand;
import com.deepblog.minicoupang.domain.seller.application.SellerSignupResult;
import com.deepblog.minicoupang.domain.seller.application.SellerSignupService;
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
class MeControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired MemberSignupService memberSignup;
    @Autowired SellerSignupService sellerSignup;

    @Test
    void me_returns_member_profile_when_logged_in_as_member() throws Exception {
        MemberSignupResult signup = memberSignup.signup(
            new MemberSignupCommand("a@example.com", "password123", "홍길동", "01012345678", "gil"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionKeys.AUTH_ACCOUNT_ID, signup.accountId());

        mockMvc.perform(get("/api/me").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountId").value(signup.accountId()))
            .andExpect(jsonPath("$.email").value("a@example.com"))
            .andExpect(jsonPath("$.member.memberId").value(signup.memberId()))
            .andExpect(jsonPath("$.member.name").value("홍길동"))
            .andExpect(jsonPath("$.seller").value(nullValue()));
    }

    @Test
    void me_returns_seller_profile_when_logged_in_as_seller() throws Exception {
        SellerSignupResult signup = sellerSignup.signup(
            new SellerSignupCommand("s@example.com", "password123", "가게이름", "1234567890", "대표자", "01011112222"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionKeys.AUTH_ACCOUNT_ID, signup.accountId());

        mockMvc.perform(get("/api/me").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountId").value(signup.accountId()))
            .andExpect(jsonPath("$.email").value("s@example.com"))
            .andExpect(jsonPath("$.seller.sellerId").value(signup.sellerId()))
            .andExpect(jsonPath("$.seller.businessName").value("가게이름"))
            .andExpect(jsonPath("$.member").value(nullValue()));
    }

    @Test
    void me_returns_401_when_not_authenticated() throws Exception {
        mockMvc.perform(get("/api/me"))
            .andExpect(status().isUnauthorized());
    }
}
