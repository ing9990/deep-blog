package com.deepblog.integration.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.integration.support.IntegrationTest;
import com.deepblog.integration.support.OrderScenario;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

@DisplayName("재고 100 · 동시 주문 100명")
class Stock100Order100ConcurrentTest extends IntegrationTest {

    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    @DisplayName("100명이 모두 정상 결제하면")
    class WhenAllSucceed {

        private OrderScenario.Prepared prepared;
        private OrderResult result;

        @BeforeAll
        void runScenario() throws Exception {
            prepared = scenario.prepare(100);
            result = fireConcurrent(prepared, 100);
            awaitMysqlOptionStock(prepared.optionId(), 0L);
        }

        @Test
        @DisplayName("모든 요청이 시간 내 완료된다")
        void allFinished() {
            assertThat(result.finished()).isTrue();
            assertThat(result.other())
                .as("기타 오류 분포: %s", result.otherTypes()).isZero();
        }

        @Test
        @DisplayName("응답 100건이 모두 성공으로 분류된다")
        void allSucceed() {
            assertThat(result.success()).isEqualTo(100);
            assertThat(result.insufficient()).isZero();
            assertThat(result.paymentFailed()).isZero();
        }

        @Test
        @DisplayName("Redis 재고가 0으로 소진된다")
        void redisStockExhausted() {
            assertThat(scenario.redisStock(prepared.optionId())).isZero();
        }

        @Test
        @DisplayName("MySQL 재고가 0으로 소진된다")
        void mysqlStockExhausted() {
            assertThat(scenario.mysqlOptionStock(prepared.optionId())).isZero();
        }

        @Test
        @DisplayName("PAID 주문 행이 100건이다")
        void paidOrderRows() {
            assertThat(scenario.ordersCountByStatus("PAID")).isEqualTo(100L);
        }
    }

    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    @DisplayName("100명이 모두 결제에 실패하면")
    class WhenAllPaymentFails {

        private OrderScenario.Prepared prepared;
        private OrderResult result;

        @BeforeAll
        void runScenario() throws Exception {
            prepared = scenario.prepare(100);
            result = fireConcurrent(prepared, 100, true);
            awaitRedisStock(prepared.optionId(), 100L);
        }

        @Test
        @DisplayName("모든 요청이 시간 내 완료된다")
        void allFinished() {
            assertThat(result.finished()).isTrue();
            assertThat(result.other())
                .as("기타 오류 분포: %s", result.otherTypes()).isZero();
        }

        @Test
        @DisplayName("응답 100건이 모두 결제 실패로 분류된다")
        void allClassifiedAsPaymentFailed() {
            assertThat(result.paymentFailed()).isEqualTo(100);
            assertThat(result.success()).isZero();
            assertThat(result.insufficient()).isZero();
        }

        @Test
        @DisplayName("Redis 재고가 100으로 환원된다")
        void redisStockRestored() {
            assertThat(scenario.redisStock(prepared.optionId())).isEqualTo(100L);
        }

        @Test
        @DisplayName("MySQL 재고는 100을 유지한다 (PAID 시에만 차감)")
        void mysqlStockUntouched() {
            assertThat(scenario.mysqlOptionStock(prepared.optionId())).isEqualTo(100L);
        }

        @Test
        @DisplayName("PAID 주문 행이 0건이다")
        void noPaidOrders() {
            assertThat(scenario.ordersCountByStatus("PAID")).isZero();
        }

        @Test
        @DisplayName("CANCELED 주문 행이 100건이다")
        void canceledOrderRows() {
            assertThat(scenario.ordersCountByStatus("CANCELED")).isEqualTo(100L);
        }
    }
}
