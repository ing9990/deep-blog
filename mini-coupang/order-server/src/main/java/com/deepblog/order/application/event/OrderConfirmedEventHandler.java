package com.deepblog.order.application.event;

import com.deepblog.common.event.EventTopic;
import com.deepblog.common.infrastructure.kafka.KafkaProducer;
import com.deepblog.common.util.JsonConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 주문 영속화 트랜잭션이 commit 된 뒤에만 Kafka 로 발행한다 (롤백 시 메시지가 나가지 않도록).
 *
 * <p>발행 실패는 콘솔 로그로 끝낸다. 사용자에게는 이미 주문 성공 응답을 반환한 상태다 (Outbox
 * 미도입 단계의 trade-off; 도입 후엔 outbox 테이블 + relay 가 책임진다).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderConfirmedEventHandler {

    private final KafkaProducer kafkaProducer;
    private final JsonConverter jsonConverter;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderConfirmedEvent event) {
        Long orderId = event.getPayload().orderId();
        kafkaProducer.sendMessage(
            EventTopic.ORDER_CONFIRMED.getName(),
            String.valueOf(orderId),
            jsonConverter.toJson(event),
            () -> log.error("order.confirmed publish failed. orderId={}", orderId)
        );
    }
}
