package com.deepblog.seller.model.response;

public record SellerSignupResponse(
    Long sellerId,
    String email,
    String businessName,
    String status
) {
}
