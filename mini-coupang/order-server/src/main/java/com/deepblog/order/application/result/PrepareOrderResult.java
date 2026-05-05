package com.deepblog.order.application.result;

import com.deepblog.order.domain.Order;

/**
 * prepare 결과. 클라이언트는 이 응답의 {@code orderId}/{@code amount} 를 토스 SDK 의
 * {@code requestPayment(orderId, amount)} 인자로 사용한다.
 */
public record PrepareOrderResult(
    Long orderId,
    Long memberId,
    String status,
    Long amount,
    Long optionId,
    Long quantity
) {

    public static PrepareOrderResult of(Order order, Long optionId, Long quantity) {
        return new PrepareOrderResult(
            order.getId(),
            order.getMemberId(),
            order.getStatus().name(),
            order.getTotalAmount().toLong(),
            optionId,
            quantity
        );
    }
}
