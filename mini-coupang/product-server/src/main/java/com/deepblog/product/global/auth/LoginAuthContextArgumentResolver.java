package com.deepblog.product.global.auth;

import com.deepblog.product.application.port.out.AuthVerifyPort;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * {@code @LoginRequired AuthContext auth} 파라미터에 회원/판매자 식별자 묶음을 주입한다.
 * 판매자 전용 엔드포인트는 사용 측에서 {@code auth.sellerId() == null} 검증.
 *
 * <p>{@link AuthVerifyPort} 를 {@link ObjectProvider} 로 받는 이유는
 * {@link LoginAccountIdArgumentResolver} 와 동일.
 */
@Component
@RequiredArgsConstructor
public class LoginAuthContextArgumentResolver implements HandlerMethodArgumentResolver {

    private final ObjectProvider<AuthVerifyPort> authVerifyPortProvider;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(LoginRequired.class)
            && AuthContext.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(
        MethodParameter parameter,
        ModelAndViewContainer mavContainer,
        NativeWebRequest webRequest,
        WebDataBinderFactory binderFactory
    ) {
        return AuthLookup.require(webRequest, authVerifyPortProvider.getObject());
    }
}
