package com.deepblog.minicoupang.domain.member.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.deepblog.minicoupang.domain.auth.exception.DuplicateEmailException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MemberSignupServiceTest {

    @Autowired MemberSignupService sut;

    @Test
    void signup_persists_account_and_member() {
        MemberSignupResult r = sut.signup(
            new MemberSignupCommand("foo@example.com", "password123", "홍길동", "01012345678", "gildong")
        );

        assertThat(r.accountId()).isNotNull();
        assertThat(r.memberId()).isNotNull();
        assertThat(r.email()).isEqualTo("foo@example.com");
    }

    @Test
    void signup_duplicate_email_throws() {
        sut.signup(new MemberSignupCommand("dup@example.com", "password123", "홍길동", "01011112222", null));

        assertThatThrownBy(() -> sut.signup(
            new MemberSignupCommand("dup@example.com", "password456", "김길동", "01033334444", null)
        )).isInstanceOf(DuplicateEmailException.class);
    }
}
