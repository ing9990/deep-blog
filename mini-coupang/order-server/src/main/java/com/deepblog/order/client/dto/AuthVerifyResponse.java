package com.deepblog.order.client.dto;

/**
 * member-server `/internal/auth/verify` 응답 본문. CommonResponse 의 data 필드.
 * 회원/판매자 권한이 없는 경우 해당 필드는 null.
 */
public record AuthVerifyResponse(
    Long accountId,
    Long memberId,
    Long sellerId
) {
}
