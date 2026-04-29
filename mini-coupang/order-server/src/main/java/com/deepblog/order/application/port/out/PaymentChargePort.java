package com.deepblog.order.application.port.out;

import com.deepblog.order.application.port.out.dto.PaymentChargeOutcome;
import com.deepblog.order.application.port.out.dto.PaymentChargeRequest;

/**
 * 외부 결제 호출 포트. 어댑터(Feign)가 payment-server 의
 * {@code POST /internal/payments/charge} 를 호출한다.
 *
 * <p>전송 계층 예외는 어댑터에서 {@link PaymentChargeOutcome#failure} 로 흡수한다.
 */
public interface PaymentChargePort {

    PaymentChargeOutcome charge(PaymentChargeRequest request);
}
