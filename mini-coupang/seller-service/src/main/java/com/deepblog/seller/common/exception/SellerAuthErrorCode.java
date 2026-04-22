package com.deepblog.seller.common.exception;

import com.deepblog.common.error.ErrorCodeSpec;
import org.springframework.http.HttpStatus;

public enum SellerAuthErrorCode implements ErrorCodeSpec {

    EMAIL_ALREADY_EXISTS(
        "SELLER_AUTH_001",
        "이미 사용 중인 이메일입니다",
        HttpStatus.CONFLICT
    ),
    BUSINESS_REGISTRATION_NO_ALREADY_EXISTS(
        "SELLER_AUTH_002",
        "이미 등록된 사업자등록번호입니다",
        HttpStatus.CONFLICT
    ),
    INVALID_CREDENTIALS(
        "SELLER_AUTH_003",
        "이메일 또는 비밀번호가 올바르지 않습니다",
        HttpStatus.UNAUTHORIZED
    ),
    SELLER_SUSPENDED(
        "SELLER_AUTH_004",
        "정지된 판매자 계정입니다",
        HttpStatus.FORBIDDEN
    );

    private final String code;
    private final String message;
    private final HttpStatus status;

    SellerAuthErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

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
