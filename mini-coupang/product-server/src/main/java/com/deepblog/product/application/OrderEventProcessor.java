package com.deepblog.product.application;

import com.deepblog.product.domain.ProcessedEvent;
import com.deepblog.product.event.payload.OrderConfirmedPayload;
import com.deepblog.product.event.payload.OrderPaymentFailedPayload;
import com.deepblog.product.repository.OptionStockRepository;
import com.deepblog.product.repository.ProcessedEventRepository;
import com.deepblog.product.repository.ProductStockRedisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * order-server 가 발행한 두 이벤트의 후처리.
 *
 * <ol>
 *   <li>{@code order.confirmed} 수신 → MySQL option_stock 영구 차감.
 *       Redis 는 이미 reserve 단계에서 선차감 되어 있으므로 여기서는 MySQL 만 본다.</li>
 *   <li>{@code order.payment-failed} 수신 → Redis stock 복구 (Saga 보상).
 *       MySQL 차감은 confirmed 만 적용하므로 실패 흐름에서는 MySQL 변경 없음.</li>
 * </ol>
 *
 * <p>각 메서드는 단일 트랜잭션. 1단계로 ProcessedEvent INSERT (UNIQUE 위반 → 중복 스킵), 2단계로
 * 본 처리 수행. consume 측에서 DataIntegrityViolationException 을 catch 하여 idempotent 처리.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderEventProcessor {

    private final ProcessedEventRepository processedEventRepository;
    private final OptionStockRepository optionStockRepository;
    private final ProductStockRedisRepository productStockRedisRepository;

    @Transactional
    public void processOrderConfirmed(long eventId, OrderConfirmedPayload payload) {
        processedEventRepository.save(ProcessedEvent.of(eventId, "ORDER_CONFIRMED"));
        int updated = optionStockRepository.decreaseQuantityIfEnough(
            payload.optionId(), payload.quantity());
        if (updated == 0) {
            log.error("MySQL 재고 영구 차감 실패 (Redis-MySQL drift?). orderId={}, optionId={}, quantity={}",
                payload.orderId(), payload.optionId(), payload.quantity());
        }
    }

    @Transactional
    public void processPaymentFailed(long eventId, OrderPaymentFailedPayload payload) {
        processedEventRepository.save(ProcessedEvent.of(eventId, "ORDER_PAYMENT_FAILED"));
        long remaining = productStockRedisRepository.releaseStock(
            payload.optionId(), payload.quantity());
        if (remaining == -1) {
            log.error("Redis 재고 복구 실패: 키 없음. optionId={}, quantity={}, reason={}",
                payload.optionId(), payload.quantity(), payload.reason());
        }
    }
}
