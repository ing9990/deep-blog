package com.deepblog.common.exception;

import java.time.Instant;

public record ErrorResponse(
    Instant timestamp,
    int status,
    String code,
    String message
) {

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        String resolved = (message == null || message.isBlank())
            ? errorCode.defaultMessage()
            : message;
        return new ErrorResponse(
            Instant.now(),
            errorCode.status().value(),
            errorCode.name(),
            resolved
        );
    }
}
