package com.deepblog.seller.common.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtProvider {

    static final String CLAIM_TYPE = "type";
    static final String CLAIM_ROLE = "role";
    static final String ROLE_SELLER = "SELLER";
    static final String TYPE_ACCESS = "access";
    static final String TYPE_REFRESH = "refresh";

    private final JwtProperties props;
    private final SecretKey key;

    public JwtProvider(JwtProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String issueAccess(Long sellerId) {
        return build(sellerId, TYPE_ACCESS, props.accessTtl().toMillis());
    }

    public String issueRefresh(Long sellerId) {
        return build(sellerId, TYPE_REFRESH, props.refreshTtl().toMillis());
    }

    public Long parseSellerIdFromAccess(String token) {
        Claims claims = parse(token);
        requireAccess(claims);
        requireSellerRole(claims);
        return Long.valueOf(claims.getSubject());
    }

    private Claims parse(String token) {
        try {
            return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(props.issuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidJwtException("invalid jwt", e);
        }
    }

    private void requireAccess(Claims claims) {
        if (!TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class))) {
            throw new InvalidJwtException("access token required");
        }
    }

    private void requireSellerRole(Claims claims) {
        if (!ROLE_SELLER.equals(claims.get(CLAIM_ROLE, String.class))) {
            throw new InvalidJwtException("SELLER role required");
        }
    }

    private String build(Long sellerId, String type, long ttlMillis) {
        Instant now = Instant.now();
        return Jwts.builder()
            .issuer(props.issuer())
            .subject(sellerId.toString())
            .claim(CLAIM_TYPE, type)
            .claim(CLAIM_ROLE, ROLE_SELLER)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(ttlMillis)))
            .signWith(key)
            .compact();
    }
}
