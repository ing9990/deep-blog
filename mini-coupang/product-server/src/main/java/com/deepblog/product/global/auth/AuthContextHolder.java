package com.deepblog.product.global.auth;

import static java.util.Optional.ofNullable;

import java.util.Optional;

/**
 * 현재 요청 스레드의 인증 컨텍스트를 보관한다. Interceptor 가 preHandle 에서 set,
 * afterCompletion 에서 clear 한다. 컨트롤러는 ArgumentResolver 를 통해 간접적으로만 접근.
 */
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
