package com.deepblog.minicoupang.domain.order.application;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.application.event.OrderConfirmed;
import com.deepblog.minicoupang.domain.order.domain.Order;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final MemberRepository memberRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 결제 성공 후 주문을 영속화하고 OrderConfirmed 이벤트를 발행한다.
     * AFTER_COMMIT 시점에 OrderConfirmedListener -> ProductService 가 MySQL `option_stock` 을 차감한다.
     */
    @Transactional
    public PlaceOrderResult persistOrder(OrderInputs inputs, PlaceOrderCommand command) {
        Member managedMember = memberRepository.findById(inputs.memberId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_A_MEMBER));

        Order order = Order.create(managedMember);
        order.addItem(
            inputs.productId(),
            inputs.optionId(),
            inputs.optionSku(),
            inputs.productName(),
            inputs.optionName(),
            inputs.unitPrice(),
            command.quantity()
        );

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(
            new OrderConfirmed(saved.getId(), command.optionId(), command.quantity())
        );
        return PlaceOrderResult.from(saved);
    }
}
