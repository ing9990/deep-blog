package com.deepblog.order.client.dto;

/**
 * product-server `/internal/stocks/{optionId}/reserve` 응답 본문.
 * CommonResponse 의 data 필드와 같은 모양으로 역직렬화된다.
 */
public record StockReserveHttpResponse(
    long optionId,
    long reservedQuantity,
    long remainingStock
) {
}
