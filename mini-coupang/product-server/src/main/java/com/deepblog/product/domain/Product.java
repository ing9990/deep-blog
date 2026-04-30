package com.deepblog.product.domain;

import static jakarta.persistence.CascadeType.ALL;
import static jakarta.persistence.EnumType.STRING;
import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PRIVATE;
import static lombok.AccessLevel.PROTECTED;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * product 스키마의 상품 집계 루트.
 *
 * <p>판매자 정보는 ID 만 들고 있다 (member-server 가 진짜 출처). 판매자 detail 이 필요하면
 * member-server Feign 으로 조회. 카테고리도 동일하게 ID 만 보관.
 */
@Entity
@Getter
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PRIVATE)
@Builder
@Table(name = "products")
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "product_id")
    private Long id;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_price", nullable = false)
    private Long basePrice;

    @Enumerated(STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProductStatus status;

    @OneToMany(mappedBy = "product", cascade = ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ProductOption> options = new LinkedHashSet<>();

    @OneToMany(mappedBy = "product", cascade = ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    public static Product create(
        Long sellerId,
        Long categoryId,
        String name,
        String description,
        Long basePrice
    ) {
        validateSellerId(sellerId);
        validateCategoryId(categoryId);
        validateName(name);
        validateBasePrice(basePrice);

        return Product.builder()
            .sellerId(sellerId)
            .categoryId(categoryId)
            .name(name)
            .description(description)
            .basePrice(basePrice)
            .status(ProductStatus.ACTIVE)
            .build();
    }

    private static void validateSellerId(Long sellerId) {
        if (sellerId == null || sellerId <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "판매자 정보가 올바르지 않습니다.");
        }
    }

    private static void validateCategoryId(Long categoryId) {
        if (categoryId == null || categoryId <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "카테고리 정보가 올바르지 않습니다.");
        }
    }

    private static void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "상품명은 비어 있을 수 없습니다.");
        }
        if (name.length() < 2 || name.length() > 200) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "상품명은 2자 이상 200자 이하여야 합니다.");
        }
    }

    private static void validateBasePrice(Long basePrice) {
        if (basePrice == null) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "가격 정보가 필요합니다.");
        }
        if (basePrice < 0) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "가격은 0 이상이어야 합니다.");
        }
    }

    public void suspend() {
        if (this.status != ProductStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "판매 중인 상품만 정지할 수 있습니다.");
        }
        this.status = ProductStatus.SUSPENDED;
    }

    public void resume() {
        if (this.status != ProductStatus.SUSPENDED) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "정지된 상품만 판매를 재개할 수 있습니다.");
        }
        this.status = ProductStatus.ACTIVE;
    }

    public void markSoldOut() {
        if (this.status != ProductStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "판매 중인 상품만 품절 처리할 수 있습니다.");
        }
        this.status = ProductStatus.SOLD_OUT;
    }

    public ProductOption addOption(String optionName, String sku, Long additionalPrice) {
        ProductOption option = ProductOption.forProduct(this, optionName, sku, additionalPrice);
        if (!this.options.add(option)) {
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "이미 등록된 SKU입니다: " + sku);
        }
        return option;
    }

    public ProductOption addDefaultOption() {
        String sku = "DEFAULT-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
        return addOption("기본", sku, 0L);
    }

    public void addImage(String url, boolean isPrimary) {
        if (isPrimary) {
            assertNoExistingPrimaryImage();
        }
        int nextOrdering = this.images.size();
        ProductImage image = ProductImage.forProduct(this, url, nextOrdering, isPrimary);
        this.images.add(image);
    }

    private void assertNoExistingPrimaryImage() {
        this.images.stream()
            .filter(ProductImage::isPrimary)
            .findAny()
            .ifPresent(existing -> {
                throw new BusinessException(ErrorCode.INVALID_PRODUCT, "대표 이미지는 하나만 등록할 수 있습니다.");
            });
    }
}
