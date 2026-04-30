package com.deepblog.order.outbox;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Persistable;

/**
 * Outbox 패턴의 producer 측 테이블. 도메인 트랜잭션 안에서 INSERT 되어 Kafka 발행 책임을
 * 별도 relay 로 옮긴다. 메시지 발행을 비즈니스 commit 과 원자적으로 묶는 것이 목적.
 *
 * <p>{@link Persistable} 구현으로 manually-assigned TSID PK 환경에서 merge() SELECT 발생 차단.
 */
@Entity
@Table(name = "outbox_events", indexes = {
    @Index(name = "idx_outbox_unpublished", columnList = "published, outbox_event_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OutboxEvent implements Persistable<Long> {

    @Id
    @Column(name = "outbox_event_id")
    private Long id;

    @Column(nullable = false, length = 100)
    private String topic;

    @Column(name = "message_key", length = 255)
    private String messageKey;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Lob
    @Column(nullable = false)
    private String payload;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Transient
    private boolean newEntity = true;

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.newEntity = false;
    }

    public static OutboxEvent create(
        Long id,
        String topic,
        String messageKey,
        long eventId,
        String eventType,
        String payload
    ) {
        OutboxEvent record = new OutboxEvent();
        record.id = id;
        record.topic = topic;
        record.messageKey = messageKey;
        record.eventId = eventId;
        record.eventType = eventType;
        record.payload = payload;
        record.published = false;
        record.createdAt = LocalDateTime.now();
        return record;
    }

    public void markPublished() {
        this.published = true;
        this.publishedAt = LocalDateTime.now();
    }

    @Override
    public boolean isNew() {
        return newEntity;
    }
}
