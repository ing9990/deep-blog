package com.deepblog.minicoupang.domain.auth.controller.dto;

import com.deepblog.minicoupang.domain.member.application.MemberSignupResult;

public record MemberSignupResponse(Long accountId, Long memberId, String email) {
    public static MemberSignupResponse from(MemberSignupResult r) {
        return new MemberSignupResponse(r.accountId(), r.memberId(), r.email());
    }
}
