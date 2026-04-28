package com.deepblog.minicoupang.domain.order.application.port.out;

import com.deepblog.minicoupang.domain.order.application.port.out.dto.PaymentChargeCommand;
import com.deepblog.minicoupang.domain.order.application.port.out.dto.PaymentChargeOutcome;

/**
 * Outbound port for charging an external payment gateway. The domain depends on
 * this interface; an adapter in the infrastructure layer provides the concrete
 * transport (currently OpenFeign HTTP to the payment-service bootJar).
 */
public interface PaymentPort {

    PaymentChargeOutcome charge(PaymentChargeCommand command);
}
