package com.deepblog.common.event;

import com.fasterxml.jackson.databind.JsonNode;

public record EventEnvelope(long eventId, String eventType, JsonNode payload) {
}
