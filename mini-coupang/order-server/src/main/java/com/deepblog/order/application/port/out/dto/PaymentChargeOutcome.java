package com.deepblog.order.application.port.out.dto;

/**
 * 결제 호출 결과. 도메인 DTO.
 *
 * <p>{@code paid == false} 면 OrderFacade 가 보상 이벤트를 발행해 product-server 의 재고를 되돌린다.
 */
public record PaymentChargeOutcome(
    boolean paid,
    String paymentId,
    String reason
) {

    public static PaymentChargeOutcome success(String paymentId) {
        return new PaymentChargeOutcome(true, paymentId, null);
    }

    public static PaymentChargeOutcome failure(String reason) {
        return new PaymentChargeOutcome(false, null, reason);
    }
}
