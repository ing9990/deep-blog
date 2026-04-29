package com.deepblog.member.controller.dto;

import com.deepblog.member.application.result.AuthVerifyResult;

/**
 * `/internal/auth/verify` 응답. 다른 서비스가 동일한 모양으로 역직렬화한다 (계약).
 */
public record AuthVerifyResponse(
    Long accountId,
    Long memberId,
    Long sellerId
) {

    public static AuthVerifyResponse from(AuthVerifyResult r) {
        return new AuthVerifyResponse(r.accountId(), r.memberId(), r.sellerId());
    }
}
