package com.deepblog.order.application.port.out.dto;

/**
 * 결제 호출 포트 입력. 도메인 DTO.
 *
 * <p>{@code simulateFailure} 는 보상 시나리오 테스트용 스텁 플래그.
 */
public record PaymentChargeRequest(
    String orderRef,
    long amount,
    boolean simulateFailure
) {
}
