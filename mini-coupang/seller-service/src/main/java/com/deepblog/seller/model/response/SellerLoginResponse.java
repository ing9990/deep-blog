package com.deepblog.seller.model.response;

public record SellerLoginResponse(
    Long sellerId,
    String email,
    String businessName,
    String accessToken,
    String refreshToken
) {
}
