package com.deepblog.order.application.command;

/**
 * 결제 승인 커맨드. successUrl 리다이렉트로 받은 paymentKey + amount 를 백엔드에 전달.
 *
 * <p>{@code simulateFailure} 는 보상 시나리오 측정용 스텁 플래그. true 면 PG 호출 없이 즉시 실패.
 */
public record ConfirmOrderCommand(
    Long memberId,
    Long orderId,
    String paymentKey,
    Long amount,
    boolean simulateFailure
) {

    public static ConfirmOrderCommand of(
        Long memberId,
        Long orderId,
        String paymentKey,
        Long amount,
        boolean simulateFailure
    ) {
        return new ConfirmOrderCommand(memberId, orderId, paymentKey, amount, simulateFailure);
    }
}
