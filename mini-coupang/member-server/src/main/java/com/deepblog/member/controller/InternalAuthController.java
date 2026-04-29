package com.deepblog.member.controller;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.common.response.CommonResponse;
import com.deepblog.member.application.AuthVerifyService;
import com.deepblog.member.application.result.AuthVerifyResult;
import com.deepblog.member.controller.dto.AuthVerifyResponse;
import com.deepblog.member.global.session.SessionKeys;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 다른 서비스가 Feign 으로 호출하는 인증 검증 엔드포인트.
 *
 * <p>호출 측은 사용자의 SESSION 쿠키를 그대로 전달한다. 본 엔드포인트가 받는 시점에서는 Spring
 * Session Redis 가 이미 cookie → Redis 에 저장된 세션 → HttpSession 객체로 복원해 둔 상태다.
 * 따라서 별도 토큰 디코딩 없이 세션 attribute 를 읽으면 된다.
 *
 * <p>세션이 없으면 401 UNAUTHENTICATED.
 */
@RestController
@RequestMapping("/internal/auth")
@RequiredArgsConstructor
public class InternalAuthController {

    private final AuthVerifyService authVerifyService;

    @GetMapping("/verify")
    public ResponseEntity<CommonResponse<AuthVerifyResponse>> verify(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        Object value = session.getAttribute(SessionKeys.AUTH_ACCOUNT_ID);
        if (!(value instanceof Long accountId)) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        AuthVerifyResult result = authVerifyService.verify(accountId);
        return ResponseEntity.ok(CommonResponse.success(AuthVerifyResponse.from(result)));
    }
}
