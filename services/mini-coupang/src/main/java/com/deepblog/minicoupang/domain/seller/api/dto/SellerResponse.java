package com.deepblog.minicoupang.domain.seller.api.dto;

import com.deepblog.minicoupang.domain.seller.Seller;

public record SellerResponse(Long id, String name, String email) {

    public static SellerResponse from(Seller seller) {
        if (seller.getId() == null) {
            throw new IllegalStateException("persisted Seller must have id");
        }
        return new SellerResponse(seller.getId(), seller.getName(), seller.getEmail());
    }
}
