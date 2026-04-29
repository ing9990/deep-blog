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
 * <p>현재는 성공 케이스만 저장한다. 실패는 호출 측에 즉시 반환하고 행을 남기지 않는다 (재시도 시
 * 새 paymentId 가 생성되므로 audit 손실 위험은 적다). 실패도 audit 대상이 되면 status 컬럼을 도입.
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

    @Column(nullable = false, length = 64)
    private String orderRef;

    @Column(nullable = false)
    private long amount;

    @Column(nullable = false)
    private LocalDateTime chargedAt;

    private Payment(String paymentId, String orderRef, long amount) {
        this.paymentId = paymentId;
        this.orderRef = orderRef;
        this.amount = amount;
        this.chargedAt = LocalDateTime.now();
    }

    public static Payment success(String paymentId, String orderRef, long amount) {
        return new Payment(paymentId, orderRef, amount);
    }
}
