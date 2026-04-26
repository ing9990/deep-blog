package com.deepblog.minicoupang.domain.seller.exception;

public class SellerNotRegisteredException extends RuntimeException {

    public SellerNotRegisteredException() {
        super("판매자로 등록되지 않은 계정입니다.");
    }

    public SellerNotRegisteredException(String message) {
        super(message);
    }
}
