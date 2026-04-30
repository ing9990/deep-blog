package com.deepblog.order.application;

import com.deepblog.common.event.EventTopic;
import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.common.id.TsidGenerator;
import com.deepblog.order.application.event.OrderConfirmedEvent;
import com.deepblog.order.application.event.OrderPaymentFailedEvent;
import com.deepblog.order.application.port.out.dto.OptionSnapshot;
import com.deepblog.order.application.result.ConfirmOrderResult;
import com.deepblog.order.application.result.PendingOrderSnapshot;
import com.deepblog.order.application.result.PrepareOrderResult;
import com.deepblog.order.domain.Order;
import com.deepblog.order.domain.OrderStatus;
import com.deepblog.order.outbox.OutboxEventStore;
import com.deepblog.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 주문 영속화 + 상태 전이 + outbox 발행.
 *
 * <p>토스 결제 흐름에 맞춰 prepare → confirm 두 단계로 분리.
 * <ul>
 *   <li>{@link #createPendingOrder} - prepare 단계. PENDING 상태로 INSERT, 이벤트 발행 없음.</li>
 *   <li>{@link #findPendingOwned} - confirm 도입부. 소유권/상태 확인 후 보상에 필요한 스냅샷 반환.</li>
 *   <li>{@link #confirmOrder} - confirm 성공. PAID 전이 + {@code order.confirmed} outbox INSERT (같은 TX).</li>
 *   <li>{@link #cancelOrder} - confirm 실패. CANCELED 전이 + {@code order.payment-failed} outbox INSERT (같은 TX).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OutboxEventStore outboxEventStore;
    private final TsidGenerator tsidGenerator;

    @Transactional
    public PrepareOrderResult createPendingOrder(
        Long memberId,
        OptionSnapshot snapshot,
        Long quantity
    ) {
        Order order = Order.create(tsidGenerator.nextId(), memberId);
        order.addItem(
            snapshot.productId(),
            snapshot.optionId(),
            snapshot.sku(),
            snapshot.productName(),
            snapshot.optionName(),
            snapshot.unitPrice(),
            quantity
        );
        Order saved = orderRepository.save(order);
        return PrepareOrderResult.of(saved, snapshot.optionId(), quantity);
    }

    @Transactional(readOnly = true)
    public PendingOrderSnapshot findPendingOwned(Long orderId, Long memberId) {
        return PendingOrderSnapshot.from(loadOwnedPending(orderId, memberId));
    }

    @Transactional
    public ConfirmOrderResult confirmOrder(Long orderId, Long memberId, String paymentId) {
        Order order = loadOwnedPending(orderId, memberId);
        order.markPaid();
        OrderConfirmedEvent event = toConfirmedEvent(order);
        outboxEventStore.save(
            EventTopic.ORDER_CONFIRMED.getName(),
            String.valueOf(order.getId()),
            event
        );
        return ConfirmOrderResult.of(order, paymentId);
    }

    @Transactional
    public void cancelOrder(Long orderId, Long memberId, String reason) {
        Order order = loadOwnedPending(orderId, memberId);
        order.markCanceled();
        var item = order.getItems().getFirst();
        OrderPaymentFailedEvent event = new OrderPaymentFailedEvent(
            order.getMemberId(),
            item.getOptionId(),
            item.getQuantity(),
            reason
        );
        outboxEventStore.save(
            EventTopic.ORDER_PAYMENT_FAILED.getName(),
            String.valueOf(item.getOptionId()),
            event
        );
    }

    private Order loadOwnedPending(Long orderId, Long memberId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        if (!order.getMemberId().equals(memberId)) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException(ErrorCode.ORDER_NOT_PENDING);
        }
        return order;
    }

    private OrderConfirmedEvent toConfirmedEvent(Order order) {
        var item = order.getItems().getFirst();
        return new OrderConfirmedEvent(
            order.getId(),
            order.getMemberId(),
            item.getOptionId(),
            item.getQuantity(),
            order.getTotalAmount()
        );
    }
}
