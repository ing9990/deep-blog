package com.deepblog.common.money;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
            assertThat(money.amount()).isEqualTo(expected);
        }

        @Test
        @DisplayName("정확히 10원 단위면 그대로 보존한다")
        void preservesAlignedAmount() {
            // when
            Money money = Money.of(1520L);

            // then
            assertThat(money.amount()).isEqualTo(1520L);
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
        @DisplayName("won(long) 은 of(long) 과 동일하게 동작한다")
        void wonBehavesAsAlias() {
            // expect
            assertThat(Money.won(1521L)).isEqualTo(Money.of(1521L));
        }

        @Test
        @DisplayName("zero() 는 0원을 반환한다")
        void zeroReturnsZero() {
            // expect
            assertThat(Money.zero().amount()).isZero();
            assertThat(Money.zero()).isEqualTo(Money.ZERO);
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
            assertThat(money.add(Money.zero())).isEqualTo(money);
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
            assertThat(Money.of(1500L).multiply(0L)).isEqualTo(Money.zero());
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
            assertThat(Money.zero().isZero()).isTrue();
            assertThat(Money.of(0L).isZero()).isTrue();
            assertThat(Money.of(10L).isZero()).isFalse();
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
