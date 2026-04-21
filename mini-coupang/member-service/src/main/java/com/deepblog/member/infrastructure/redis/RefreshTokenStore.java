package com.deepblog.member.infrastructure.redis;

import com.deepblog.member.common.auth.JwtProperties;
import java.time.Duration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenStore {

    private static final String KEY_PREFIX = "refresh_token:member:";

    private final StringRedisTemplate redis;
    private final Duration ttl;

    public RefreshTokenStore(StringRedisTemplate redis, JwtProperties props) {
        this.redis = redis;
        this.ttl = props.refreshTtl();
    }

    public void save(Long memberId, String token) {
        redis.opsForValue().set(key(memberId), token, ttl);
    }

    public String find(Long memberId) {
        return redis.opsForValue().get(key(memberId));
    }

    public void revoke(Long memberId) {
        redis.delete(key(memberId));
    }

    private String key(Long memberId) {
        return KEY_PREFIX + memberId;
    }
}
