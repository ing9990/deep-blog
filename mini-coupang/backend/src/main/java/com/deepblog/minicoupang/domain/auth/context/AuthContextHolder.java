package com.deepblog.minicoupang.domain.auth.context;

import static java.util.Optional.ofNullable;

import java.util.Optional;

public final class AuthContextHolder {

    private static final ThreadLocal<AuthContext> CONTEXT = new ThreadLocal<>();

    private AuthContextHolder() {
    }

    public static void set(AuthContext context) {
        CONTEXT.set(context);
    }

    public static Optional<AuthContext> get() {
        return ofNullable(CONTEXT.get());
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
