package com.deepblog.product.controller.dto;

import com.deepblog.product.application.result.OptionDetailResult;

public record OptionDetailResponse(
    Long productId,
    String productName,
    Long sellerId,
    Long optionId,
    String optionName,
    String sku,
    Long unitPrice,
    String productStatus
) {

    public static OptionDetailResponse from(OptionDetailResult r) {
        return new OptionDetailResponse(
            r.productId(),
            r.productName(),
            r.sellerId(),
            r.optionId(),
            r.optionName(),
            r.sku(),
            r.unitPrice(),
            r.productStatus()
        );
    }
}
