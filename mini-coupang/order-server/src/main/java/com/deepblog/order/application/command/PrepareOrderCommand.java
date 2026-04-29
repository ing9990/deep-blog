package com.deepblog.order.application.command;

/**
 * 주문 준비(결제 인증 직전) 커맨드. 재고 예약 + Order(PENDING) 영속화.
 */
public record PrepareOrderCommand(Long memberId, Long optionId, Long quantity) {

    public static PrepareOrderCommand of(Long memberId, Long optionId, Long quantity) {
        return new PrepareOrderCommand(memberId, optionId, quantity);
    }
}
