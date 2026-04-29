package com.deepblog.minicoupang.domain.product.repository;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Repository;

// Redis 단일 스레드 + EVAL 원자성으로 GET-검증-DECRBY 를 한 명령에 묶는다.
// 반환값:
//   reserveStock: -1=키 없음, -2=재고 부족, 0 이상=차감 후 남은 재고
//   releaseStock: -1=키 없음, 0 이상=복구 후 남은 재고
@Repository
@RequiredArgsConstructor
public class ProductStockRedisRepository {

    private static final String STOCK_KEY_PREFIX = "stock:option:";

    private static final DefaultRedisScript<Long> RESERVE_STOCK_SCRIPT = new DefaultRedisScript<>("""
            local current = redis.call('GET', KEYS[1])
            if current == false then return -1 end
            if tonumber(current) < tonumber(ARGV[1]) then return -2 end
            return redis.call('DECRBY', KEYS[1], ARGV[1])
            """, Long.class);

    private static final DefaultRedisScript<Long> RELEASE_STOCK_SCRIPT = new DefaultRedisScript<>("""
            local current = redis.call('GET', KEYS[1])
            if current == false then return -1 end
            return redis.call('INCRBY', KEYS[1], ARGV[1])
            """, Long.class);

    private final StringRedisTemplate redisTemplate;

    public long reserveStock(long optionId, long quantity) {
        return redisTemplate.execute(RESERVE_STOCK_SCRIPT, List.of(buildKey(optionId)), String.valueOf(quantity));
    }

    public long releaseStock(long optionId, long quantity) {
        return redisTemplate.execute(RELEASE_STOCK_SCRIPT, List.of(buildKey(optionId)), String.valueOf(quantity));
    }

    public void setStock(long optionId, long quantity) {
        redisTemplate.opsForValue().set(buildKey(optionId), String.valueOf(quantity));
    }

    public long getCurrentStock(long optionId) {
        String value = redisTemplate.opsForValue().get(buildKey(optionId));
        return value == null ? -1 : Long.parseLong(value);
    }

    private String buildKey(long optionId) {
        return STOCK_KEY_PREFIX + optionId;
    }
}
