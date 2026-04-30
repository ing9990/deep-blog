package com.deepblog.member.outbox;

import com.deepblog.common.event.BaseEvent;
import com.deepblog.common.id.TsidGenerator;
import com.deepblog.common.util.JsonConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 비즈니스 트랜잭션 안에서 outbox 행을 INSERT 한다. 호출자는 별도 @Transactional 을 가진
 * service 메서드 안에서 호출해야 한다 (그래야 비즈니스 commit 과 같이 묶인다).
 */
@Component
@RequiredArgsConstructor
public class OutboxEventStore {

    private final OutboxEventRepository repository;
    private final TsidGenerator tsidGenerator;
    private final JsonConverter jsonConverter;

    public void save(String topic, String messageKey, BaseEvent<?> event) {
        OutboxEvent record = OutboxEvent.create(
            tsidGenerator.nextId(),
            topic,
            messageKey,
            event.getEventId(),
            event.getEventType(),
            jsonConverter.toJson(event)
        );
        repository.save(record);
    }
}
