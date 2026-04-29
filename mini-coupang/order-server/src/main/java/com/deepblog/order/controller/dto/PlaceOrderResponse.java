package com.deepblog.order.controller.dto;

import com.deepblog.order.application.result.PlaceOrderResult;

public record PlaceOrderResponse(
    Long orderId,
    Long memberId,
    String status,
    Long totalAmount,
    String paymentId,
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

        static Item from(PlaceOrderResult.Item i) {
            return new Item(
                i.orderItemId(),
                i.productId(),
                i.optionId(),
                i.sku(),
                i.productName(),
                i.optionName(),
                i.unitPrice(),
                i.quantity(),
                i.lineAmount()
            );
        }
    }

    public static PlaceOrderResponse from(PlaceOrderResult r) {
        return new PlaceOrderResponse(
            r.orderId(),
            r.memberId(),
            r.status(),
            r.totalAmount(),
            r.paymentId(),
            Item.from(r.item())
        );
    }
}
