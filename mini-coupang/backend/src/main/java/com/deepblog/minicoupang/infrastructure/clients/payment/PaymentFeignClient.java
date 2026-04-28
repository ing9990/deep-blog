package com.deepblog.minicoupang.infrastructure.clients.payment;

import com.deepblog.minicoupang.infrastructure.clients.payment.dto.PaymentChargeHttpRequest;
import com.deepblog.minicoupang.infrastructure.clients.payment.dto.PaymentChargeHttpResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service", url = "${clients.payment-service.url}")
public interface PaymentFeignClient {

    @PostMapping("/internal/payments/charge")
    PaymentChargeHttpResponse charge(@RequestBody PaymentChargeHttpRequest request);
}
