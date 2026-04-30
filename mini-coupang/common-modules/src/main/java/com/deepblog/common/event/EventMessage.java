package com.deepblog.common.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * 모든 Kafka 메시지의 표준 형태. value 는 이 record 의 JSON 직렬화 결과.
 *
 * eventType 은 토픽이 이미 식별하지만 self-describing 차원에서 유지한다.
 */
public record EventMessage(
    @JsonProperty(required = true) long eventId,
    @JsonProperty(required = true) String eventType,
    @JsonProperty(required = true) JsonNode payload
) {
}
