package com.deepblog.minicoupang.domain.auth.exception;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("invalid email or password");
    }
}
