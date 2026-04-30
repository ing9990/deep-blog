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
        .connectTimeout(Duration.ofSeconds(30))
        .version(HttpClient.Version.HTTP_1_1)
        .build();

    private HttpSupport() {
    }

    public static Result postJson(String url, String body, String sessionCookie) {
        // JDK HttpClient HTTP/1.1 keep-alive race: 서버가 idle connection 을 닫은 사이
        // 풀에서 재사용된 stale connection 으로 보내면 EOFException 발생. 한 번 재시도로 우회.
        Exception last = null;
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(90))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body));
                if (sessionCookie != null) {
                    b.header("Cookie", "SESSION=" + sessionCookie);
                }
                HttpResponse<String> response = CLIENT.send(b.build(), HttpResponse.BodyHandlers.ofString());
                String setCookie = response.headers().firstValue("set-cookie").orElse(null);
                String session = extractSessionCookie(setCookie);
                return new Result(response.statusCode(), response.body(), session);
            } catch (java.io.IOException e) {
                last = e;
            } catch (Exception e) {
                last = e;
                break;
            }
        }
        Throwable root = last;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        throw new RuntimeException(
            "HTTP POST failed: " + url
                + " | " + last.getClass().getSimpleName() + ": " + last.getMessage()
                + " | root=" + root.getClass().getSimpleName() + ": " + root.getMessage(),
            last);
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
