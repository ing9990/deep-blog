package com.deepblog.minicoupang.domain.auth.context;

public record AuthContext(Long accountId) {

    public static AuthContext of(Long accountId) {
        return new AuthContext(accountId);
    }
}
