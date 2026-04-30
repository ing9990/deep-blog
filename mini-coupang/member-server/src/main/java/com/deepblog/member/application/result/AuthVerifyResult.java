package com.deepblog.member.application.result;

public record AuthVerifyResult(
    Long accountId,
    Long memberId,
    Long sellerId
) {
}
