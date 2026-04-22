package com.deepblog.seller.common.auth;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
@RequiredArgsConstructor
public class SellerContextArgumentResolver implements HandlerMethodArgumentResolver {

    private static final String HEADER_AUTHORIZATION = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(AuthenticatedSeller.class)
            && parameter.getParameterType().equals(SellerContext.class);
    }

    @Override
    public Object resolveArgument(
        MethodParameter parameter,
        ModelAndViewContainer mavContainer,
        NativeWebRequest webRequest,
        WebDataBinderFactory binderFactory
    ) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) {
            throw new InvalidJwtException("no http request");
        }
        String header = request.getHeader(HEADER_AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            throw new InvalidJwtException("missing bearer token");
        }
        String token = header.substring(BEARER_PREFIX.length()).trim();
        Long sellerId = jwtProvider.parseSellerIdFromAccess(token);
        return new SellerContext(sellerId);
    }
}
