package com.deepblog.minicoupang.global.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * 간단한 HS256 JWT 발급/파싱. 실제 리소스 보호는 Phase 2 후반 filter에서 재사용.
 */
@Component
public class JwtProvider {

    private final SecretKey key;
    private final long ttlSeconds;

    public JwtProvider(JwtProperties properties) {
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
        this.ttlSeconds = properties.ttl().getSeconds();
    }

    public String issue(String subject, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(subject)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long ttlSeconds() {
        return ttlSeconds;
    }
}
