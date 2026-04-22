package com.deepblog.product.catalog.common.exception;

import com.deepblog.common.error.ErrorCodeSpec;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum CatalogErrorCode implements ErrorCodeSpec {

    PRODUCT_NOT_FOUND(
        "CATALOG_001",
        "상품을 찾을 수 없습니다",
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
