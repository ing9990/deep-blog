package com.deepblog.minicoupang.domain.order.application;

import com.deepblog.minicoupang.domain.order.domain.Order;
import com.deepblog.minicoupang.domain.order.domain.OrderItem;
import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;

public record PlaceOrderResult(
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

        static Item from(OrderItem item) {
            return new Item(
                item.getId(),
                item.getProductId(),
                item.getOptionId(),
                item.getSku(),
                item.getProductName(),
                item.getOptionName(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getLineAmount()
            );
        }
    }

    public static PlaceOrderResult from(Order order) {
        OrderItem item = order.getItems().stream()
            .findFirst()
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_ORDER, "주문 항목이 존재하지 않습니다."));
        return new PlaceOrderResult(
            order.getId(),
            order.getMember().getId(),
            order.getStatus().name(),
            order.getTotalAmount(),
            Item.from(item)
        );
    }
}
