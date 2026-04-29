package com.deepblog.order.global.auth;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.order.application.port.out.AuthVerifyPort;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;

/**
 * {@link LoginAccountIdArgumentResolver} 와 {@link LoginAuthContextArgumentResolver} 가
 * 같은 요청 안에서 verify 를 두 번 호출하지 않도록 결과를 request 속성으로 캐싱한다.
 */
final class AuthLookup {

    private static final String CACHE_ATTR = AuthLookup.class.getName() + ".AUTH";

    private AuthLookup() {
    }

    static AuthContext require(NativeWebRequest webRequest, AuthVerifyPort authVerifyPort) {
        AuthContext cached = (AuthContext) webRequest.getAttribute(
            CACHE_ATTR, RequestAttributes.SCOPE_REQUEST);
        if (cached != null) {
            return cached;
        }
        HttpServletRequest http = webRequest.getNativeRequest(HttpServletRequest.class);
        String cookie = http == null ? null : http.getHeader(HttpHeaders.COOKIE);
        AuthContext resolved = authVerifyPort.verify(cookie)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));
        webRequest.setAttribute(CACHE_ATTR, resolved, RequestAttributes.SCOPE_REQUEST);
        return resolved;
    }
}
