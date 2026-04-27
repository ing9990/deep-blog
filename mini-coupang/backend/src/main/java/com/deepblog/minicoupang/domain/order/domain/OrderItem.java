package com.deepblog.minicoupang.domain.order.domain;

import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PRIVATE;
import static lombok.AccessLevel.PROTECTED;

import com.deepblog.minicoupang.domain.common.BaseEntity;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "order_items")
public class OrderItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "order_item_id")
    private Long id;

    @ManyToOne(fetch = LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "option_id", nullable = false)
    private Long optionId;

    @Column(name = "sku", nullable = false, length = 50)
    private String sku;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "option_name", nullable = false, length = 100)
    private String optionName;

    @Column(name = "unit_price", nullable = false)
    private Long unitPrice;

    @Column(name = "quantity", nullable = false)
    private Long quantity;

    @Column(name = "line_amount", nullable = false)
    private Long lineAmount;

    static OrderItem forOrder(
        Order order,
        Long productId,
        Long optionId,
        String sku,
        String productName,
        String optionName,
        Long unitPrice,
        Long quantity
    ) {
        validateOrder(order);
        validateProductId(productId);
        validateOptionId(optionId);
        validateSku(sku);
        validateProductName(productName);
        validateOptionName(optionName);
        validateUnitPrice(unitPrice);
        validateQuantity(quantity);

        long lineAmount = unitPrice * quantity;
        return OrderItem.builder()
            .order(order)
            .productId(productId)
            .optionId(optionId)
            .sku(sku)
            .productName(productName)
            .optionName(optionName)
            .unitPrice(unitPrice)
            .quantity(quantity)
            .lineAmount(lineAmount)
            .build();
    }

    private static void validateOrder(Order order) {
        if (order == null) {
            throw new BusinessException(ErrorCode.INVALID_ORDER,"주문 정보가 올바르지 않습니다.");
        }
    }

    private static void validateProductId(Long productId) {
        if (productId == null || productId <= 0L) {
            throw new BusinessException(ErrorCode.INVALID_ORDER,"상품 식별자가 올바르지 않습니다.");
        }
    }

    private static void validateOptionId(Long optionId) {
        if (optionId == null || optionId <= 0L) {
            throw new BusinessException(ErrorCode.INVALID_ORDER,"옵션 식별자가 올바르지 않습니다.");
        }
    }

    private static void validateSku(String sku) {
        if (sku == null || sku.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_ORDER,"SKU는 비어 있을 수 없습니다.");
        }
    }

    private static void validateProductName(String productName) {
        if (productName == null || productName.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_ORDER,"상품명은 비어 있을 수 없습니다.");
        }
    }

    private static void validateOptionName(String optionName) {
        if (optionName == null || optionName.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_ORDER,"옵션명은 비어 있을 수 없습니다.");
        }
    }

    private static void validateUnitPrice(Long unitPrice) {
        if (unitPrice == null || unitPrice < 0L) {
            throw new BusinessException(ErrorCode.INVALID_ORDER,"단가는 0 이상이어야 합니다.");
        }
    }

    private static void validateQuantity(Long quantity) {
        if (quantity == null || quantity <= 0L) {
            throw new BusinessException(ErrorCode.INVALID_ORDER,"주문 수량은 1 이상이어야 합니다.");
        }
    }
}
