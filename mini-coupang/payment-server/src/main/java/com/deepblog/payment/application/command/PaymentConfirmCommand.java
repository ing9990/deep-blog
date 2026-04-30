package com.deepblog.payment.application.command;

public record PaymentConfirmCommand(
    String paymentKey,
    String orderRef,
    long amount,
    boolean simulateFailure
) {
    public static PaymentConfirmCommand of(
        String paymentKey, String orderRef, long amount, boolean simulateFailure
    ) {
        return new PaymentConfirmCommand(paymentKey, orderRef, amount, simulateFailure);
    }
}
