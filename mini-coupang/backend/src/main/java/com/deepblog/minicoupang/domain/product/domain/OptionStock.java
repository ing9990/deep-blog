package com.deepblog.minicoupang.domain.product.domain;

import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PRIVATE;
import static lombok.AccessLevel.PROTECTED;

import com.deepblog.minicoupang.domain.common.BaseEntity;
import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PRIVATE)
@Builder
@Table(name = "option_stocks")
public class OptionStock extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "option_stock_id")
    private Long id;

    @Column(name = "option_id", nullable = false, unique = true)
    private Long optionId;

    @Column(name = "quantity", nullable = false)
    private Long quantity;

    public static OptionStock forOption(Long optionId, long initialQuantity) {
        validateOptionId(optionId);
        validateInitialQuantity(initialQuantity);
        return OptionStock.builder()
            .optionId(optionId)
            .quantity(initialQuantity)
            .build();
    }

    private static void validateOptionId(Long optionId) {
        if (optionId == null || optionId <= 0L) {
            throw new BusinessException(ErrorCode.INVALID_STOCK, "옵션 식별자가 올바르지 않습니다.");
        }
    }

    private static void validateInitialQuantity(long initialQuantity) {
        if (initialQuantity < 0L) {
            throw new BusinessException(ErrorCode.INVALID_STOCK, "재고 초기값은 0 이상이어야 합니다.");
        }
    }

    public void decrease(long delta) {
        validatePositiveDelta(delta, "차감");
        if (delta > this.quantity) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                "재고가 부족합니다: 보유 " + this.quantity + ", 요청 " + delta);
        }
        this.quantity = this.quantity - delta;
    }

    public void increase(long delta) {
        validatePositiveDelta(delta, "입고");
        this.quantity = this.quantity + delta;
    }

    private static void validatePositiveDelta(long delta, String action) {
        if (delta <= 0L) {
            throw new BusinessException(ErrorCode.INVALID_STOCK, action + " 수량은 1 이상이어야 합니다.");
        }
    }
}
