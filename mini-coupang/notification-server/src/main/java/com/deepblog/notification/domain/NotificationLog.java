package com.deepblog.notification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 발송된 알림의 기록. 현재는 콘솔 로그가 실제 발송 채널이지만 운영 단계에서 SMS/이메일로 확장 시
 * 같은 행이 발송 결과를 기록한다.
 */
@Getter
@Entity
@Table(
    name = "notification_log",
    indexes = {
        @Index(name = "idx_notification_log_event", columnList = "event_id, event_type"),
        @Index(name = "idx_notification_log_account", columnList = "account_id")
    }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "account_id")
    private Long accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String body;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    private NotificationLog(
        Long eventId,
        String eventType,
        Long accountId,
        NotificationChannel channel,
        String title,
        String body
    ) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.accountId = accountId;
        this.channel = channel;
        this.title = title;
        this.body = body;
        this.sentAt = LocalDateTime.now();
    }

    public static NotificationLog of(
        long eventId,
        String eventType,
        Long accountId,
        NotificationChannel channel,
        String title,
        String body
    ) {
        return new NotificationLog(eventId, eventType, accountId, channel, title, body);
    }
}
