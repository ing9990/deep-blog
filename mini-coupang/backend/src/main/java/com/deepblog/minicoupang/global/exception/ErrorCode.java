package com.deepblog.minicoupang.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    NOT_A_MEMBER(HttpStatus.FORBIDDEN, "회원 권한이 없습니다."),
    SELLER_NOT_REGISTERED(HttpStatus.NOT_FOUND, "판매자 정보가 등록되지 않았습니다."),
    INVALID_PRODUCT(HttpStatus.BAD_REQUEST, "상품 정보가 올바르지 않습니다."),
    INVALID_SELLER(HttpStatus.BAD_REQUEST, "판매자 정보가 올바르지 않습니다."),
    INVALID_ORDER(HttpStatus.BAD_REQUEST, "주문 정보가 올바르지 않습니다."),
    INVALID_MEMBER(HttpStatus.BAD_REQUEST, "회원 정보가 올바르지 않습니다."),
    INVALID_STOCK(HttpStatus.BAD_REQUEST, "재고 정보가 올바르지 않습니다."),
    OPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "옵션을 찾을 수 없습니다."),
    STOCK_NOT_FOUND(HttpStatus.NOT_FOUND, "재고 정보를 찾을 수 없습니다."),
    INSUFFICIENT_AMOUNT(HttpStatus.CONFLICT, "재고가 부족합니다."),
    INSUFFICIENT_STOCK(HttpStatus.CONFLICT, "재고가 부족합니다."),
    LOCK_ACQUIRE_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "주문 처리 중 락을 획득하지 못했습니다."),
    LOCK_INTERRUPTED(HttpStatus.SERVICE_UNAVAILABLE, "주문 처리 중 락 대기가 중단되었습니다."),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "예상치 못한 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
