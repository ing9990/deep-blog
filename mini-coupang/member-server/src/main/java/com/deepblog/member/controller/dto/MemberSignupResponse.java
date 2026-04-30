package com.deepblog.member.controller.dto;

import com.deepblog.member.application.result.MemberSignupResult;

public record MemberSignupResponse(Long accountId, Long memberId, String email) {
    public static MemberSignupResponse from(MemberSignupResult r) {
        return new MemberSignupResponse(r.accountId(), r.memberId(), r.email());
    }
}
