package com.deepblog.integration.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.integration.support.IntegrationTest;
import com.deepblog.integration.support.OrderScenario;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

@DisplayName("재고 100 · 동시 주문 50명")
class Stock100Order50ConcurrentTest extends IntegrationTest {

    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    @DisplayName("50명이 모두 정상 결제하면")
    class WhenAllSucceed {

        private OrderScenario.Prepared prepared;
        private OrderResult result;

        @BeforeAll
        void runScenario() throws Exception {
            prepared = scenario.prepare(50);
            result = fireConcurrent(prepared, 50);
            awaitMysqlOptionStock(prepared.optionId(), 50L);
        }

        @Test
        @DisplayName("모든 요청이 시간 내 완료된다")
        void allFinished() {
            assertThat(result.finished()).isTrue();
            assertThat(result.other())
                .as("기타 오류 분포: %s", result.otherTypes()).isZero();
        }

        @Test
        @DisplayName("응답 50건이 모두 성공으로 분류된다")
        void allSucceed() {
            assertThat(result.success()).isEqualTo(50);
            assertThat(result.insufficient()).isZero();
            assertThat(result.paymentFailed()).isZero();
        }

        @Test
        @DisplayName("Redis 재고가 50으로 감소한다")
        void redisStockDecreased() {
            assertThat(scenario.redisStock(prepared.optionId())).isEqualTo(50L);
        }

        @Test
        @DisplayName("MySQL 재고가 50으로 감소한다")
        void mysqlStockDecreased() {
            assertThat(scenario.mysqlOptionStock(prepared.optionId())).isEqualTo(50L);
        }

        @Test
        @DisplayName("PAID 주문 행이 50건이다")
        void paidOrderRows() {
            assertThat(scenario.ordersCountByStatus("PAID")).isEqualTo(50L);
        }
    }
}
