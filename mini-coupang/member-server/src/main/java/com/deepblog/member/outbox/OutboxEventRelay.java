package com.deepblog.member.outbox;

import java.util.List;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Outbox 테이블에 쌓인 미발행 이벤트를 주기적으로 Kafka 에 보낸다.
 *
 * <p>Kafka send 는 ack 가 도착할 때까지 동기 대기한다 (sync get). ack 실패 시 published
 * 플래그를 true 로 올리지 않으므로 다음 tick 에 재시도된다. 동일 eventId 가 두 번 발행될 가능성은
 * consumer 측 inbox(`processed_events` UNIQUE) 가 흡수한다.
 *
 * <p>한 batch 안의 한 건이라도 실패하면 이후 항목 처리를 멈춰 발행 순서를 보존한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxEventRelay {

    private final OutboxEventRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Scheduled(fixedDelayString = "${outbox.relay.fixed-delay-ms:200}")
    @Transactional
    public void relay() {
        List<OutboxEvent> batch = repository.findTop100ByPublishedFalseOrderByIdAsc();
        if (batch.isEmpty()) {
            return;
        }
        for (OutboxEvent event : batch) {
            try {
                kafkaTemplate.send(event.getTopic(), event.getMessageKey(), event.getPayload())
                    .get(2, TimeUnit.SECONDS);
                event.markPublished();
            } catch (Exception e) {
                log.warn("Outbox publish failed; will retry next tick. id={}, topic={}, err={}",
                    event.getId(), event.getTopic(), e.getMessage());
                break;
            }
        }
    }
}
