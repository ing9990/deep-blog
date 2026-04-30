package com.deepblog.order.application;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.order.application.command.ConfirmOrderCommand;
import com.deepblog.order.application.command.PrepareOrderCommand;
import com.deepblog.order.application.port.out.PaymentConfirmPort;
import com.deepblog.order.application.port.out.ProductOptionPort;
import com.deepblog.order.application.port.out.StockReservePort;
import com.deepblog.order.application.port.out.dto.OptionSnapshot;
import com.deepblog.order.application.port.out.dto.PaymentConfirmOutcome;
import com.deepblog.order.application.port.out.dto.PaymentConfirmRequest;
import com.deepblog.order.application.port.out.dto.StockReserveOutcome;
import com.deepblog.order.application.port.out.dto.StockReserveRequest;
import com.deepblog.order.application.result.ConfirmOrderResult;
import com.deepblog.order.application.result.PendingOrderSnapshot;
import com.deepblog.order.application.result.PrepareOrderResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 토스 결제 모델에 맞춘 prepare → confirm 두 단계 오케스트레이션.
 *
 * <ul>
 *   <li>{@link #prepare} - 옵션 조회 → Redis 재고 예약 → Order(PENDING) 영속화. 응답으로 orderId/amount 반환.
 *       클라이언트는 이 값으로 토스 SDK 의 결제 인증을 시작한다.</li>
 *   <li>{@link #confirm} - successUrl 로 받은 paymentKey/amount 검증 → payment-server 의 PG 승인 호출 →
 *       성공 시 Order PAID 전이 + {@code order.confirmed} 발행. 실패 시 Order CANCELED 전이 +
 *       {@code order.payment-failed} 발행 (product-server 가 Redis 재고 복구).</li>
 * </ul>
 *
 * <p>Facade 자체는 트랜잭션을 갖지 않는다. Order 영속화/상태 전이는 {@link OrderService}
 * 의 단일 트랜잭션에서, 외부 호출 (Feign) 은 트랜잭션 밖에서 일어난다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderFacade {

    private final ProductOptionPort productOptionPort;
    private final StockReservePort stockReservePort;
    private final PaymentConfirmPort paymentConfirmPort;
    private final OrderService orderService;

    public PrepareOrderResult prepare(PrepareOrderCommand command) {
        OptionSnapshot snapshot = productOptionPort.findOption(command.optionId());
        ensurePurchasable(snapshot);

        StockReserveOutcome reserved = stockReservePort.reserve(
            new StockReserveRequest(command.optionId(), command.quantity())
        );
        if (!reserved.reserved()) {
            throw mapReserveFailure(reserved.reason());
        }

        return orderService.createPendingOrder(command.memberId(), snapshot, command.quantity());
    }

    public ConfirmOrderResult confirm(ConfirmOrderCommand command) {
        PendingOrderSnapshot pending = orderService.findPendingOwned(command.orderId(), command.memberId());

        if (!pending.totalAmount().equals(command.amount())) {
            cancelAndCompensate(pending, "AMOUNT_MISMATCH");
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        PaymentConfirmOutcome outcome = paymentConfirmPort.confirm(
            new PaymentConfirmRequest(
                command.paymentKey(),
                String.valueOf(command.orderId()),
                command.amount(),
                command.simulateFailure()
            )
        );

        if (!outcome.paid()) {
            cancelAndCompensate(pending, outcome.reason());
            throw new BusinessException(ErrorCode.PAYMENT_FAILED);
        }

        return orderService.confirmOrder(command.orderId(), command.memberId(), outcome.paymentId());
    }

    private void cancelAndCompensate(PendingOrderSnapshot pending, String reason) {
        orderService.cancelOrder(pending.orderId(), pending.memberId(), reason);
        log.info("payment failed; cancel + compensation outbox INSERT done. orderId={}, optionId={}, reason={}",
            pending.orderId(), pending.optionId(), reason);
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
