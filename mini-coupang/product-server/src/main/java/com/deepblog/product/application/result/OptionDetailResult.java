package com.deepblog.product.application.result;

/**
 * 옵션 상세 조회 결과. 다른 서비스(주로 order-server)가 결제 직전 스냅샷용으로 가져간다.
 *
 * <p>{@code unitPrice} 는 상품 base + 옵션 additional 합산값. 호출자가 다시 계산하지 않도록 미리 묶어둔다.
 */
public record OptionDetailResult(
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
