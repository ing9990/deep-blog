package com.deepblog.order.application.port.out.dto;

/**
 * 결제 승인 호출 포트 입력. 도메인 DTO.
 *
 * <p>{@code paymentKey} 는 토스 SDK 가 발급해 successUrl 로 전달한 결제 키.
 * {@code orderRef} 는 우리 시스템의 주문 식별자 문자열.
 * {@code simulateFailure} 는 보상 시나리오 측정용 스텁 플래그.
 */
public record PaymentConfirmRequest(
    String paymentKey,
    String orderRef,
    long amount,
    boolean simulateFailure
) {
}
