package com.deepblog.order.application.port.out.dto;

/**
 * 결제 직전에 product-server 에서 가져온 옵션 스냅샷. 주문 영속화 시 그대로 OrderItem 으로 복사된다.
 *
 * <p>{@code unitPrice} 는 product-server 가 base + additional 합산해 내려준 값.
 */
public record OptionSnapshot(
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
