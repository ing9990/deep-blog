package com.deepblog.common.money;

import jakarta.persistence.Embeddable;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Embeddable
public record Money(long amount) implements Comparable<Money> {

    public static final Money ZERO = new Money(0L);

    public Money {
        if (amount < 0L) {
            throw new IllegalArgumentException("금액은 0 이상이어야 합니다. amount=" + amount);
        }
        amount = roundToTen(amount);
    }

    public static Money of(long amount) {
        return new Money(amount);
    }

    public static Money won(long amount) {
        return new Money(amount);
    }

    public static Money zero() {
        return ZERO;
    }

    public Money add(Money other) {
        return new Money(this.amount + other.amount);
    }

    public Money subtract(Money other) {
        return new Money(this.amount - other.amount);
    }

    public Money multiply(long quantity) {
        if (quantity < 0L) {
            throw new IllegalArgumentException("배수는 0 이상이어야 합니다. quantity=" + quantity);
        }
        return new Money(this.amount * quantity);
    }

    public boolean isZero() {
        return amount == 0L;
    }

    public boolean isLessThan(Money other) {
        return this.amount < other.amount;
    }

    public boolean isGreaterThan(Money other) {
        return this.amount > other.amount;
    }

    @Override
    public int compareTo(Money other) {
        return Long.compare(this.amount, other.amount);
    }

    private static long roundToTen(long amount) {
        return BigDecimal.valueOf(amount)
            .setScale(-1, RoundingMode.HALF_UP)
            .longValueExact();
    }
}
