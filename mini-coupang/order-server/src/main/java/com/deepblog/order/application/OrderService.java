package com.deepblog.order.application;

import com.deepblog.order.application.event.OrderConfirmedEvent;
import com.deepblog.order.application.port.out.dto.OptionSnapshot;
import com.deepblog.order.application.result.PlaceOrderResult;
import com.deepblog.order.domain.Order;
import com.deepblog.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 주문 영속화 + 확정 이벤트 발행. 결제까지 성공한 직후에만 호출된다.
 *
 * <p>이벤트는 {@link ApplicationEventPublisher} 로 던진 뒤
 * {@code OrderConfirmedEventHandler} 가 {@code @TransactionalEventListener(AFTER_COMMIT)}
 * 로 받아 Kafka 토픽 {@code order.confirmed} 로 내보낸다. 트랜잭션이 롤백되면 메시지도 나가지 않는다.
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public PlaceOrderResult persistOrder(
        Long memberId,
        OptionSnapshot snapshot,
        Long quantity,
        String paymentId
    ) {
        Order order = Order.create(memberId);
        order.addItem(
            snapshot.productId(),
            snapshot.optionId(),
            snapshot.sku(),
            snapshot.productName(),
            snapshot.optionName(),
            snapshot.unitPrice(),
            quantity
        );
        order.markPaid();

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderConfirmedEvent(
            saved.getId(),
            saved.getMemberId(),
            snapshot.optionId(),
            quantity,
            saved.getTotalAmount()
        ));
        return PlaceOrderResult.of(saved, paymentId);
    }
}
