package com.deepblog.member.model.response;

public record LoginResponse(
    Long memberId,
    String email,
    String name,
    String accessToken,
    String refreshToken,
    boolean newMember
) {
}
