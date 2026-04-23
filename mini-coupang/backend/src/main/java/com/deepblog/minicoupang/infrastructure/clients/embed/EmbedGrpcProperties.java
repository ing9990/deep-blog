package com.deepblog.minicoupang.infrastructure.clients.embed;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Adapter-side configuration for the Python ML gRPC endpoint. Channel address
 * and negotiation type are managed by grpc-client-spring-boot-starter under
 * {@code grpc.client.embed.*}. Only the per-call deadline lives here.
 *
 * @param deadlineMs  per-call deadline. Breached calls throw DEADLINE_EXCEEDED instead of hanging.
 */
@ConfigurationProperties(prefix = "embed.grpc")
public record EmbedGrpcProperties(long deadlineMs) {}
