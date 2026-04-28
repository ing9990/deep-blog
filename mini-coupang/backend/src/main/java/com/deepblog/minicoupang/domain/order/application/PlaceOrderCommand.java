package com.deepblog.minicoupang.domain.order.application;

/**
 * `simulateFailure` 는 §4 Saga 보상 시나리오 측정용. 실제 클라이언트는 항상 false 로 호출.
 * payment-service 가 이 플래그를 받아 결제 실패 응답을 반환한다.
 */
public record PlaceOrderCommand(Long optionId, Long quantity, boolean simulateFailure) {

    public PlaceOrderCommand(Long optionId, Long quantity) {
        this(optionId, quantity, false);
    }
}
