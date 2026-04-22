package com.deepblog.seller.outbox.service;

import com.deepblog.seller.outbox.entity.OutboxEvent;
import com.deepblog.seller.outbox.repository.OutboxEventRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 테스트·로컬 fallback 발행 경로. 운영에서는 Debezium Outbox Event Router가 담당한다.
 * 중복 발행을 막기 위해 {@code debezium} 프로파일이 <strong>비활성</strong>일 때만 동작한다.
 *
 * <p>aggregate_type 값을 그대로 토픽명으로 사용해 Debezium 라우팅과 동일한 결과를 낸다.
 */
@Slf4j
@Component
@Profile("!debezium")
@RequiredArgsConstructor
public class OutboxRelay {

    private static final int BATCH_SIZE = 100;

    private final OutboxEventRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Scheduled(fixedDelayString = "${seller.outbox.poll-delay-ms:2000}")
    @Transactional
    public void relay() {
        List<OutboxEvent> batch = repository.findByPublishedAtIsNullOrderByIdAsc(
            PageRequest.of(0, BATCH_SIZE)
        );
        if (batch.isEmpty()) {
            return;
        }
        for (OutboxEvent event : batch) {
            try {
                kafkaTemplate
                    .send(event.getAggregateType(), event.getAggregateId(), event.getPayload())
                    .get();
                event.markPublished();
            } catch (Exception e) {
                log.error("outbox relay failed id={} eventType={}",
                    event.getId(), event.getEventType(), e);
                return;
            }
        }
        log.info("outbox relayed count={}", batch.size());
    }
}
