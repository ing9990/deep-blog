package com.deepblog.common.money;

import jakarta.persistence.Embeddable;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Embeddable
public record Money(BigDecimal amount) implements Comparable<Money> {

    public static final Money ZERO = new Money(BigDecimal.ZERO);

    public Money {
        if (amount == null) {
            throw new IllegalArgumentException("금액은 null 이 될 수 없습니다.");
        }
        if (amount.signum() < 0) {
            throw new IllegalArgumentException("금액은 0 이상이어야 합니다. amount=" + amount);
        }
        // 1의 자리 금액은 10원 단위로 HALF_UP 반올림한다 (1999 → 2000, 1521 → 1520).
        amount = amount.setScale(-1, RoundingMode.HALF_UP);
    }

    public static Money of(long won) {
        return new Money(BigDecimal.valueOf(won));
    }

    public Money add(Money other) {
        return new Money(this.amount.add(other.amount));
    }

    public Money subtract(Money other) {
        return new Money(this.amount.subtract(other.amount));
    }

    public Money multiply(long quantity) {
        if (quantity < 0L) {
            throw new IllegalArgumentException("배수는 0 이상이어야 합니다. quantity=" + quantity);
        }
        return new Money(this.amount.multiply(BigDecimal.valueOf(quantity)));
    }

    public Money multiply(BigDecimal rate) {
        if (rate == null) {
            throw new IllegalArgumentException("비율은 null 이 될 수 없습니다.");
        }
        if (rate.signum() < 0) {
            throw new IllegalArgumentException("비율은 0 이상이어야 합니다. rate=" + rate);
        }
        return new Money(this.amount.multiply(rate));
    }

    public Money subtractOrZero(Money other) {
        return this.isLessThan(other) ? ZERO : this.subtract(other);
    }

    public static Money min(Money a, Money b) {
        return a.compareTo(b) <= 0 ? a : b;
    }

    public static Money max(Money a, Money b) {
        return a.compareTo(b) >= 0 ? a : b;
    }

    public static Money sum(Iterable<Money> values) {
        Money total = ZERO;
        for (Money value : values) {
            total = total.add(value);
        }
        return total;
    }

    public long toLong() {
        return amount.longValueExact();
    }

    public boolean isZero() {
        return amount.signum() == 0;
    }

    public boolean isLessThan(Money other) {
        return this.amount.compareTo(other.amount) < 0;
    }

    public boolean isGreaterThan(Money other) {
        return this.amount.compareTo(other.amount) > 0;
    }

    @Override
    public int compareTo(Money other) {
        return this.amount.compareTo(other.amount);
    }
}
