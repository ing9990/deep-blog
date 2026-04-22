package com.deepblog.product.event;

import com.deepblog.common.event.EventEnvelope;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SellerEventConsumer {

    private final SellerEventHandler handler;
    private final ObjectMapper objectMapper;

    @KafkaListener(
        topics = "${seller.product.topic:seller.product}",
        groupId = "${spring.application.name}"
    )
    public void consume(String message) throws Exception {
        EventEnvelope envelope = objectMapper.readValue(message, EventEnvelope.class);
        handler.handle(envelope);
    }
}
