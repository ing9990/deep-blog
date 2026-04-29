package com.deepblog.payment.application.command;

public record PaymentChargeCommand(
    String orderRef,
    long amount,
    boolean simulateFailure
) {
    public static PaymentChargeCommand of(String orderRef, long amount, boolean simulateFailure) {
        return new PaymentChargeCommand(orderRef, amount, simulateFailure);
    }
}
