package com.deepblog.payment.application.event;

import com.deepblog.common.event.BaseEvent;

public class PaymentCompletedEvent extends BaseEvent<PaymentCompletedEvent.Payload> {

    public PaymentCompletedEvent(String paymentId, String orderRef, long amount) {
        super(PaymentEventType.PAYMENT_COMPLETED.name(),
              new Payload(paymentId, orderRef, amount));
    }

    public record Payload(String paymentId, String orderRef, long amount) {
    }
}
