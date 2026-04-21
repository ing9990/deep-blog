package com.deepblog.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CommonResponse<T>(String code, String message, T data) {

    public static <T> CommonResponse<T> ok(T data) {
        return new CommonResponse<>(null, null, data);
    }

    public static CommonResponse<Void> fail(String code, String message) {
        return new CommonResponse<>(code, message, null);
    }
}
