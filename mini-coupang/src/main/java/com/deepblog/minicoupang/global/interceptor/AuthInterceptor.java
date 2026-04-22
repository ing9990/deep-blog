package com.deepblog.minicoupang.global.interceptor;

import com.deepblog.minicoupang.domain.auth.AuthContext;
import com.deepblog.minicoupang.domain.auth.AuthContextHolder;
import com.deepblog.minicoupang.domain.auth.SessionKeys;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            Object value = session.getAttribute(SessionKeys.AUTH_ACCOUNT_ID);
            if (value instanceof Long accountId) {
                AuthContextHolder.set(AuthContext.of(accountId));
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler,
        Exception ex
    ) {
        AuthContextHolder.clear();
    }
}
