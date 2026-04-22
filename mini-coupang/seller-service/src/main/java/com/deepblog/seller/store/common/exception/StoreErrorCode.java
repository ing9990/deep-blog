package com.deepblog.seller.store.common.exception;

import com.deepblog.common.error.ErrorCodeSpec;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum StoreErrorCode implements ErrorCodeSpec {

    SLUG_ALREADY_EXISTS(
        "STORE_001",
        "이미 사용 중인 상점 URL입니다",
        HttpStatus.CONFLICT
    ),
    STORE_NOT_FOUND(
        "STORE_002",
        "상점을 찾을 수 없습니다",
        HttpStatus.NOT_FOUND
    ),
    STORE_FORBIDDEN(
        "STORE_003",
        "해당 상점에 대한 권한이 없습니다",
        HttpStatus.FORBIDDEN
    ),
    STORE_ALREADY_CLOSED(
        "STORE_004",
        "이미 폐점한 상점입니다",
        HttpStatus.CONFLICT
    );

    private final String code;
    private final String message;
    private final HttpStatus status;

    @Override
    public String code() {
        return code;
    }

    @Override
    public String message() {
        return message;
    }

    @Override
    public HttpStatus status() {
        return status;
    }
}
