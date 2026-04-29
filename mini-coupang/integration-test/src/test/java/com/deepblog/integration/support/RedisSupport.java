package com.deepblog.integration.support;

import com.deepblog.integration.MsaEndpoints;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public final class RedisSupport {

    private RedisSupport() {
    }

    public static RedisClient client() {
        RedisURI uri = RedisURI.builder()
            .withHost(MsaEndpoints.redisHost())
            .withPort(MsaEndpoints.redisPort())
            .build();
        return RedisClient.create(uri);
    }

    public static long getStock(RedisCommands<String, String> cmd, long optionId) {
        String value = cmd.get("stock:option:" + optionId);
        if (value == null) {
            return -1L;
        }
        return Long.parseLong(value);
    }

    public static void setStock(RedisCommands<String, String> cmd, long optionId, long quantity) {
        cmd.set("stock:option:" + optionId, String.valueOf(quantity));
    }

    public static StatefulRedisConnection<String, String> connect(RedisClient client) {
        return client.connect();
    }
}
