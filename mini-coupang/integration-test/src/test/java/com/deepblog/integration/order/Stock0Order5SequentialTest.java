package com.deepblog.integration.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.integration.support.HttpSupport;
import com.deepblog.integration.support.IntegrationTest;
import com.deepblog.integration.support.OrderScenario;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

@DisplayName("재고 0 · 순차 주문 5명")
class Stock0Order5SequentialTest extends IntegrationTest {

    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    @DisplayName("재고가 없는 옵션을 5명이 차례로 시도하면")
    class WhenEachTriesInSequence {

        private OrderScenario.Prepared prepared;
        private int unexpectedSuccess;
        private int insufficient;
        private int otherFailure;

        @BeforeAll
        void runScenario() {
            prepared = scenario.prepare(5, 0L);
            for (int i = 0; i < 5; i++) {
                HttpSupport.Result res = placeOrder(
                    prepared.sessionCookies().get(i), prepared.optionId(), 1L, false);
                if (res.status() == 200) {
                    unexpectedSuccess++;
                    continue;
                }
                String code = errorCode(res.body());
                if ("INSUFFICIENT_AMOUNT".equals(code) || "INSUFFICIENT_STOCK".equals(code)) {
                    insufficient++;
                } else {
                    otherFailure++;
                }
            }
        }

        @Test
        @DisplayName("성공 응답이 0건이다")
        void noSuccess() {
            assertThat(unexpectedSuccess).isZero();
        }

        @Test
        @DisplayName("재고 부족 응답이 5건이다")
        void allInsufficient() {
            assertThat(insufficient).isEqualTo(5);
        }

        @Test
        @DisplayName("그 외 오류가 0건이다")
        void noOtherFailure() {
            assertThat(otherFailure).isZero();
        }

        @Test
        @DisplayName("Redis 재고가 0을 유지한다")
        void redisStock0() {
            assertThat(scenario.redisStock(prepared.optionId())).isZero();
        }

        @Test
        @DisplayName("MySQL 재고가 0을 유지한다")
        void mysqlStock0() {
            assertThat(scenario.mysqlOptionStock(prepared.optionId())).isZero();
        }

        @Test
        @DisplayName("PAID 주문 행이 0건이다")
        void noPaidOrders() {
            assertThat(scenario.ordersCountByStatus("PAID")).isZero();
        }
    }
}
