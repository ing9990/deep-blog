package com.deepblog.member.common.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
    String secret,
    Duration accessTtl,
    Duration refreshTtl
) {
}
