package com.deepblog.common.response;

/**
 * 모든 서비스가 공유하는 표준 성공 응답 봉투. 실패는 ErrorResponse 가 별도로 담당한다.
 *
 * 단일 자원: {@link #success(Object)}
 * 자원 없음 (예: 204): {@link #ok()}
 */
public record CommonResponse<T>(boolean success, T data) {

    public static <T> CommonResponse<T> success(T data) {
        return new CommonResponse<>(true, data);
    }

    public static CommonResponse<Void> ok() {
        return new CommonResponse<>(true, null);
    }
}
