package com.deepblog.minicoupang.domain.order.application;

import com.deepblog.minicoupang.domain.order.application.port.out.PaymentPort;
import com.deepblog.minicoupang.domain.order.application.port.out.dto.PaymentChargeCommand;
import com.deepblog.minicoupang.domain.order.application.port.out.dto.PaymentChargeOutcome;
import com.deepblog.minicoupang.domain.product.repository.ProductStockRedisRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

// 단일 주문 흐름 (Luascript reserveStock + Saga release).
// 결제(~10s) 는 트랜잭션 밖에서 호출해야 DB 커넥션을 잡지 않으므로 read TX(도메인 조회) 와
// write TX(주문 영속화) 를 분리한다. read TX 종료 뒤 사용하는 값은 primitive/String 만 운반한다.
// 결제 실패 시 releaseStock 으로 Redis 재고를 원복한다 (Saga 보상).
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderFacade {

    private static final long STOCK_KEY_NOT_FOUND = -1L;
    private static final long STOCK_INSUFFICIENT = -2L;

    private final OrderQueryService orderQueryService;
    private final OrderService orderService;
    private final ProductStockRedisRepository productStockRedisRepository;
    private final PaymentPort paymentPort;

    public PlaceOrderResult placeOrder(Long accountId, PlaceOrderCommand command) {
        OrderInputs inputs = orderQueryService.loadOrderInputs(accountId, command.optionId());

        reserveStockOrThrow(command.optionId(), command.quantity());

        long totalAmount = inputs.unitPrice() * command.quantity();
        String orderRef = UUID.randomUUID().toString();

        PaymentChargeOutcome outcome = paymentPort.charge(
            new PaymentChargeCommand(orderRef, totalAmount, command.simulateFailure())
        );

        if (!outcome.paid()) {
            compensateStock(command.optionId(), command.quantity(), outcome.reason());
            throw new BusinessException(ErrorCode.PAYMENT_FAILED);
        }

        return orderService.persistOrder(inputs, command);
    }

    private void reserveStockOrThrow(Long optionId, Long quantity) {
        long reserved = productStockRedisRepository.reserveStock(optionId, quantity);
        if (reserved == STOCK_KEY_NOT_FOUND) {
            throw new BusinessException(ErrorCode.STOCK_NOT_FOUND);
        }
        if (reserved == STOCK_INSUFFICIENT) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_AMOUNT);
        }
    }

    private void compensateStock(Long optionId, Long quantity, String reason) {
        long restored = productStockRedisRepository.releaseStock(optionId, quantity);
        log.info("payment failed, released stock for optionId={}, restored={}, reason={}",
            optionId, restored, reason);
    }
}
