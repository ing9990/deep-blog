package com.deepblog.integration.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.integration.support.IntegrationTest;
import com.deepblog.integration.support.OrderScenario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("주문 동시 처리")
class PlaceOrderTest extends IntegrationTest {

    @Test
    @DisplayName("재고 100, 50명 주문 → 주문 50건 성공, 재고 50")
    void place50_50Success_stock50() throws Exception {
        // given
        OrderScenario.Prepared prepared = scenario.prepare(50);

        // when
        OrderResult result = fireConcurrent(prepared, 50);

        // then
        assertThat(result.finished()).as("모든 요청이 120초 내 완료").isTrue();
        assertThat(result.other())
            .as("기대 분류 외 예외 - 분포: %s", result.otherTypes())
            .isZero();
        assertThat(result.success()).as("성공 주문 수").isEqualTo(50);
        assertThat(result.insufficient()).as("재고 부족").isZero();
        assertThat(result.paymentFailed()).as("결제 실패").isZero();

        assertThat(scenario.redisStock(prepared.optionId())).as("Redis 재고").isEqualTo(50L);
        awaitMysqlOptionStock(prepared.optionId(), 50L);
        assertThat(scenario.ordersCount()).as("주문 행 수").isEqualTo(50L);
    }

    @Test
    @DisplayName("재고 100, 100명 주문 → 주문 100건 성공, 재고 0")
    void place100_100Success_stock0() throws Exception {
        // given
        OrderScenario.Prepared prepared = scenario.prepare(100);

        // when
        OrderResult result = fireConcurrent(prepared, 100);

        // then
        assertThat(result.finished()).as("모든 요청이 120초 내 완료").isTrue();
        assertThat(result.other())
            .as("기대 분류 외 예외 - 분포: %s", result.otherTypes())
            .isZero();
        assertThat(result.success()).as("성공 주문 수").isEqualTo(100);
        assertThat(result.insufficient()).as("재고 부족").isZero();
        assertThat(result.paymentFailed()).as("결제 실패").isZero();

        assertThat(scenario.redisStock(prepared.optionId())).as("Redis 재고").isEqualTo(0L);
        awaitMysqlOptionStock(prepared.optionId(), 0L);
        assertThat(scenario.ordersCount()).as("주문 행 수").isEqualTo(100L);
    }

    @Nested
    @DisplayName("동시성 검증")
    class Concurrency {

        @Test
        @DisplayName("재고 100, 101명 주문 → 100건 성공 + 1건 재고 부족, 재고 0")
        void place101_100Success_1Insufficient_stock0() throws Exception {
            // given
            OrderScenario.Prepared prepared = scenario.prepare(101);

            // when
            OrderResult result = fireConcurrent(prepared, 101);

            // then
            assertThat(result.finished()).as("모든 요청이 120초 내 완료").isTrue();
            assertThat(result.other())
            .as("기대 분류 외 예외 - 분포: %s", result.otherTypes())
            .isZero();
            assertThat(result.success()).as("성공 주문 수").isEqualTo(100);
            assertThat(result.insufficient()).as("재고 부족 1건").isEqualTo(1);
            assertThat(result.paymentFailed()).as("결제 실패").isZero();

            assertThat(scenario.redisStock(prepared.optionId())).as("Redis 재고").isEqualTo(0L);
            awaitMysqlOptionStock(prepared.optionId(), 0L);
            assertThat(scenario.ordersCount()).as("주문 행 수").isEqualTo(100L);
        }
    }
}
