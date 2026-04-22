package com.deepblog.seller.outbox.service;

import com.deepblog.seller.outbox.repository.OutboxEventRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Debezium이 읽어도 outbox row는 남는다. 매일 03:00 KST에 오래된 행을 삭제한다.
 * 임계값은 Kafka log.retention.hours(기본 168h)와 동일하게 7일로 맞춘다.
 * 발행되지 않은 오래된 행(published_at IS NULL이고 created_at이 임계값 이전)은
 * 장애 신호이므로 별도 알림이 필요한 경우가 있다. 여기서는 모니터링 쿼리 대상에 남기고 삭제만 한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxCleanup {

    private final OutboxEventRepository repository;

    @Value("${seller.outbox.retention-days:7}")
    private long retentionDays;

    @Scheduled(cron = "${seller.outbox.cleanup-cron:0 0 3 * * *}", zone = "Asia/Seoul")
    @Transactional
    public void cleanup() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDays);
        long deleted = repository.deleteByCreatedAtBefore(threshold);
        log.info("outbox cleanup threshold={} deleted={}", threshold, deleted);
    }
}
