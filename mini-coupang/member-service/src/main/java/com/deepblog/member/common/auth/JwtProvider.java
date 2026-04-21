package com.deepblog.member.common.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtProvider {

    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final JwtProperties props;
    private final SecretKey key;

    public JwtProvider(JwtProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String issueAccess(Long memberId) {
        return build(memberId, TYPE_ACCESS, props.accessTtl().toMillis());
    }

    public String issueRefresh(Long memberId) {
        return build(memberId, TYPE_REFRESH, props.refreshTtl().toMillis());
    }

    private String build(Long memberId, String type, long ttlMillis) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(memberId.toString())
            .claim(CLAIM_TYPE, type)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(ttlMillis)))
            .signWith(key)
            .compact();
    }
}
