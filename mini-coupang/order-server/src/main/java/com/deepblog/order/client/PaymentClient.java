package com.deepblog.order.client;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.client.dto.PaymentConfirmHttpRequest;
import com.deepblog.order.client.dto.PaymentConfirmHttpResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-client", url = "${clients.payment-server.url}")
public interface PaymentClient {

    @PostMapping("/internal/payments/confirm")
    CommonResponse<PaymentConfirmHttpResponse> confirm(@RequestBody PaymentConfirmHttpRequest request);
}
