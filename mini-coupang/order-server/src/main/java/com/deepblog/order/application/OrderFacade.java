package com.deepblog.order.application;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.order.application.command.PlaceOrderCommand;
import com.deepblog.order.application.event.OrderPaymentFailedEvent;
import com.deepblog.order.application.event.OrderPaymentFailedPublisher;
import com.deepblog.order.application.port.out.PaymentChargePort;
import com.deepblog.order.application.port.out.ProductOptionPort;
import com.deepblog.order.application.port.out.StockReservePort;
import com.deepblog.order.application.port.out.dto.OptionSnapshot;
import com.deepblog.order.application.port.out.dto.PaymentChargeOutcome;
import com.deepblog.order.application.port.out.dto.PaymentChargeRequest;
import com.deepblog.order.application.port.out.dto.StockReserveOutcome;
import com.deepblog.order.application.port.out.dto.StockReserveRequest;
import com.deepblog.order.application.result.PlaceOrderResult;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 단건 주문 오케스트레이션 (옵션 조회 → 재고 선점 → 결제 → 영속화).
 *
 * <p>결제는 ~10초 가량 걸리므로 DB 트랜잭션 밖에서 호출한다. 영속화는 결제 성공 시점에만
 * {@link OrderService#persistOrder} 의 단일 write TX 안에서 일어나고, AFTER_COMMIT 시점에
 * {@code order.confirmed} 가 Kafka 로 나간다.
 *
 * <p>결제 실패 시에는 주문을 영속화하지 않고 보상 이벤트를 즉시 발행한다. product-server
 * consumer 가 Redis 재고를 되돌린다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderFacade {

    private final ProductOptionPort productOptionPort;
    private final StockReservePort stockReservePort;
    private final PaymentChargePort paymentChargePort;
    private final OrderService orderService;
    private final OrderPaymentFailedPublisher orderPaymentFailedPublisher;

    public PlaceOrderResult placeOrder(PlaceOrderCommand command) {
        OptionSnapshot snapshot = productOptionPort.findOption(command.optionId());
        ensurePurchasable(snapshot);

        StockReserveOutcome reserved = stockReservePort.reserve(
            new StockReserveRequest(command.optionId(), command.quantity())
        );
        if (!reserved.reserved()) {
            throw mapReserveFailure(reserved.reason());
        }

        long totalAmount = snapshot.unitPrice() * command.quantity();
        String orderRef = UUID.randomUUID().toString();

        PaymentChargeOutcome outcome = paymentChargePort.charge(
            new PaymentChargeRequest(orderRef, totalAmount, command.simulateFailure())
        );

        if (!outcome.paid()) {
            orderPaymentFailedPublisher.publish(new OrderPaymentFailedEvent(
                command.memberId(),
                command.optionId(),
                command.quantity(),
                outcome.reason()
            ));
            log.info("payment failed; compensation event published. orderRef={}, optionId={}, reason={}",
                orderRef, command.optionId(), outcome.reason());
            throw new BusinessException(ErrorCode.PAYMENT_FAILED);
        }

        return orderService.persistOrder(
            command.memberId(),
            snapshot,
            command.quantity(),
            outcome.paymentId()
        );
    }

    private void ensurePurchasable(OptionSnapshot snapshot) {
        if (!"ACTIVE".equals(snapshot.productStatus())) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_AVAILABLE);
        }
    }

    private BusinessException mapReserveFailure(String reason) {
        return switch (reason) {
            case "INSUFFICIENT_AMOUNT" -> new BusinessException(ErrorCode.INSUFFICIENT_AMOUNT);
            case "STOCK_NOT_FOUND" -> new BusinessException(ErrorCode.STOCK_NOT_FOUND);
            default -> new BusinessException(ErrorCode.INVALID_STOCK, "재고 선점에 실패했습니다.");
        };
    }
}
