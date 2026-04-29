package com.deepblog.order.global.auth;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * {@code @LoginRequired Long accountId} 파라미터에 현재 인증된 accountId 를 주입한다.
 * 미인증이면 401 UNAUTHENTICATED.
 */
@Component
public class LoginAccountIdArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(LoginRequired.class)
            && Long.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(
        MethodParameter parameter,
        ModelAndViewContainer mavContainer,
        NativeWebRequest webRequest,
        WebDataBinderFactory binderFactory
    ) {
        return AuthContextHolder.get()
            .map(AuthContext::accountId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));
    }
}
