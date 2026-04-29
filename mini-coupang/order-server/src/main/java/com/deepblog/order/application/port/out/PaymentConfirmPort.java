package com.deepblog.order.application.port.out;

import com.deepblog.order.application.port.out.dto.PaymentConfirmOutcome;
import com.deepblog.order.application.port.out.dto.PaymentConfirmRequest;

/**
 * 토스 모델의 결제 승인 호출 포트. 어댑터(Feign)가 payment-server 의
 * {@code POST /internal/payments/confirm} 을 호출한다.
 *
 * <p>승인은 PG 호출만 포함하므로 짧다 (수백 ms 수준). 결제 인증은 클라이언트 SDK 가 담당하며,
 * 백엔드는 successUrl 로 받은 paymentKey 를 그대로 PG 에 넘겨 승인을 받는다.
 *
 * <p>전송 계층 예외는 어댑터에서 {@link PaymentConfirmOutcome#failure} 로 흡수한다.
 */
public interface PaymentConfirmPort {

    PaymentConfirmOutcome confirm(PaymentConfirmRequest request);
}
