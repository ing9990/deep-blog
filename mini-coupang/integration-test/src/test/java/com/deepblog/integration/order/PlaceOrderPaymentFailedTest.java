package com.deepblog.integration.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.integration.support.HttpSupport;
import com.deepblog.integration.support.IntegrationTest;
import com.deepblog.integration.support.OrderScenario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("결제 실패 보상")
class PlaceOrderPaymentFailedTest extends IntegrationTest {

    @Test
    @DisplayName("재고 100, 1명이 결제 실패 → 보상 이벤트로 재고 100 환원, 주문은 CANCELED 1건")
    void paymentFailed_stockRestored() {
        // given
        OrderScenario.Prepared prepared = scenario.prepare(1);
        String session = prepared.sessionCookies().get(0);

        // when
        HttpSupport.Result res = placeOrder(session, prepared.optionId(), 1L, true);

        // then
        assertThat(res.status()).as("결제 실패는 4xx 응답").isNotEqualTo(200);
        assertThat(errorCode(res.body())).as("오류 코드 PAYMENT_FAILED").isEqualTo("PAYMENT_FAILED");

        awaitRedisStock(prepared.optionId(), 100L);
        assertThat(scenario.ordersCountByStatus("PAID")).as("PAID 주문 행 수").isZero();
        assertThat(scenario.ordersCountByStatus("CANCELED")).as("CANCELED 주문 행 수").isEqualTo(1L);
        assertThat(scenario.mysqlOptionStock(prepared.optionId()))
            .as("MySQL 재고 (PAID 시에만 차감)").isEqualTo(100L);
    }
}
