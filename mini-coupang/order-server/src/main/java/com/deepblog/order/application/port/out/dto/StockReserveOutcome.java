package com.deepblog.order.application.port.out.dto;

/**
 * 재고 선점 결과. 도메인 DTO.
 *
 * <p>{@code reserved == false} 면 OrderFacade 가 결제 호출 없이 INVALID_STOCK/INSUFFICIENT_AMOUNT
 * 로 끝낸다. 보상은 결제 실패 경로에서만 필요하다.
 */
public record StockReserveOutcome(
    boolean reserved,
    long optionId,
    long reservedQuantity,
    long remainingStock,
    String reason
) {

    public static StockReserveOutcome success(long optionId, long reservedQuantity, long remainingStock) {
        return new StockReserveOutcome(true, optionId, reservedQuantity, remainingStock, null);
    }

    public static StockReserveOutcome failure(long optionId, String reason) {
        return new StockReserveOutcome(false, optionId, 0L, -1L, reason);
    }
}
