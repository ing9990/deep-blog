package com.deepblog.payment.application.port.out;

import com.deepblog.payment.application.port.out.dto.PgConfirmRequest;
import com.deepblog.payment.application.port.out.dto.PgConfirmResult;

/**
 * 외부 PG (토스페이먼츠) 의 결제 승인 API 호출 포트. 도메인이 의존하는 추상화.
 *
 * <p>실제 운영 환경에서는 토스의 {@code POST /v1/payments/confirm} 을 호출하는 어댑터를 둔다.
 * 학습 환경에서는 {@code StubTossPgClient} 가 150~400ms sleep 후 성공을 돌려준다.
 *
 * <p>이 포트의 책임은 PG 카드망 승인 한 번이며, payment-server 자체의 영속화/이벤트는 호출 측이 처리한다.
 */
public interface PgClient {

    PgConfirmResult confirm(PgConfirmRequest request);
}
