package com.deepblog.minicoupang.domain.order.application.event;

/**
 * 주문확정 이벤트. 결제까지 성공한 시점에 발행되며, AFTER_COMMIT 단계에서
 * ProductService 가 받아 MySQL 재고를 영구 차감한다.
 *
 * Phase 1 은 Spring ApplicationEventPublisher (in-process). Kafka 이전 시
 * 같은 페이로드 모양으로 직렬화/역직렬화한다.
 */
public record OrderConfirmed(
    Long orderId,
    Long optionId,
    Long quantity
) {
}
