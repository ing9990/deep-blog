package com.deepblog.common.error;

public class BusinessException extends RuntimeException {

    private final ErrorCodeSpec spec;

    public BusinessException(ErrorCodeSpec spec) {
        super(spec.message());
        this.spec = spec;
    }

    public ErrorCodeSpec spec() {
        return spec;
    }
}
