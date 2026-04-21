package com.deepblog.minicoupang;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * mini-coupang monolith 진입점.
 *
 * 현재 단일 Spring Boot 앱으로 seller, product 두 도메인을 포함한다.
 * MSA 전환 시점에 각 domain/{name} 패키지가 별 서비스로 분할되는 것이
 * 설계 의도 (domain-design.md §1.5 전환 체크리스트 참조).
 */
@SpringBootApplication
public class MiniCoupangApplication {

    public static void main(String[] args) {
        SpringApplication.run(MiniCoupangApplication.class, args);
    }
}
