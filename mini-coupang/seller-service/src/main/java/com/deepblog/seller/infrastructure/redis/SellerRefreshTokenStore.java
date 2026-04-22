package com.deepblog.seller.infrastructure.redis;

import com.deepblog.seller.common.auth.JwtProperties;
import java.time.Duration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class SellerRefreshTokenStore {

    private static final String KEY_PREFIX = "refresh_token:seller:";

    private final StringRedisTemplate redis;
    private final Duration ttl;

    public SellerRefreshTokenStore(StringRedisTemplate redis, JwtProperties props) {
        this.redis = redis;
        this.ttl = props.refreshTtl();
    }

    public void save(Long sellerId, String token) {
        redis.opsForValue().set(key(sellerId), token, ttl);
    }

    public String find(Long sellerId) {
        return redis.opsForValue().get(key(sellerId));
    }

    public void revoke(Long sellerId) {
        redis.delete(key(sellerId));
    }

    private String key(Long sellerId) {
        return KEY_PREFIX + sellerId;
    }
}
