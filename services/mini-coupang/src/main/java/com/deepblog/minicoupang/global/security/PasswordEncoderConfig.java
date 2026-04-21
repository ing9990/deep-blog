package com.deepblog.minicoupang.global.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * spring-security-crypto만 사용. 전체 Spring Security 필터 체인은 도입하지 않는다.
 * 인증은 JwtProvider + AuthService가 수동 처리하고, 보호는 Phase 2 후반에 filter로 추가한다.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
