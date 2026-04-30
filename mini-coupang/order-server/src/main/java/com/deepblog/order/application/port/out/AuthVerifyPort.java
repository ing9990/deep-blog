package com.deepblog.order.application.port.out;

import com.deepblog.order.global.auth.AuthContext;
import java.util.Optional;

/**
 * 외부 인증 검증 포트. 어댑터(Feign)가 member-server `/internal/auth/verify` 를 호출한다.
 *
 * <p>cookie 헤더 그대로를 받는다. 응답이 미인증이면 {@link Optional#empty()}.
 */
public interface AuthVerifyPort {

    Optional<AuthContext> verify(String cookieHeader);
}
