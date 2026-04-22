package com.deepblog.seller.outbox.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.util.StringUtils;

@Getter
@Entity
@Builder
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Table(name = "outbox_events")
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aggregate_type", nullable = false, length = 64)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false, length = 64)
    private String aggregateId;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(nullable = false, columnDefinition = "text")
    private String payload;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    public static OutboxEvent of(
        String aggregateType,
        String aggregateId,
        String eventType,
        String payload
    ) {
        validateAggregateType(aggregateType);
        validateAggregateId(aggregateId);
        validateEventType(eventType);
        validatePayload(payload);

        return OutboxEvent.builder()
            .aggregateType(aggregateType)
            .aggregateId(aggregateId)
            .eventType(eventType)
            .payload(payload)
            .build();
    }

    public void markPublished() {
        this.publishedAt = LocalDateTime.now();
    }

    public boolean isPublished() {
        return publishedAt != null;
    }

    private static void validateAggregateType(String v) {
        if (!StringUtils.hasText(v) || v.length() > 64) {
            throw new IllegalArgumentException("invalid aggregateType");
        }
    }

    private static void validateAggregateId(String v) {
        if (!StringUtils.hasText(v) || v.length() > 64) {
            throw new IllegalArgumentException("invalid aggregateId");
        }
    }

    private static void validateEventType(String v) {
        if (!StringUtils.hasText(v) || v.length() > 64) {
            throw new IllegalArgumentException("invalid eventType");
        }
    }

    private static void validatePayload(String v) {
        if (!StringUtils.hasText(v)) {
            throw new IllegalArgumentException("invalid payload");
        }
    }
}
