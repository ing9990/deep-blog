package com.deepblog.seller.product.common.exception;

import com.deepblog.common.error.ErrorCodeSpec;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ProductErrorCode implements ErrorCodeSpec {

    SKU_ALREADY_EXISTS(
        "PRODUCT_001",
        "이미 등록된 SKU 입니다",
        HttpStatus.CONFLICT
    ),
    PRODUCT_NOT_FOUND(
        "PRODUCT_002",
        "상품을 찾을 수 없습니다",
        HttpStatus.NOT_FOUND
    ),
    PRODUCT_FORBIDDEN(
        "PRODUCT_003",
        "해당 상품에 대한 권한이 없습니다",
        HttpStatus.FORBIDDEN
    ),
    PRODUCT_ALREADY_DELETED(
        "PRODUCT_004",
        "이미 삭제된 상품입니다",
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
