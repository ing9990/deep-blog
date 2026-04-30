package com.deepblog.order.domain;

/**
 * 주문 상태.
 *
 * <ul>
 *   <li>{@link #PENDING} - prepare 직후. 재고 예약은 끝났고 결제 인증/승인 대기 중.</li>
 *   <li>{@link #PAID} - confirm 성공. PG 승인 완료.</li>
 *   <li>{@link #CANCELED} - confirm 실패 (amount 불일치 / PG 거절 / 사용자 취소).
 *       이 상태로 전환될 때 {@code order.payment-failed} 가 발행되어 Redis 재고를 복구한다.</li>
 * </ul>
 */
public enum OrderStatus {
    PENDING,
    PAID,
    CANCELED
}
