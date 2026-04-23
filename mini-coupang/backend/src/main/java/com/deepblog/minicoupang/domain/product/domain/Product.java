package com.deepblog.minicoupang.domain.product.domain;

import static jakarta.persistence.EnumType.STRING;
import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PRIVATE;
import static lombok.AccessLevel.PROTECTED;

import com.deepblog.minicoupang.domain.common.BaseEntity;
import com.deepblog.minicoupang.domain.product.exception.InvalidProductException;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

    @ManyToOne(fetch = LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

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

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductOption> options = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    public static Product create(
        Seller seller,
        Long categoryId,
        String name,
        String description,
        Long basePrice
    ) {
        validateSeller(seller);
        validateCategoryId(categoryId);
        validateName(name);
        validateBasePrice(basePrice);

        return Product.builder()
            .seller(seller)
            .categoryId(categoryId)
            .name(name)
            .description(description)
            .basePrice(basePrice)
            .status(ProductStatus.ACTIVE)
            .build();
    }

    private static void validateSeller(Seller seller) {
        if (seller == null) {
            throw new InvalidProductException("판매자 정보가 올바르지 않습니다.");
        }
    }

    private static void validateCategoryId(Long categoryId) {
        if (categoryId == null || categoryId <= 0) {
            throw new InvalidProductException("카테고리 정보가 올바르지 않습니다.");
        }
    }

    private static void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidProductException("상품명은 비어 있을 수 없습니다.");
        }
        if (name.length() < 2 || name.length() > 200) {
            throw new InvalidProductException("상품명은 2자 이상 200자 이하여야 합니다.");
        }
    }

    private static void validateBasePrice(Long basePrice) {
        if (basePrice == null) {
            throw new InvalidProductException("가격 정보가 필요합니다.");
        }
        if (basePrice < 0) {
            throw new InvalidProductException("가격은 0 이상이어야 합니다.");
        }
    }

    public void suspend() {
        if (this.status != ProductStatus.ACTIVE) {
            throw new InvalidProductException("판매 중인 상품만 정지할 수 있습니다.");
        }
        this.status = ProductStatus.SUSPENDED;
    }

    public void resume() {
        if (this.status != ProductStatus.SUSPENDED) {
            throw new InvalidProductException("정지된 상품만 판매를 재개할 수 있습니다.");
        }
        this.status = ProductStatus.ACTIVE;
    }

    public void markSoldOut() {
        if (this.status != ProductStatus.ACTIVE) {
            throw new InvalidProductException("판매 중인 상품만 품절 처리할 수 있습니다.");
        }
        this.status = ProductStatus.SOLD_OUT;
    }

    public ProductOption addOption(String optionName, String sku, Long additionalPrice) {
        assertSkuNotDuplicated(sku);
        ProductOption option = ProductOption.forProduct(this, optionName, sku, additionalPrice);
        this.options.add(option);
        return option;
    }

    private void assertSkuNotDuplicated(String sku) {
        if (sku == null) {
            return;
        }
        this.options.stream()
            .filter(existing -> sku.equals(existing.getSku()))
            .findAny()
            .ifPresent(existing -> {
                throw new InvalidProductException("이미 등록된 SKU입니다: " + sku);
            });
    }

    public ProductImage addImage(String url, boolean isPrimary) {
        if (isPrimary) {
            assertNoExistingPrimaryImage();
        }
        int nextOrdering = this.images.size();
        ProductImage image = ProductImage.forProduct(this, url, nextOrdering, isPrimary);
        this.images.add(image);
        return image;
    }

    private void assertNoExistingPrimaryImage() {
        this.images.stream()
            .filter(ProductImage::isPrimary)
            .findAny()
            .ifPresent(existing -> {
                throw new InvalidProductException("대표 이미지는 하나만 등록할 수 있습니다.");
            });
    }
}
