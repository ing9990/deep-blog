package com.deepblog.order.client;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.application.port.out.PaymentChargePort;
import com.deepblog.order.application.port.out.dto.PaymentChargeOutcome;
import com.deepblog.order.application.port.out.dto.PaymentChargeRequest;
import com.deepblog.order.client.dto.PaymentChargeHttpRequest;
import com.deepblog.order.client.dto.PaymentChargeHttpResponse;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentFeignAdapter implements PaymentChargePort {

    private final PaymentClient paymentClient;

    @Override
    public PaymentChargeOutcome charge(PaymentChargeRequest request) {
        try {
            CommonResponse<PaymentChargeHttpResponse> response = paymentClient.charge(
                new PaymentChargeHttpRequest(request.orderRef(), request.amount(), request.simulateFailure())
            );
            PaymentChargeHttpResponse data = response == null ? null : response.data();
            if (data == null) {
                return PaymentChargeOutcome.failure("EMPTY_RESPONSE");
            }
            if (data.paid()) {
                return PaymentChargeOutcome.success(data.paymentId());
            }
            return PaymentChargeOutcome.failure(data.reason());
        } catch (FeignException e) {
            log.warn("payment charge call failed. orderRef={}, status={}, message={}",
                request.orderRef(), e.status(), e.getMessage());
            return PaymentChargeOutcome.failure("PAYMENT_CALL_FAILED");
        }
    }
}
