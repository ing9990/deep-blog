package com.deepblog.member.controller.dto;

import com.deepblog.member.application.result.SellerSignupResult;

public record SellerSignupResponse(Long accountId, Long sellerId, String email) {
    public static SellerSignupResponse from(SellerSignupResult r) {
        return new SellerSignupResponse(r.accountId(), r.sellerId(), r.email());
    }
}
