package com.deepblog.minicoupang.domain.auth.exception;

public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(String email) {
        super("email already registered: " + email);
    }
}
