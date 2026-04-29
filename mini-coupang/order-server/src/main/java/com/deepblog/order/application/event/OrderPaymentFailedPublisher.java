package com.deepblog.order.application.event;

import com.deepblog.common.event.EventTopic;
import com.deepblog.common.infrastructure.kafka.KafkaProducer;
import com.deepblog.common.util.JsonConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 결제 실패 시 보상 이벤트를 직접 발행한다. 영속화 트랜잭션이 없는 경로이므로
 * {@code @TransactionalEventListener} 를 쓰지 않고 KafkaProducer 를 즉시 호출한다.
 *
 * <p>발행 실패는 콘솔 로그로만 남긴다. 호출자에게는 이미 PAYMENT_FAILED 응답이 나가는 단계다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderPaymentFailedPublisher {

    private final KafkaProducer kafkaProducer;
    private final JsonConverter jsonConverter;

    public void publish(OrderPaymentFailedEvent event) {
        Long optionId = event.getPayload().optionId();
        kafkaProducer.sendMessage(
            EventTopic.ORDER_PAYMENT_FAILED.getName(),
            String.valueOf(optionId),
            jsonConverter.toJson(event),
            () -> log.error("order.payment-failed publish failed. optionId={}", optionId)
        );
    }
}
