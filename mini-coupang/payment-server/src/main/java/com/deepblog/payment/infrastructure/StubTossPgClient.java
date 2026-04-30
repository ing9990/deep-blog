package com.deepblog.payment.infrastructure;

import com.deepblog.payment.application.port.out.PgClient;
import com.deepblog.payment.application.port.out.dto.PgConfirmRequest;
import com.deepblog.payment.application.port.out.dto.PgConfirmResult;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 학습 환경용 PG 어댑터 stub. 실제로는 토스의 {@code POST /v1/payments/confirm} 호출이 일어날 자리.
 *
 * <p>카드망 왕복 시간을 흉내 내기 위해 {@code payment.pg.min-latency-ms}~{@code max-latency-ms}
 * 범위에서 랜덤 sleep 한다 (기본 150~400ms). 이 sleep 은 사용자 결제 인증 (브라우저 SDK) 과 무관하며
 * 백엔드 confirm 호출의 latency 만 흉내 낸다.
 */
@Slf4j
@Component
public class StubTossPgClient implements PgClient {

    @Value("${payment.pg.min-latency-ms:150}")
    private long minLatencyMs;

    @Value("${payment.pg.max-latency-ms:400}")
    private long maxLatencyMs;

    @Override
    public PgConfirmResult confirm(PgConfirmRequest request) {
        long latency = ThreadLocalRandom.current().nextLong(minLatencyMs, maxLatencyMs + 1);
        try {
            Thread.sleep(latency);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return PgConfirmResult.declined("INTERRUPTED");
        }
        log.info("PG confirm approved (stub). paymentKey={}, orderRef={}, amount={}, latencyMs={}",
            request.paymentKey(), request.orderRef(), request.amount(), latency);
        return PgConfirmResult.approved("TOSS-PG-" + UUID.randomUUID());
    }
}
