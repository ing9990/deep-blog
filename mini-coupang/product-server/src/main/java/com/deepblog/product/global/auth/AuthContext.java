package com.deepblog.product.global.auth;

/**
 * member-server `/internal/auth/verify` 응답을 product-server 내부에서 들고 다니는 형태.
 * 회원 권한이 없으면 {@code memberId == null}, 판매자 권한이 없으면 {@code sellerId == null}.
 */
public record AuthContext(Long accountId, Long memberId, Long sellerId) {

    public static AuthContext of(Long accountId, Long memberId, Long sellerId) {
        return new AuthContext(accountId, memberId, sellerId);
    }
}
