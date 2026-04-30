package com.deepblog.order.client;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.client.dto.AuthVerifyResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "member-auth-client", url = "${clients.member-server.url}")
public interface MemberAuthClient {

    @GetMapping("/internal/auth/verify")
    CommonResponse<AuthVerifyResponse> verify(@RequestHeader(HttpHeaders.COOKIE) String cookie);
}
