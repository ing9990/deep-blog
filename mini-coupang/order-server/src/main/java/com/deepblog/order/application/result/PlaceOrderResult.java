package com.deepblog.order.application.result;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.order.domain.Order;
import com.deepblog.order.domain.OrderItem;

public record PlaceOrderResult(
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

    public static PlaceOrderResult of(Order order, String paymentId) {
        OrderItem item = order.getItems().stream()
            .findFirst()
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_ORDER, "주문 항목이 존재하지 않습니다."));
        return new PlaceOrderResult(
            order.getId(),
            order.getMemberId(),
            order.getStatus().name(),
            order.getTotalAmount(),
            paymentId,
            Item.from(item)
        );
    }
}
