package com.deepblog.payment.application;

import com.deepblog.payment.application.command.PaymentChargeCommand;
import com.deepblog.payment.application.event.PaymentCompletedEvent;
import com.deepblog.payment.application.result.PaymentChargeResult;
import com.deepblog.payment.domain.Payment;
import com.deepblog.payment.repository.PaymentRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 단일 결제 유스케이스. "분산 환경" 흉내를 위해 의도적으로 N ms sleep 한 뒤
 * 성공/실패 응답을 반환한다. simulateFailure=true 인 요청은 sleep 없이 즉시 실패 (Saga 보상 시나리오 측정용).
 *
 * <p>성공 케이스만 Payment 행을 INSERT 하고 ApplicationEvent 를 발행한다.
 * Kafka 발행은 {@link com.deepblog.payment.application.event.PaymentCompletedEventHandler}
 * 가 commit 후 (AFTER_COMMIT) 처리한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentChargeService {

    private final PaymentRepository paymentRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${payment.simulated-latency-ms:10000}")
    private long simulatedLatencyMs;

    @Transactional
    public PaymentChargeResult charge(PaymentChargeCommand command) {
        log.info("charge requested. orderRef={}, amount={}, simulateFailure={}",
            command.orderRef(), command.amount(), command.simulateFailure());

        if (command.simulateFailure()) {
            return PaymentChargeResult.failure("SIMULATED_FAILURE");
        }

        try {
            Thread.sleep(simulatedLatencyMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return PaymentChargeResult.failure("INTERRUPTED");
        }

        String paymentId = "PAY-" + UUID.randomUUID();
        paymentRepository.save(Payment.success(paymentId, command.orderRef(), command.amount()));
        eventPublisher.publishEvent(new PaymentCompletedEvent(paymentId, command.orderRef(), command.amount()));

        return PaymentChargeResult.success(paymentId);
    }
}
