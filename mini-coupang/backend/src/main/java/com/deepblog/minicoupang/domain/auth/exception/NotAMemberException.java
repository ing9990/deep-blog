package com.deepblog.minicoupang.domain.auth.exception;

public class NotAMemberException extends RuntimeException {
    public NotAMemberException(String message) {
        super(message);
    }
}
