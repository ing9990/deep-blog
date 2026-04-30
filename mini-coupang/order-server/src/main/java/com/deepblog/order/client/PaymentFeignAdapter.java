package com.deepblog.order.client;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.application.port.out.PaymentConfirmPort;
import com.deepblog.order.application.port.out.dto.PaymentConfirmOutcome;
import com.deepblog.order.application.port.out.dto.PaymentConfirmRequest;
import com.deepblog.order.client.dto.PaymentConfirmHttpRequest;
import com.deepblog.order.client.dto.PaymentConfirmHttpResponse;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentFeignAdapter implements PaymentConfirmPort {

    private final PaymentClient paymentClient;

    @Override
    public PaymentConfirmOutcome confirm(PaymentConfirmRequest request) {
        try {
            CommonResponse<PaymentConfirmHttpResponse> response = paymentClient.confirm(
                new PaymentConfirmHttpRequest(
                    request.paymentKey(),
                    request.orderRef(),
                    request.amount(),
                    request.simulateFailure()
                )
            );
            PaymentConfirmHttpResponse data = response == null ? null : response.data();
            if (data == null) {
                return PaymentConfirmOutcome.failure("EMPTY_RESPONSE");
            }
            if (data.paid()) {
                return PaymentConfirmOutcome.success(data.paymentId());
            }
            return PaymentConfirmOutcome.failure(data.reason());
        } catch (FeignException e) {
            log.warn("payment confirm call failed. orderRef={}, status={}, message={}",
                request.orderRef(), e.status(), e.getMessage());
            return PaymentConfirmOutcome.failure("PAYMENT_CALL_FAILED");
        }
    }
}
