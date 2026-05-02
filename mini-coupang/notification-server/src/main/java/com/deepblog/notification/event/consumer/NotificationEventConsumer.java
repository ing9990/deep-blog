package com.deepblog.notification.event.consumer;

import com.deepblog.common.event.EventMessage;
import com.deepblog.common.event.EventTopic;
import com.deepblog.common.util.JsonConverter;
import com.deepblog.notification.event.payload.MemberSignedUpPayload;
import com.deepblog.notification.event.payload.OrderConfirmedPayload;
import com.deepblog.notification.event.payload.OrderPaymentFailedPayload;
import com.deepblog.notification.event.payload.PaymentCompletedPayload;
import com.deepblog.notification.event.payload.SellerSignedUpPayload;
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
 * notification-server 는 5개 토픽을 모두 구독한다 (member.signed-up, seller.signed-up,
 * order.confirmed, order.payment-failed, payment.completed). 처리 형태가 동일 (멱등 체크 +
 * notification_log INSERT + 콘솔 출력) 이므로 한 listener 메서드에서 토픽으로 라우팅한다.
 *
 * <p>retry/DLT 는 listener 단위로 자동 생성된다. 토픽 5종 각각의 retry/DLT 토픽이 생긴다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private final NotificationEventProcessor processor;
    private final JsonConverter jsonConverter;

    @RetryableTopic(
        backoff = @Backoff(delay = 1000, multiplier = 2.0),
        topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE,
        exclude = { IllegalArgumentException.class }
    )
    @KafkaListener(topics = {
        "#{T(com.deepblog.common.event.EventTopic).MEMBER_SIGNED_UP.getName()}",
        "#{T(com.deepblog.common.event.EventTopic).SELLER_SIGNED_UP.getName()}",
        "#{T(com.deepblog.common.event.EventTopic).ORDER_CONFIRMED.getName()}",
        "#{T(com.deepblog.common.event.EventTopic).ORDER_PAYMENT_FAILED.getName()}",
        "#{T(com.deepblog.common.event.EventTopic).PAYMENT_COMPLETED.getName()}"
    })
    public void consume(String message,
                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        long eventId = 0L;
        try {
            EventMessage eventMessage = jsonConverter.fromJson(message, EventMessage.class);
            eventId = eventMessage.eventId();

            switch (EventTopic.fromName(topic)) {
                case MEMBER_SIGNED_UP -> {
                    MemberSignedUpPayload p = jsonConverter.treeToValue(eventMessage.payload(), MemberSignedUpPayload.class);
                    processor.notifyMemberSignedUp(eventId, p);
                }
                case SELLER_SIGNED_UP -> {
                    SellerSignedUpPayload p = jsonConverter.treeToValue(eventMessage.payload(), SellerSignedUpPayload.class);
                    processor.notifySellerSignedUp(eventId, p);
                }
                case ORDER_CONFIRMED -> {
                    OrderConfirmedPayload p = jsonConverter.treeToValue(eventMessage.payload(), OrderConfirmedPayload.class);
                    processor.notifyOrderConfirmed(eventId, p);
                }
                case ORDER_PAYMENT_FAILED -> {
                    OrderPaymentFailedPayload p = jsonConverter.treeToValue(eventMessage.payload(), OrderPaymentFailedPayload.class);
                    processor.notifyOrderPaymentFailed(eventId, p);
                }
                case PAYMENT_COMPLETED -> {
                    PaymentCompletedPayload p = jsonConverter.treeToValue(eventMessage.payload(), PaymentCompletedPayload.class);
                    processor.notifyPaymentCompleted(eventId, p);
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
