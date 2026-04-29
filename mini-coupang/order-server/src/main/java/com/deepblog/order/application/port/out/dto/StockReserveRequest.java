package com.deepblog.order.application.port.out.dto;

/**
 * 재고 선점 포트 입력. 도메인 DTO.
 */
public record StockReserveRequest(long optionId, long quantity) {
}
