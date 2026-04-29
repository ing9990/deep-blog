package com.deepblog.product.global.auth;

import com.deepblog.product.application.port.out.AuthVerifyPort;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 매 요청 진입점에서 Cookie 헤더를 member-server 로 전달해 인증을 검증한다.
 * 검증 결과를 {@link AuthContextHolder} 에 저장하고 응답 종료 시 비운다.
 *
 * <p>인증이 필요 없는 엔드포인트도 이 인터셉터를 거치지만, 미인증인 경우 컨텍스트가 비어 있고
 * 컨트롤러가 ArgumentResolver 를 통해 접근하지 않으면 그대로 통과한다.
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final AuthVerifyPort authVerifyPort;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String cookie = request.getHeader(HttpHeaders.COOKIE);
        authVerifyPort.verify(cookie).ifPresent(AuthContextHolder::set);
        return true;
    }

    @Override
    public void afterCompletion(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler,
        Exception ex
    ) {
        AuthContextHolder.clear();
    }
}
