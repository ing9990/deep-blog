package com.deepblog.minicoupang.domain.auth.controller.dto;

import com.deepblog.minicoupang.domain.seller.application.SellerSignupResult;

public record SellerSignupResponse(Long accountId, Long sellerId, String email) {
    public static SellerSignupResponse from(SellerSignupResult r) {
        return new SellerSignupResponse(r.accountId(), r.sellerId(), r.email());
    }
}
