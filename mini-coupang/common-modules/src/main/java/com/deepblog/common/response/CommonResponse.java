package com.deepblog.common.response;

import com.deepblog.common.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CommonResponse<T>(String code, String message, T data) {

    public static <T> CommonResponse<T> success() {
        return new CommonResponse<>(null, null, null);
    }

    public static <T> CommonResponse<T> success(T data) {
        return new CommonResponse<>(null, null, data);
    }

    public static <T> CommonResponse<T> failure(ErrorCode errorCode) {
        return new CommonResponse<>(errorCode.name(), errorCode.defaultMessage(), null);
    }

    public static <T> CommonResponse<T> failure(ErrorCode errorCode, String message) {
        String resolved = (message == null || message.isBlank())
            ? errorCode.defaultMessage()
            : message;
        return new CommonResponse<>(errorCode.name(), resolved, null);
    }
}
