package com.deepblog.order.application.port.out.dto;

/**
 * 결제 승인 호출 결과. 도메인 DTO.
 *
 * <p>{@code paid == false} 면 OrderFacade 가 주문을 CANCELED 로 전이하고
 * 보상 이벤트를 발행해 product-server 의 Redis 재고를 되돌린다.
 */
public record PaymentConfirmOutcome(
    boolean paid,
    String paymentId,
    String reason
) {

    public static PaymentConfirmOutcome success(String paymentId) {
        return new PaymentConfirmOutcome(true, paymentId, null);
    }

    public static PaymentConfirmOutcome failure(String reason) {
        return new PaymentConfirmOutcome(false, null, reason);
    }
}
