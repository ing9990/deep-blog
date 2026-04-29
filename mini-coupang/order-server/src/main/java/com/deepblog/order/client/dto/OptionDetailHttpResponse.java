package com.deepblog.order.client.dto;

/**
 * product-server `/internal/options/{optionId}` 응답 본문. CommonResponse 의 data 필드.
 */
public record OptionDetailHttpResponse(
    Long productId,
    String productName,
    Long sellerId,
    Long optionId,
    String optionName,
    String sku,
    Long unitPrice,
    String productStatus
) {
}
