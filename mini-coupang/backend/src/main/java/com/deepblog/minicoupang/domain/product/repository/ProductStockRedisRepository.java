package com.deepblog.minicoupang.domain.product.repository;

import java.util.Collections;
import org.redisson.api.RScript;
import org.redisson.api.RScript.Mode;
import org.redisson.api.RScript.ReturnType;
import org.redisson.api.RedissonClient;
import org.redisson.client.codec.StringCodec;
import org.springframework.stereotype.Repository;

// §4 Lua atomic reserve/release.
// Redis 단일 스레드 + EVAL 원자성으로 GET-검증-DECRBY 를 한 명령에 묶는다.
// 락이 별도로 필요 없고, 락-commit 윈도가 존재하지 않는다.
//
// 반환값 프로토콜:
//   - reserveStock: -1=키 없음(상품 미등록), -2=재고 부족, 0 이상=차감 후 남은 재고
//   - releaseStock: -1=키 없음, 0 이상=복구 후 남은 재고
@Repository
public class ProductStockRedisRepository {

    private static final String STOCK_KEY_PREFIX = "stock:option:";

    private static final String RESERVE_SCRIPT =
        "local current = redis.call('GET', KEYS[1])\n" +
        "if current == false then return -1 end\n" +
        "if tonumber(current) < tonumber(ARGV[1]) then return -2 end\n" +
        "return redis.call('DECRBY', KEYS[1], ARGV[1])\n";

    private static final String RELEASE_SCRIPT =
        "local current = redis.call('GET', KEYS[1])\n" +
        "if current == false then return -1 end\n" +
        "return redis.call('INCRBY', KEYS[1], ARGV[1])\n";

    private final RScript script;

    public ProductStockRedisRepository(RedissonClient redissonClient) {
        this.script = redissonClient.getScript(StringCodec.INSTANCE);
    }

    public long reserveStock(long optionId, long quantity) {
        Long result = runScript(RESERVE_SCRIPT, optionId, String.valueOf(quantity));
        return result;
    }

    public long releaseStock(long optionId, long quantity) {
        Long result = runScript(RELEASE_SCRIPT, optionId, String.valueOf(quantity));
        return result;
    }

    public void setStock(long optionId, long quantity) {
        runScript("redis.call('SET', KEYS[1], ARGV[1]) return 1", optionId, String.valueOf(quantity));
    }

    public void deleteStock(long optionId) {
        runScript("return redis.call('DEL', KEYS[1])", optionId);
    }

    public long getCurrentStock(long optionId) {
        Long result = script.eval(
            Mode.READ_ONLY,
            "local v = redis.call('GET', KEYS[1])\n" +
            "if v == false then return -1 end\n" +
            "return tonumber(v)\n",
            ReturnType.INTEGER,
            Collections.singletonList(buildKey(optionId))
        );
        return result;
    }

    private Long runScript(String body, long optionId, Object... args) {
        return script.eval(
            Mode.READ_WRITE,
            body,
            ReturnType.INTEGER,
            Collections.singletonList(buildKey(optionId)),
            args
        );
    }

    private String buildKey(long optionId) {
        return STOCK_KEY_PREFIX + optionId;
    }
}
