package com.deepblog.order.global.auth;

import com.deepblog.order.application.port.out.AuthVerifyPort;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * {@code @LoginRequired Long accountId} 파라미터에 현재 인증된 accountId 를 주입한다.
 * 미인증이면 401 UNAUTHENTICATED.
 *
 * <p>{@link AuthVerifyPort} 를 {@link ObjectProvider} 로 받는 이유: 이 Resolver 는 WebMvc
 * 컨테이너 초기화 시점에 등록되는데, 구현체인 Feign 어댑터가 다시 WebMvc 인프라(메시지 컨버터 등)
 * 를 의존하기 때문에 직접 주입하면 순환이 생긴다. ObjectProvider 는 빈 그래프 빌드 시점이 아니라
 * 실제 요청 처리 시점(모든 빈 생성 완료 후)에 lookup 한다.
 */
@Component
@RequiredArgsConstructor
public class LoginAccountIdArgumentResolver implements HandlerMethodArgumentResolver {

    private final ObjectProvider<AuthVerifyPort> authVerifyPortProvider;

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
        return AuthLookup.require(webRequest, authVerifyPortProvider.getObject()).accountId();
    }
}
