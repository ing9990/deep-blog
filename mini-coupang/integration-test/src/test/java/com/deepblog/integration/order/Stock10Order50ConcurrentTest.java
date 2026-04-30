package com.deepblog.integration.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.integration.support.IntegrationTest;
import com.deepblog.integration.support.OrderScenario;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

@DisplayName("재고 10 · 동시 주문 50명")
class Stock10Order50ConcurrentTest extends IntegrationTest {

    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    @DisplayName("50명이 10개를 두고 동시에 시도하면")
    class WhenFiftyRaceForTen {

        private OrderScenario.Prepared prepared;
        private OrderResult result;

        @BeforeAll
        void runScenario() throws Exception {
            prepared = scenario.prepare(50, 10L);
            result = fireConcurrent(prepared, 50);
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
        @DisplayName("정확히 10명이 성공한다")
        void tenSucceed() {
            assertThat(result.success()).isEqualTo(10);
        }

        @Test
        @DisplayName("나머지 40명은 재고 부족으로 거절된다")
        void fortyRejected() {
            assertThat(result.insufficient()).isEqualTo(40);
        }

        @Test
        @DisplayName("결제 실패는 발생하지 않는다")
        void noPaymentFailure() {
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
        @DisplayName("PAID 주문 행이 10건이다")
        void paidOrderRows() {
            assertThat(scenario.ordersCountByStatus("PAID")).isEqualTo(10L);
        }
    }
}
