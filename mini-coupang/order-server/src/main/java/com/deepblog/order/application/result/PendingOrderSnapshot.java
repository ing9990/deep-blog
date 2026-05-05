package com.deepblog.order.application.result;

import com.deepblog.order.domain.Order;

/**
 * confirm 단계 도입부에서 OrderService 가 반환하는 가벼운 스냅샷.
 *
 * <p>amount 검증과 보상 이벤트 발행에 필요한 정보 (optionId/quantity/totalAmount) 만 노출하고
 * Order 엔티티 자체는 트랜잭션 밖으로 새지 않게 한다.
 */
public record PendingOrderSnapshot(
    Long orderId,
    Long memberId,
    Long optionId,
    Long quantity,
    Long totalAmount
) {

    public static PendingOrderSnapshot from(Order order) {
        var item = order.getItems().get(0);
        return new PendingOrderSnapshot(
            order.getId(),
            order.getMemberId(),
            item.getOptionId(),
            item.getQuantity(),
            order.getTotalAmount().toLong()
        );
    }
}
