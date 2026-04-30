package com.deepblog.member.controller;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.member.application.MeService;
import com.deepblog.member.application.result.MeResult;
import com.deepblog.member.controller.dto.MeResponse;
import com.deepblog.member.global.session.SessionKeys;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final MeService meService;

    @GetMapping
    public ResponseEntity<MeResponse> me(HttpSession session) {
        Long accountId = readAccountId(session);
        MeResult result = meService.me(accountId);
        return ResponseEntity.ok(MeResponse.from(result));
    }

    private static Long readAccountId(HttpSession session) {
        Object value = session.getAttribute(SessionKeys.AUTH_ACCOUNT_ID);
        if (!(value instanceof Long accountId)) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
        return accountId;
    }
}
