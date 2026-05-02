package com.deepblog.product.event.consumer;

import com.deepblog.common.event.EventMessage;
import com.deepblog.common.event.EventTopic;
import com.deepblog.common.util.JsonConverter;
import com.deepblog.product.application.OrderEventProcessor;
import com.deepblog.product.event.payload.OrderConfirmedPayload;
import com.deepblog.product.event.payload.OrderPaymentFailedPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.retrytopic.TopicSuffixingStrategy;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Component;

/**
 * product-server 는 order 도메인의 두 토픽 ({@code order.confirmed},
 * {@code order.payment-failed}) 을 구독한다. 처리 형태가 다르므로 토픽 헤더로 라우팅한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final OrderEventProcessor processor;
    private final JsonConverter jsonConverter;

    @RetryableTopic(
        backoff = @Backoff(delay = 1000, multiplier = 2.0),
        topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE,
        exclude = { IllegalArgumentException.class }
    )
    @KafkaListener(topics = {
        "#{T(com.deepblog.common.event.EventTopic).ORDER_CONFIRMED.getName()}",
        "#{T(com.deepblog.common.event.EventTopic).ORDER_PAYMENT_FAILED.getName()}"
    })
    public void consume(String message,
                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        long eventId = 0L;
        try {
            EventMessage eventMessage = jsonConverter.fromJson(message, EventMessage.class);
            eventId = eventMessage.eventId();

            switch (EventTopic.fromName(topic)) {
                case ORDER_CONFIRMED -> {
                    OrderConfirmedPayload p = jsonConverter.treeToValue(
                        eventMessage.payload(), OrderConfirmedPayload.class);
                    processor.processOrderConfirmed(eventId, p);
                }
                case ORDER_PAYMENT_FAILED -> {
                    OrderPaymentFailedPayload p = jsonConverter.treeToValue(
                        eventMessage.payload(), OrderPaymentFailedPayload.class);
                    processor.processPaymentFailed(eventId, p);
                }
                case null, default -> log.warn("Unknown topic: {}", topic);
            }
        } catch (DataIntegrityViolationException e) {
            log.info("Duplicate event skipped. eventId={}, topic={}", eventId, topic);
        }
    }

    @DltHandler
    public void handleDlt(String message,
                          @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                          @Header(KafkaHeaders.EXCEPTION_MESSAGE) String errorMessage) {
        log.error("Event moved to DLT. topic={}, errorMessage={}, message={}", topic, errorMessage, message);
    }
}
