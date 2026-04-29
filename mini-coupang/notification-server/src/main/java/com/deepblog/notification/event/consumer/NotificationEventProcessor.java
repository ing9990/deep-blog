package com.deepblog.notification.event.consumer;

import com.deepblog.notification.domain.NotificationChannel;
import com.deepblog.notification.domain.NotificationLog;
import com.deepblog.notification.domain.ProcessedEvent;
import com.deepblog.notification.event.payload.MemberSignedUpPayload;
import com.deepblog.notification.event.payload.OrderConfirmedPayload;
import com.deepblog.notification.event.payload.OrderPaymentFailedPayload;
import com.deepblog.notification.event.payload.PaymentCompletedPayload;
import com.deepblog.notification.event.payload.SellerSignedUpPayload;
import com.deepblog.notification.repository.NotificationLogRepository;
import com.deepblog.notification.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 토픽별 알림 처리. 각 메서드는 단일 트랜잭션 안에서 다음을 수행한다.
 * <ol>
 *   <li>processed_events 에 INSERT (UNIQUE 제약 → 멱등성 체크).</li>
 *   <li>notification_log INSERT (발송 기록).</li>
 *   <li>실제 발송 = 콘솔 로그 (운영급은 SMS/이메일 어댑터로 교체).</li>
 * </ol>
 *
 * <p>중복 이벤트의 경우 1단계에서 DataIntegrityViolationException 이 발생하고
 * consumer 가 catch 하여 skip 한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationEventProcessor {

    private final ProcessedEventRepository processedEventRepository;
    private final NotificationLogRepository notificationLogRepository;

    @Transactional
    public void notifyMemberSignedUp(long eventId, MemberSignedUpPayload payload) {
        processedEventRepository.save(ProcessedEvent.of(eventId, "MEMBER_SIGNED_UP"));
        String title = "회원가입을 환영합니다";
        String body = "%s 님, mini-coupang 에 오신 것을 환영합니다.".formatted(payload.email());
        record(eventId, "MEMBER_SIGNED_UP", payload.accountId(), title, body);
    }

    @Transactional
    public void notifySellerSignedUp(long eventId, SellerSignedUpPayload payload) {
        processedEventRepository.save(ProcessedEvent.of(eventId, "SELLER_SIGNED_UP"));
        String title = "판매자 가입이 완료되었습니다";
        String body = "%s 님, 판매자 등록이 완료되었습니다.".formatted(payload.email());
        record(eventId, "SELLER_SIGNED_UP", payload.accountId(), title, body);
    }

    @Transactional
    public void notifyOrderConfirmed(long eventId, OrderConfirmedPayload payload) {
        processedEventRepository.save(ProcessedEvent.of(eventId, "ORDER_CONFIRMED"));
        String title = "주문이 접수되었습니다";
        String body = "주문번호 %d, 옵션 %d × %d 수량 (총 %d 원) 결제가 완료되었습니다.".formatted(
            payload.orderId(), payload.optionId(), payload.quantity(), payload.totalAmount());
        record(eventId, "ORDER_CONFIRMED", payload.memberId(), title, body);
    }

    @Transactional
    public void notifyOrderPaymentFailed(long eventId, OrderPaymentFailedPayload payload) {
        processedEventRepository.save(ProcessedEvent.of(eventId, "ORDER_PAYMENT_FAILED"));
        String title = "결제가 실패했습니다";
        String body = "옵션 %d × %d 수량 결제가 실패했습니다 (사유: %s). 재시도해 주세요.".formatted(
            payload.optionId(), payload.quantity(), payload.reason());
        record(eventId, "ORDER_PAYMENT_FAILED", payload.memberId(), title, body);
    }

    @Transactional
    public void notifyPaymentCompleted(long eventId, PaymentCompletedPayload payload) {
        processedEventRepository.save(ProcessedEvent.of(eventId, "PAYMENT_COMPLETED"));
        String title = "결제가 완료되었습니다";
        String body = "결제 %s, 주문 %s, 금액 %d 원이 정상 처리되었습니다.".formatted(
            payload.paymentId(), payload.orderRef(), payload.amount());
        record(eventId, "PAYMENT_COMPLETED", null, title, body);
    }

    private void record(long eventId, String eventType, Long accountId, String title, String body) {
        NotificationLog logEntry = NotificationLog.of(
            eventId, eventType, accountId, NotificationChannel.CONSOLE, title, body);
        notificationLogRepository.save(logEntry);
        log.info("[NOTIFICATION] type={} accountId={} title={} body={}", eventType, accountId, title, body);
    }
}
