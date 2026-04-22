package com.deepblog.product.category.common.exception;

import com.deepblog.common.error.ErrorCodeSpec;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum CategoryErrorCode implements ErrorCodeSpec {

    CATEGORY_NOT_FOUND(
        "CATEGORY_001",
        "카테고리를 찾을 수 없습니다",
        HttpStatus.NOT_FOUND
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
