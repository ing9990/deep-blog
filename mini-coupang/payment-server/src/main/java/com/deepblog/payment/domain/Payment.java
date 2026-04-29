package com.deepblog.payment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 성공 처리된 결제 1건의 영속 기록.
 *
 * <p>현재는 성공 케이스만 저장한다. 실패는 호출 측에 즉시 반환하고 행을 남기지 않는다.
 *
 * <ul>
 *   <li>{@code paymentKey} - 토스 SDK 가 발급해 successUrl 로 전달한 결제 키. PG 와의 매칭 키.</li>
 *   <li>{@code paymentId} - 우리 payment-server 가 발급한 자체 결제 식별자 (UUID).</li>
 *   <li>{@code orderRef} - 주문 측 식별자 문자열 (order-server 의 orderId).</li>
 * </ul>
 */
@Entity
@Table(
    name = "payments",
    indexes = @Index(name = "idx_payments_order_ref", columnList = "orderRef")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String paymentId;

    @Column(nullable = false, length = 128)
    private String paymentKey;

    @Column(nullable = false, length = 64)
    private String orderRef;

    @Column(nullable = false)
    private long amount;

    @Column(nullable = false)
    private LocalDateTime chargedAt;

    private Payment(String paymentId, String paymentKey, String orderRef, long amount) {
        this.paymentId = paymentId;
        this.paymentKey = paymentKey;
        this.orderRef = orderRef;
        this.amount = amount;
        this.chargedAt = LocalDateTime.now();
    }

    public static Payment success(String paymentId, String paymentKey, String orderRef, long amount) {
        return new Payment(paymentId, paymentKey, orderRef, amount);
    }
}
