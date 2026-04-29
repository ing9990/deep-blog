package com.deepblog.payment.application.event;

import com.deepblog.common.event.EventTopic;
import com.deepblog.common.infrastructure.kafka.KafkaProducer;
import com.deepblog.common.util.JsonConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 결제 트랜잭션 commit 후에만 Kafka 로 발행한다 (롤백 시 메시지가 나가지 않도록).
 *
 * <p>발행 실패는 콘솔 로그로 끝낸다. 결제 자체는 이미 성공 응답을 반환한 상태이므로 사용자
 * 응답을 보류하지 않는다 (Outbox 미도입 단계의 trade-off).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentCompletedEventHandler {

    private final KafkaProducer kafkaProducer;
    private final JsonConverter jsonConverter;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(PaymentCompletedEvent event) {
        String paymentId = event.getPayload().paymentId();
        kafkaProducer.sendMessage(
            EventTopic.PAYMENT_COMPLETED.getName(),
            paymentId,
            jsonConverter.toJson(event),
            () -> log.error("payment.completed publish failed. paymentId={}", paymentId)
        );
    }
}
