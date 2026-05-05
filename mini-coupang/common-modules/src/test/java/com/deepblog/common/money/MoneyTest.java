package com.deepblog.common.money;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("Money 값 객체")
class MoneyTest {

    @Nested
    @DisplayName("of(long) 생성")
    class Creation {

        @ParameterizedTest(name = "{0}원 → {1}원")
        @CsvSource({
            "1999, 2000",
            "1521, 1520",
            "1525, 1530",
            "1524, 1520",
            "1995, 2000",
            "1994, 1990",
            "5,    10",
            "4,    0",
            "0,    0",
            "10,   10",
            "1000, 1000"
        })
        @DisplayName("한자릿수 단위가 있으면 10원 단위로 HALF_UP 반올림한다")
        void roundsToNearestTen(long input, long expected) {
            // when
            Money money = Money.of(input);

            // then
            assertThat(money).isEqualTo(Money.of(expected));
        }

        @Test
        @DisplayName("정확히 10원 단위면 그대로 보존한다")
        void preservesAlignedAmount() {
            // when
            Money money = Money.of(1520L);

            // then
            assertThat(money.amount()).isEqualByComparingTo(BigDecimal.valueOf(1520));
        }

        @ParameterizedTest
        @ValueSource(longs = {-1L, -10L, -1999L})
        @DisplayName("음수 금액이면 IllegalArgumentException 을 던진다")
        void rejectsNegative(long negative) {
            // expect
            assertThatThrownBy(() -> Money.of(negative))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("금액은 0 이상");
        }

