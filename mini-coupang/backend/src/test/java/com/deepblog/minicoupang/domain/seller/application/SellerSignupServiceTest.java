package com.deepblog.minicoupang.domain.seller.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SellerSignupServiceTest {

    @Autowired SellerSignupService sut;

    @Test
    void signup_persists_account_and_seller() {
        SellerSignupResult r = sut.signup(
            new SellerSignupCommand("foo@example.com", "password123", "가게이름", "1234567890", "대표자", "01011112222")
        );

        assertThat(r.accountId()).isNotNull();
        assertThat(r.sellerId()).isNotNull();
        assertThat(r.email()).isEqualTo("foo@example.com");
    }

    @Test
    void signup_duplicate_email_throws() {
        sut.signup(new SellerSignupCommand("dup@example.com", "password123", "가게A", "1111111111", "대표A", "01011112222"));

        assertThatThrownBy(() -> sut.signup(
            new SellerSignupCommand("dup@example.com", "password456", "가게B", "2222222222", "대표B", "01033334444")
        )).isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.DUPLICATE_EMAIL);
    }

    @Test
    void signup_duplicate_business_registration_number_throws() {
        sut.signup(new SellerSignupCommand("s1@example.com", "password123", "가게A", "9999999999", "대표A", "01011112222"));

        assertThatThrownBy(() -> sut.signup(
            new SellerSignupCommand("s2@example.com", "password456", "가게B", "9999999999", "대표B", "01033334444")
        )).isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_SELLER);
    }
}
