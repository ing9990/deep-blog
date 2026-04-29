package com.deepblog.payment.charge;

import jakarta.validation.Valid;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// payment-service 의 단일 결제 엔드포인트.
// "분산 환경" 흉내를 위해 의도적으로 N ms sleep 한 뒤 성공/실패 응답을 반환한다.
// simulateFailure=true 인 요청은 sleep 없이 즉시 실패 (보상 시나리오 측정용).
@Slf4j
@RestController
@RequestMapping("/internal/payments")
public class PaymentController {

    @Value("${payment.simulated-latency-ms:10000}")
    private long simulatedLatencyMs;

    @PostMapping("/charge")
    public PaymentChargeResponse charge(@Valid @RequestBody PaymentChargeRequest request) {
        log.info("charge requested. orderRef={}, amount={}, simulateFailure={}",
            request.orderRef(), request.amount(), request.simulateFailure());

        if (request.simulateFailure()) {
            return PaymentChargeResponse.failure("SIMULATED_FAILURE");
        }

        try {
            Thread.sleep(simulatedLatencyMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return PaymentChargeResponse.failure("INTERRUPTED");
        }

        String paymentId = "PAY-" + UUID.randomUUID();
        return PaymentChargeResponse.success(paymentId);
    }
}
