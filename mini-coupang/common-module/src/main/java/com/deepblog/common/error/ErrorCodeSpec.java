package com.deepblog.common.error;

import org.springframework.http.HttpStatus;

public interface ErrorCodeSpec {

    String code();

    String message();

    HttpStatus status();
}
