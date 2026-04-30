package com.deepblog.payment.application;

import com.deepblog.common.event.EventTopic;
import com.deepblog.common.id.TsidGenerator;
import com.deepblog.payment.application.command.PaymentConfirmCommand;
import com.deepblog.payment.application.event.PaymentCompletedEvent;
import com.deepblog.payment.application.port.out.PgClient;
import com.deepblog.payment.application.port.out.dto.PgConfirmRequest;
import com.deepblog.payment.application.port.out.dto.PgConfirmResult;
import com.deepblog.payment.application.result.PaymentConfirmResult;
import com.deepblog.payment.domain.Payment;
import com.deepblog.payment.outbox.OutboxEventStore;
import com.deepblog.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 토스 모델의 결제 승인 (confirm) 유스케이스. order-server 가 successUrl 로 받은 paymentKey 를
 * 그대로 넘겨 호출한다.
 *
 * <p>흐름:
 * <ol>
 *   <li>{@code simulateFailure} 가 true 면 PG 호출 없이 즉시 실패 반환 (보상 시나리오 측정용).</li>
 *   <li>{@link PgClient} 어댑터 (학습 환경에서는 {@link com.deepblog.payment.infrastructure.StubTossPgClient})
 *       가 PG 카드망 승인을 수백 ms 내 처리.</li>
 *   <li>승인되면 Payment 행 INSERT + {@link PaymentCompletedEvent} 발행. Kafka 발행은
 *       AFTER_COMMIT 핸들러가 처리.</li>
 *   <li>거절되면 행을 남기지 않고 호출자에게 실패 응답.</li>
 * </ol>
 *
 * <p>이전 버전의 {@code Thread.sleep} 5~15초는 PG 카드망과 사용자 결제 인증을 한 곳에 섞어 두던 모양이었다.
 * 토스 모델에서는 사용자 인증이 브라우저 SDK 측에서 끝나므로 이 서비스는 PG 호출 latency
 * (수백 ms) 만 부담한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentConfirmService {

    private final PaymentRepository paymentRepository;
    private final OutboxEventStore outboxEventStore;
    private final PgClient pgClient;
    private final TsidGenerator tsidGenerator;

    @Transactional
    public PaymentConfirmResult confirm(PaymentConfirmCommand command) {
        log.info("payment confirm requested. paymentKey={}, orderRef={}, amount={}, simulateFailure={}",
            command.paymentKey(), command.orderRef(), command.amount(), command.simulateFailure());

        if (command.simulateFailure()) {
            return PaymentConfirmResult.failure("SIMULATED_FAILURE");
        }

        PgConfirmResult pgResult = pgClient.confirm(
            new PgConfirmRequest(command.paymentKey(), command.orderRef(), command.amount())
        );
        if (!pgResult.approved()) {
            return PaymentConfirmResult.failure(pgResult.reason());
        }

        String paymentId = "PAY-" + tsidGenerator.nextString();
        paymentRepository.save(Payment.success(
            paymentId, command.paymentKey(), command.orderRef(), command.amount()));
        PaymentCompletedEvent event = new PaymentCompletedEvent(
            paymentId, command.orderRef(), command.amount());
        outboxEventStore.save(
            EventTopic.PAYMENT_COMPLETED.getName(),
            String.valueOf(command.orderRef()),
            event
        );

        return PaymentConfirmResult.success(paymentId);
    }
}
