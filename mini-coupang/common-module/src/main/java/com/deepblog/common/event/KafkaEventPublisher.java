package com.deepblog.common.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaEventPublisher {

    private final KafkaTemplate<String, String> template;
    private final ObjectMapper mapper;

    public <P> void publish(EventTopic topic, String partitionKey, BaseEvent<P> event) {
        String payload = serialize(event);
        template.send(topic.getName(), partitionKey, payload)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("kafka publish failed topic={} key={} eventType={}",
                        topic.getName(), partitionKey, event.eventType(), ex);
                    return;
                }
                log.info("kafka published topic={} key={} eventType={} eventId={}",
                    topic.getName(), partitionKey, event.eventType(), event.getEventId());
            });
    }

    private <P> String serialize(BaseEvent<P> event) {
        try {
            return mapper.writeValueAsString(event.toEnvelope(mapper));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("failed to serialize event " + event.eventType(), e);
        }
    }
}
