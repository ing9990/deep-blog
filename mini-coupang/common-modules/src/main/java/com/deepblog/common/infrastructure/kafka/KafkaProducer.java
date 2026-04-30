package com.deepblog.common.infrastructure.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * 모든 publisher 가 공유하는 단일 send 컴포넌트.
 *
 * <p>발행은 비동기 ({@code whenComplete}), 실패 시 onError 가 실행된다.
 * Outbox 미도입 단계이므로 commit 직후 크래시 시 메시지 유실 가능 (수용).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void sendMessage(String topic, String key, String payload, Runnable onError) {
        try {
            kafkaTemplate.send(topic, key, payload).whenComplete((result, e) -> {
                if (e == null) {
                    log.info("Kafka sent. topic={}, partition={}, offset={}",
                        topic,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
                } else {
                    log.error("Kafka send failed (async). topic={}, payload={}", topic, payload, e);
                    onError.run();
                }
            });
        } catch (Exception e) {
            log.error("Kafka send failed (sync). topic={}, payload={}", topic, payload, e);
            onError.run();
        }
    }
}
