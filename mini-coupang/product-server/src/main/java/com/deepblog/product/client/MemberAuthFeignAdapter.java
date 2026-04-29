package com.deepblog.product.client;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.product.application.port.out.AuthVerifyPort;
import com.deepblog.product.client.dto.AuthVerifyResponse;
import com.deepblog.product.global.auth.AuthContext;
import feign.FeignException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberAuthFeignAdapter implements AuthVerifyPort {

    private final MemberAuthClient memberAuthClient;

    @Override
    public Optional<AuthContext> verify(String cookieHeader) {
        if (cookieHeader == null || cookieHeader.isBlank()) {
            return Optional.empty();
        }
        try {
            CommonResponse<AuthVerifyResponse> response = memberAuthClient.verify(cookieHeader);
            AuthVerifyResponse data = response == null ? null : response.data();
            if (data == null || data.accountId() == null) {
                return Optional.empty();
            }
            return Optional.of(AuthContext.of(data.accountId(), data.memberId(), data.sellerId()));
        } catch (FeignException.Unauthorized e) {
            return Optional.empty();
        } catch (FeignException e) {
            log.warn("auth verify call failed. status={}, message={}", e.status(), e.getMessage());
            return Optional.empty();
        }
    }
}
