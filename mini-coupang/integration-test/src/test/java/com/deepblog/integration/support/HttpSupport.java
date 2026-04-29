package com.deepblog.integration.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public final class HttpSupport {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();

    private HttpSupport() {
    }

    public static Result postJson(String url, String body, String sessionCookie) {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url))
            .timeout(Duration.ofSeconds(60))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body));
        if (sessionCookie != null) {
            b.header("Cookie", "SESSION=" + sessionCookie);
        }
        try {
            HttpResponse<String> response = CLIENT.send(b.build(), HttpResponse.BodyHandlers.ofString());
            String setCookie = response.headers().firstValue("set-cookie").orElse(null);
            String session = extractSessionCookie(setCookie);
            return new Result(response.statusCode(), response.body(), session);
        } catch (Exception e) {
            throw new RuntimeException("HTTP POST failed: " + url, e);
        }
    }

    public static JsonNode parse(String body) {
        try {
            return JSON.readTree(body);
        } catch (Exception e) {
            throw new RuntimeException("JSON parse failed", e);
        }
    }

    public static String json(Object... keyValues) {
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < keyValues.length; i += 2) {
            if (i > 0) sb.append(",");
            sb.append('"').append(keyValues[i]).append("\":");
            Object v = keyValues[i + 1];
            if (v instanceof Number || v instanceof Boolean) {
                sb.append(v);
            } else {
                sb.append('"').append(v).append('"');
            }
        }
        sb.append("}");
        return sb.toString();
    }

    private static String extractSessionCookie(String setCookie) {
        if (setCookie == null) return null;
        int eq = setCookie.indexOf('=');
        int semi = setCookie.indexOf(';');
        if (eq < 0) return null;
        if (!"SESSION".equals(setCookie.substring(0, eq))) return null;
        return setCookie.substring(eq + 1, semi < 0 ? setCookie.length() : semi);
    }

    public record Result(int status, String body, String sessionCookie) {
    }
}
