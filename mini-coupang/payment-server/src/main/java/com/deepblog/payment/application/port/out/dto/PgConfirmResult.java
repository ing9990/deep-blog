package com.deepblog.payment.application.port.out.dto;

/**
 * PG 승인 결과. 토스 응답 모양에서 우리 도메인이 필요한 필드만 추렸다.
 *
 * <p>{@code approved == false} 면 카드 거절 / 한도 초과 등 PG 측 사유. payment-server 는
 * Payment 행을 INSERT 하지 않고 호출자에게 실패를 그대로 전달한다.
 */
public record PgConfirmResult(
    boolean approved,
    String pgPaymentId,
    String reason
) {

    public static PgConfirmResult approved(String pgPaymentId) {
        return new PgConfirmResult(true, pgPaymentId, null);
    }

    public static PgConfirmResult declined(String reason) {
        return new PgConfirmResult(false, null, reason);
    }
}