        @Test
        @DisplayName("null 금액이면 IllegalArgumentException 을 던진다")
        void rejectsNull() {
            // expect
            assertThatThrownBy(() -> new Money(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("null");
        }

        @Test
        @DisplayName("ZERO 상수는 0원이다")
        void zeroConstantIsZero() {
            // expect
            assertThat(Money.ZERO.isZero()).isTrue();
            assertThat(Money.ZERO).isEqualTo(Money.of(0L));
        }
    }

    @Nested
    @DisplayName("add(Money)")
    class Add {

        @Test
        @DisplayName("두 금액을 더한다")
        void addsTwoAmounts() {
            // given
            Money a = Money.of(1500L);
            Money b = Money.of(2000L);

            // when
            Money sum = a.add(b);

            // then
            assertThat(sum).isEqualTo(Money.of(3500L));
        }

        @Test
        @DisplayName("0원을 더하면 자기 자신과 같다")
        void addingZeroIsIdentity() {
            // given
            Money money = Money.of(1520L);

            // expect
            assertThat(money.add(Money.ZERO)).isEqualTo(money);
        }
    }

    @Nested
    @DisplayName("subtract(Money)")
    class Subtract {

        @Test
        @DisplayName("두 금액을 뺀다")
        void subtractsTwoAmounts() {
            // given
            Money a = Money.of(3000L);
            Money b = Money.of(1000L);

            // when
            Money diff = a.subtract(b);

            // then
            assertThat(diff).isEqualTo(Money.of(2000L));
        }

        @Test
        @DisplayName("결과가 음수가 되면 IllegalArgumentException 을 던진다")
        void rejectsNegativeResult() {
            // given
            Money small = Money.of(500L);
            Money large = Money.of(1500L);

            // expect
            assertThatThrownBy(() -> small.subtract(large))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("multiply(long)")
    class Multiply {

        @Test
        @DisplayName("long 배수를 곱한다")
        void multipliesByLong() {
            // given
            Money unit = Money.of(1500L);

            // when
            Money total = unit.multiply(3L);

            // then
            assertThat(total).isEqualTo(Money.of(4500L));
        }

        @Test
        @DisplayName("0배는 0원이 된다")
        void multiplyByZeroIsZero() {
            // expect
            assertThat(Money.of(1500L).multiply(0L)).isEqualTo(Money.ZERO);
        }

        @Test
        @DisplayName("음수 배수는 IllegalArgumentException 을 던진다")
        void rejectsNegativeQuantity() {
            // expect
            assertThatThrownBy(() -> Money.of(1000L).multiply(-1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("배수는 0 이상");
        }
    }

    @Nested
    @DisplayName("비교 연산")
    class Comparison {

        @Test
        @DisplayName("compareTo 는 amount 기준으로 정렬된다")
        void compareToOrdersByAmount() {
            // given
            Money small = Money.of(1000L);
            Money large = Money.of(2000L);

            // expect
            assertThat(small).isLessThan(large);
            assertThat(large).isGreaterThan(small);
            assertThat(small.compareTo(small)).isZero();
        }

        @Test
        @DisplayName("isLessThan / isGreaterThan 은 amount 비교 결과를 반환한다")
        void isLessAndGreaterThan() {
            // given
            Money small = Money.of(1000L);
            Money large = Money.of(2000L);

            // expect
            assertThat(small.isLessThan(large)).isTrue();
            assertThat(small.isGreaterThan(large)).isFalse();
            assertThat(large.isGreaterThan(small)).isTrue();
            assertThat(large.isLessThan(small)).isFalse();
        }

        @Test
        @DisplayName("isZero 는 0원일 때만 true 를 반환한다")
        void isZeroOnlyForZero() {
            // expect
            assertThat(Money.ZERO.isZero()).isTrue();
            assertThat(Money.of(0L).isZero()).isTrue();
            assertThat(Money.of(10L).isZero()).isFalse();
        }

        @Test
        @DisplayName("toLong 은 long 으로 변환한다 (반올림 결과 기준)")
        void toLongReturnsRoundedValue() {
            // expect
            assertThat(Money.of(1521L).toLong()).isEqualTo(1520L);
            assertThat(Money.of(1999L).toLong()).isEqualTo(2000L);
            assertThat(Money.ZERO.toLong()).isZero();
        }
    }

    @Nested
    @DisplayName("multiply(BigDecimal) 정률")
    class MultiplyRate {

        @Test
        @DisplayName("정률 곱셈 결과는 10원 단위로 자동 반올림된다")
        void roundsAfterRateMultiply() {
            // 1500 * 0.1 = 150 → 150 (정렬됨)
            assertThat(Money.of(1500L).multiply(new BigDecimal("0.1")))
                .isEqualTo(Money.of(150L));
            // 생성 시 1525 → 1530, * 0.5 = 765, HALF_UP scale -1 (760 vs 770 등거리) → 770
            assertThat(Money.of(1525L).multiply(new BigDecimal("0.5")))
                .isEqualTo(Money.of(770L));
        }

        @Test
        @DisplayName("0 비율은 0원이 된다")
        void zeroRateIsZero() {
            // expect
            assertThat(Money.of(1500L).multiply(BigDecimal.ZERO)).isEqualTo(Money.ZERO);
        }

        @Test
        @DisplayName("1 비율은 자기 자신과 같다 (반올림 정합 범위에서)")
        void oneRateIsIdentity() {
            // given
            Money money = Money.of(1520L);

            // expect
            assertThat(money.multiply(BigDecimal.ONE)).isEqualTo(money);
        }

        @Test
        @DisplayName("음수 비율은 IllegalArgumentException 을 던진다")
        void rejectsNegativeRate() {
            // expect
            assertThatThrownBy(() -> Money.of(1000L).multiply(new BigDecimal("-0.1")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("비율은 0 이상");
        }

        @Test
        @DisplayName("null 비율은 IllegalArgumentException 을 던진다")
        void rejectsNullRate() {
            // expect
            assertThatThrownBy(() -> Money.of(1000L).multiply((BigDecimal) null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("비율은 null");
        }
    }

    @Nested
    @DisplayName("subtractOrZero(Money)")
    class SubtractOrZero {

        @Test
        @DisplayName("할인이 가격 이하면 차감 결과를 반환한다")
        void normalSubtract() {
            // expect
            assertThat(Money.of(3000L).subtractOrZero(Money.of(1000L)))
                .isEqualTo(Money.of(2000L));
        }

        @Test
        @DisplayName("할인이 가격을 초과하면 0원이 된다")
        void clampsToZeroWhenExceeds() {
            // expect
            assertThat(Money.of(500L).subtractOrZero(Money.of(1000L)))
                .isEqualTo(Money.ZERO);
        }

        @Test
        @DisplayName("할인이 가격과 동일하면 0원이 된다")
        void exactMatchIsZero() {
            // expect
            assertThat(Money.of(1000L).subtractOrZero(Money.of(1000L)))
                .isEqualTo(Money.ZERO);
        }
    }

    @Nested
    @DisplayName("min / max")
    class MinMax {

        @Test
        @DisplayName("min 은 더 작은 금액을 반환한다 (캡 적용)")
        void minReturnsSmaller() {
            // given
            Money discount = Money.of(7000L);
            Money cap = Money.of(5000L);

            // expect
            assertThat(Money.min(discount, cap)).isEqualTo(cap);
            assertThat(Money.min(cap, discount)).isEqualTo(cap);
        }

        @Test
        @DisplayName("max 는 더 큰 금액을 반환한다 (하한 적용)")
        void maxReturnsLarger() {
            // expect
            assertThat(Money.max(Money.of(1000L), Money.of(2000L)))
                .isEqualTo(Money.of(2000L));
        }

        @Test
        @DisplayName("같은 금액이면 어느 쪽을 반환해도 동등하다")
        void tieReturnsEqual() {
            // expect
            assertThat(Money.min(Money.of(1000L), Money.of(1000L)))
                .isEqualTo(Money.of(1000L));
            assertThat(Money.max(Money.of(1000L), Money.of(1000L)))
                .isEqualTo(Money.of(1000L));
        }
    }

    @Nested
    @DisplayName("sum(Iterable)")
    class Sum {

        @Test
        @DisplayName("여러 금액을 합산한다")
        void sumsMultiple() {
            // expect
            assertThat(Money.sum(java.util.List.of(
                Money.of(1000L), Money.of(2000L), Money.of(500L))))
                .isEqualTo(Money.of(3500L));
        }

        @Test
        @DisplayName("빈 컬렉션은 0원을 반환한다")
        void emptyIsZero() {
            // expect
            assertThat(Money.sum(java.util.List.of())).isEqualTo(Money.ZERO);
        }

        @Test
        @DisplayName("단일 항목은 그 값을 반환한다")
        void singleReturnsItself() {
            // expect
            assertThat(Money.sum(java.util.List.of(Money.of(1500L))))
                .isEqualTo(Money.of(1500L));
        }
    }

    @Nested
    @DisplayName("동등성 (record equals/hashCode)")
    class Equality {

        @Test
        @DisplayName("같은 금액이면 동등하다")
        void sameAmountEquals() {
            // expect
            assertThat(Money.of(1520L)).isEqualTo(Money.of(1520L));
            assertThat(Money.of(1520L).hashCode()).isEqualTo(Money.of(1520L).hashCode());
        }

        @Test
        @DisplayName("반올림 후 같은 금액이면 동등하다")
        void equalsAfterRounding() {
            // expect
            assertThat(Money.of(1521L)).isEqualTo(Money.of(1524L));
            assertThat(Money.of(1521L)).isEqualTo(Money.of(1520L));
        }
    }
}
