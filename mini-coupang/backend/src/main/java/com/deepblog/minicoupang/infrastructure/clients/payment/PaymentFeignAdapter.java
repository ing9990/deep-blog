package com.deepblog.minicoupang.infrastructure.clients.payment;

import com.deepblog.minicoupang.domain.order.application.port.out.PaymentPort;
import com.deepblog.minicoupang.domain.order.application.port.out.dto.PaymentChargeCommand;
import com.deepblog.minicoupang.domain.order.application.port.out.dto.PaymentChargeOutcome;
import com.deepblog.minicoupang.infrastructure.clients.payment.dto.PaymentChargeHttpRequest;
import com.deepblog.minicoupang.infrastructure.clients.payment.dto.PaymentChargeHttpResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentFeignAdapter implements PaymentPort {

    private final PaymentFeignClient feignClient;

    @Override
    public PaymentChargeOutcome charge(PaymentChargeCommand command) {
        try {
            PaymentChargeHttpResponse response = feignClient.charge(
                new PaymentChargeHttpRequest(command.orderRef(), command.amount(), command.simulateFailure())
            );
            if (response.paid()) {
                return PaymentChargeOutcome.success(response.paymentId());
            }
            return PaymentChargeOutcome.failure(response.reason());
        } catch (Exception e) {
            log.warn("Payment charge call failed for orderRef={}: {}", command.orderRef(), e.getMessage());
            return PaymentChargeOutcome.failure("PAYMENT_CALL_FAILED");
        }
    }
}
