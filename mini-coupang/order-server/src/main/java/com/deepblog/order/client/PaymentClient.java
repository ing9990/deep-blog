package com.deepblog.order.client;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.client.dto.PaymentChargeHttpRequest;
import com.deepblog.order.client.dto.PaymentChargeHttpResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-client", url = "${clients.payment-server.url}")
public interface PaymentClient {

    @PostMapping("/internal/payments/charge")
    CommonResponse<PaymentChargeHttpResponse> charge(@RequestBody PaymentChargeHttpRequest request);
}
