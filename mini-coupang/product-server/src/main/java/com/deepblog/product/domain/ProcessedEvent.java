package com.deepblog.product.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Consumer 멱등성 키 테이블. (eventId, eventType) 가 UNIQUE.
 *
 * <p>같은 메시지가 두 번 들어오면 INSERT 가 DataIntegrityViolationException 으로 실패하고,
 * consumer 가 catch 하여 처리를 스킵한다 (CONVENTIONS.md §9.6).
 */
@Getter
@Entity
@Table(
    name = "processed_events",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_processed_events_event",
        columnNames = {"event_id", "event_type"}
    )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProcessedEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;

    private ProcessedEvent(Long eventId, String eventType) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.processedAt = LocalDateTime.now();
    }

    public static ProcessedEvent of(long eventId, String eventType) {
        return new ProcessedEvent(eventId, eventType);
    }
}
