package com.deepblog.minicoupang.infrastructure.clients.embed;

/**
 * Raised by {@code EmbedGrpcAdapter} when the remote ML service returns
 * {@code success = false}. The adapter guarantees "success or exception"
 * so callers do not have to inspect response flags.
 */
public class EmbedAdapterException extends RuntimeException {

    public EmbedAdapterException(String message) {
        super(message);
    }

    public EmbedAdapterException(String message, Throwable cause) {
        super(message, cause);
    }
}
