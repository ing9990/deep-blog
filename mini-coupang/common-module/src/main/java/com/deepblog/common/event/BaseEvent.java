package com.deepblog.common.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.f4b6a3.tsid.TsidCreator;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
public abstract class BaseEvent<P> {

    private final long eventId = TsidCreator.getTsid().toLong();
    private final LocalDateTime occurredAt = LocalDateTime.now();

    public abstract String eventType();

    public abstract P payload();

    public EventEnvelope toEnvelope(ObjectMapper mapper) {
        return new EventEnvelope(eventId, eventType(), mapper.valueToTree(payload()));
    }
}
