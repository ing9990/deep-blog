package com.deepblog.minicoupang.domain.product.domain;

import static jakarta.persistence.FetchType.LAZY;
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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PRIVATE)
@Builder
@Table(name = "product_options")
public class ProductOption extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "product_option_id")
    private Long id;

    @ManyToOne(fetch = LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "option_name", nullable = false, length = 100)
    private String optionName;

    @Column(name = "sku", nullable = false, length = 50, unique = true)
    private String sku;

    @Column(name = "additional_price", nullable = false)
    private Long additionalPrice;

    static ProductOption forProduct(
        Product product,
        String optionName,
        String sku,
        Long additionalPrice
    ) {
        validateOptionName(optionName);
        validateSku(sku);
        validateAdditionalPrice(additionalPrice);

        return ProductOption.builder()
            .product(product)
            .optionName(optionName)
            .sku(sku)
            .additionalPrice(additionalPrice)
            .build();
    }

    private static void validateOptionName(String optionName) {
        if (optionName == null || optionName.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT,"옵션명은 비어 있을 수 없습니다.");
        }
        if (optionName.length() < 2 || optionName.length() > 100) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT,"옵션명은 2자 이상 100자 이하여야 합니다.");
        }
    }

    private static void validateSku(String sku) {
        if (sku == null || sku.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT,"SKU는 비어 있을 수 없습니다.");
        }
        if (sku.length() < 2 || sku.length() > 50) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT,"SKU는 2자 이상 50자 이하여야 합니다.");
        }
    }

    private static void validateAdditionalPrice(Long additionalPrice) {
        if (additionalPrice == null) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT,"추가 가격 정보가 필요합니다.");
        }
        if (additionalPrice < 0) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT,"추가 가격은 0 이상이어야 합니다.");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ProductOption that)) {
            return false;
        }
        return sku != null && sku.equals(that.sku);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(sku);
    }
}
