package com.deepblog.seller.common.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
    String secret,
    String issuer,
    Duration accessTtl,
    Duration refreshTtl
) {
}
