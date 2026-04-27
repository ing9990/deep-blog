package com.deepblog.minicoupang.domain.order.controller.dto;

import com.deepblog.minicoupang.domain.order.application.PlaceOrderResult;

public record PlaceOrderResponse(
    Long orderId,
    Long memberId,
    String status,
    Long totalAmount,
    Item item
) {

    public record Item(
        Long orderItemId,
        Long productId,
        Long optionId,
        String sku,
        String productName,
        String optionName,
        Long unitPrice,
        Long quantity,
        Long lineAmount
    ) {

        static Item from(PlaceOrderResult.Item item) {
            return new Item(
                item.orderItemId(),
                item.productId(),
                item.optionId(),
                item.sku(),
                item.productName(),
                item.optionName(),
                item.unitPrice(),
                item.quantity(),
                item.lineAmount()
            );
        }
    }

    public static PlaceOrderResponse from(PlaceOrderResult result) {
        return new PlaceOrderResponse(
            result.orderId(),
            result.memberId(),
            result.status(),
            result.totalAmount(),
            Item.from(result.item())
        );
    }
}
