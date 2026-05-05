package com.deepblog.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.deepblog.common.event.BaseEvent;
import com.deepblog.common.event.EventTopic;
import com.deepblog.common.id.TsidGenerator;
import com.deepblog.common.money.Money;
import com.deepblog.payment.application.command.PaymentConfirmCommand;
import com.deepblog.payment.application.event.PaymentCompletedEvent;
import com.deepblog.payment.application.port.out.PgClient;
import com.deepblog.payment.application.port.out.dto.PgConfirmRequest;
import com.deepblog.payment.application.port.out.dto.PgConfirmResult;
import com.deepblog.payment.application.result.PaymentConfirmResult;
import com.deepblog.payment.domain.Payment;
import com.deepblog.payment.outbox.OutboxEventStore;
import com.deepblog.payment.repository.PaymentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentConfirmService")
class PaymentConfirmServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OutboxEventStore outboxEventStore;

    @Mock
    private PgClient pgClient;

    @Mock
    private TsidGenerator tsidGenerator;

    @InjectMocks
    private PaymentConfirmService paymentConfirmService;

    @Nested
    @DisplayName("confirm")
    class Confirm {

        @Test
        @DisplayName("simulateFailure=true 면 PG 호출 없이 SIMULATED_FAILURE 를 반환한다")
        void simulateFailureShortCircuits() {
            // given
            PaymentConfirmCommand command = new PaymentConfirmCommand(
                "pk-1", "order-1", 1500L, true);

            // when
            PaymentConfirmResult result = paymentConfirmService.confirm(command);

            // then
            assertThat(result.paid()).isFalse();
            assertThat(result.reason()).isEqualTo("SIMULATED_FAILURE");
            assertThat(result.paymentId()).isNull();
            then(pgClient).should(never()).confirm(any());
            then(paymentRepository).should(never()).save(any());
            then(outboxEventStore).should(never()).save(any(), any(), any());
        }

        @Test
        @DisplayName("PG 가 거절하면 reason 을 그대로 실어 실패를 반환하고 저장/발행은 일어나지 않는다")
        void pgDeclineReturnsFailure() {
            // given
            PaymentConfirmCommand command = new PaymentConfirmCommand(
                "pk-1", "order-1", 1500L, false);
            given(pgClient.confirm(any(PgConfirmRequest.class)))
                .willReturn(PgConfirmResult.declined("CARD_DECLINED"));

            // when
            PaymentConfirmResult result = paymentConfirmService.confirm(command);

            // then
            assertThat(result.paid()).isFalse();
            assertThat(result.reason()).isEqualTo("CARD_DECLINED");
            assertThat(result.paymentId()).isNull();
            then(paymentRepository).should(never()).save(any());
            then(outboxEventStore).should(never()).save(any(), any(), any());
        }

        @Test
        @DisplayName("PG 승인되면 Payment 를 저장하고 PAYMENT_COMPLETED 를 outbox 로 발행한다")
        void pgApprovedSavesAndPublishes() {
            // given
            PaymentConfirmCommand command = new PaymentConfirmCommand(
                "pk-1", "order-42", 1520L, false);
            given(pgClient.confirm(any(PgConfirmRequest.class)))
                .willReturn(PgConfirmResult.approved("TOSS-PG-ABC"));
            given(tsidGenerator.nextString()).willReturn("01J0AAAA");

            // when
            PaymentConfirmResult result = paymentConfirmService.confirm(command);

            // then
            assertThat(result.paid()).isTrue();
            assertThat(result.paymentId()).isEqualTo("PAY-01J0AAAA");
            assertThat(result.reason()).isNull();
        }

        @Test
        @DisplayName("승인된 Payment 엔티티는 paymentKey/orderRef/amount 가 그대로 저장된다")
        void persistedPaymentCarriesCommandFields() {
            // given
            PaymentConfirmCommand command = new PaymentConfirmCommand(
                "pk-7", "order-99", 1525L, false);
            given(pgClient.confirm(any(PgConfirmRequest.class)))
                .willReturn(PgConfirmResult.approved("TOSS-PG-XYZ"));
            given(tsidGenerator.nextString()).willReturn("01J0BBBB");

            // when
            paymentConfirmService.confirm(command);

            // then
            ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
            then(paymentRepository).should().save(paymentCaptor.capture());

            Payment saved = paymentCaptor.getValue();
            assertThat(saved.getPaymentId()).isEqualTo("PAY-01J0BBBB");
            assertThat(saved.getPaymentKey()).isEqualTo("pk-7");
            assertThat(saved.getOrderRef()).isEqualTo("order-99");
            // 1525 → Money 생성 시 10원 단위 HALF_UP 로 1530 으로 정규화된다
            assertThat(saved.getAmount()).isEqualTo(Money.of(1530L));
        }

        @Test
        @DisplayName("승인 후 outbox 메시지는 PAYMENT_COMPLETED 토픽에 orderRef 를 메시지 키로 발행된다")
        void outboxMessageRoutingIsCorrect() {
            // given
            PaymentConfirmCommand command = new PaymentConfirmCommand(
                "pk-1", "order-42", 1520L, false);
            given(pgClient.confirm(any(PgConfirmRequest.class)))
                .willReturn(PgConfirmResult.approved("TOSS-PG-ABC"));
            given(tsidGenerator.nextString()).willReturn("01J0CCCC");

            // when
            paymentConfirmService.confirm(command);

            // then
            ArgumentCaptor<BaseEvent<?>> eventCaptor = ArgumentCaptor.forClass(BaseEvent.class);
            then(outboxEventStore).should().save(
                eq(EventTopic.PAYMENT_COMPLETED.getName()),
                eq("order-42"),
                eventCaptor.capture()
            );

            BaseEvent<?> event = eventCaptor.getValue();
            assertThat(event).isInstanceOf(PaymentCompletedEvent.class);
            PaymentCompletedEvent.Payload payload =
                (PaymentCompletedEvent.Payload) event.getPayload();
            assertThat(payload.paymentId()).isEqualTo("PAY-01J0CCCC");
            assertThat(payload.orderRef()).isEqualTo("order-42");
            assertThat(payload.amount()).isEqualTo(1520L);
        }
    }
}
