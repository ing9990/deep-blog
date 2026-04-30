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

@DisplayName("재고 100 · 단건 주문")
class Stock100Order1Test extends IntegrationTest {

    @Nested
    @TestInstance(TestInstance.Lifecycle.PER_CLASS)
    @DisplayName("1명이 결제에 실패하면")
    class WhenSinglePaymentFails {

        private OrderScenario.Prepared prepared;
        private HttpSupport.Result response;

        @BeforeAll
        void runScenario() {
            prepared = scenario.prepare(1);
            response = placeOrder(
                prepared.sessionCookies().get(0), prepared.optionId(), 1L, true);
            awaitRedisStock(prepared.optionId(), 100L);
        }

        @Test
        @DisplayName("응답 상태가 200이 아니다")
        void respondsNon200() {
            assertThat(response.status()).isNotEqualTo(200);
        }

        @Test
        @DisplayName("오류 코드가 PAYMENT_FAILED 이다")
        void errorCodePaymentFailed() {
            assertThat(errorCode(response.body())).isEqualTo("PAYMENT_FAILED");
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
        @DisplayName("CANCELED 주문 행이 1건이다")
        void canceledOrderRows() {
            assertThat(scenario.ordersCountByStatus("CANCELED")).isEqualTo(1L);
        }
    }
}
