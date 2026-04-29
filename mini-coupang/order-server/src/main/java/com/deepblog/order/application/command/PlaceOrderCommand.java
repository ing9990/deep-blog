package com.deepblog.order.application.command;

/**
 * 단건 주문 실행 커맨드.
 *
 * <p>{@code simulateFailure} 는 보상 시나리오 측정을 위한 스텁 플래그. 실제 클라이언트는 항상
 * false 로 호출하고, payment-server 가 이 값을 그대로 받아 결제 실패 응답을 만든다.
 */
public record PlaceOrderCommand(Long memberId, Long optionId, Long quantity, boolean simulateFailure) {

    public static PlaceOrderCommand of(Long memberId, Long optionId, Long quantity, boolean simulateFailure) {
        return new PlaceOrderCommand(memberId, optionId, quantity, simulateFailure);
    }
}
