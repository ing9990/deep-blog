package com.deepblog.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Jackson 래퍼. 직렬화 실패는 RuntimeException 으로 통일한다 (Kafka publish/consume 경로에서
 * checked exception 보일러플레이트 회피 목적).
 *
 * 각 서비스의 ObjectMapper 빈 (Spring Boot 가 자동 등록) 을 그대로 주입받는다.
 */
@Component
@RequiredArgsConstructor
public class JsonConverter {

    private final ObjectMapper objectMapper;

    public String toJson(Object object) {
        if (object == null) {
            throw new IllegalArgumentException("Object to serialize cannot be null");
        }
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize to JSON", e);
        }
    }

    public <T> T fromJson(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to deserialize JSON to " + type.getSimpleName(), e);
        }
    }

    public <T> T treeToValue(JsonNode node, Class<T> type) {
        try {
            return objectMapper.treeToValue(node, type);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert JsonNode to " + type.getSimpleName(), e);
        }
    }

    public JsonNode toJsonNode(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse JSON string", e);
        }
    }
}
