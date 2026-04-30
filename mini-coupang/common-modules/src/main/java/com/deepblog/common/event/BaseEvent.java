package com.deepblog.common.event;

import com.github.f4b6a3.tsid.TsidCreator;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * 발행 측 이벤트의 공통 모양. 도메인별 이벤트는 이 클래스를 확장한다.
 *
 * <p>eventId 는 TSID (시간순 정렬 가능 64비트 정수). consumer 측 멱등성 키로 사용.
 * occurredAt 은 producer 의 wall-clock; consumer 는 절대 시간 비교 용도로만 본다.
 */
public abstract class BaseEvent<T> {
    private final long eventId;
    private final String eventType;
    private final LocalDateTime occurredAt;
    private final T payload;

    protected BaseEvent(String eventType, T payload) {
        this.eventId = TsidCreator.getTsid().toLong();
        this.eventType = eventType;
        this.occurredAt = LocalDateTime.now().truncatedTo(ChronoUnit.MILLIS);
        this.payload = payload;
    }

    public long getEventId() {
        return eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public T getPayload() {
        return payload;
    }
}
