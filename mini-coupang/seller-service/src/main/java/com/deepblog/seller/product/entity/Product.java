package com.deepblog.seller.product.entity;

import com.deepblog.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Table(
    name = "seller_products",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_seller_products_seller_sku",
        columnNames = {"seller_id", "sku"}
    )
)
public class Product extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(nullable = false, length = 64)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private long price;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "main_image_url", length = 500)
    private String mainImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProductStatus status;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static Product register(
        Long sellerId,
        Long storeId,
        Long categoryId,
        String sku,
        String name,
        long price,
        String mainImageUrl
    ) {
        validatePositiveId(sellerId, "sellerId");
        validatePositiveId(storeId, "storeId");
        validatePositiveId(categoryId, "categoryId");
        validateSku(sku);
        validateName(name);
        validatePrice(price);
        validateImageUrl(mainImageUrl);

        return Product.builder()
            .sellerId(sellerId)
            .storeId(storeId)
            .categoryId(categoryId)
            .sku(sku)
            .name(name)
            .price(price)
            .currency("KRW")
            .mainImageUrl(mainImageUrl)
            .status(ProductStatus.ON_SALE)
            .build();
    }

    public void update(
        Long categoryId,
        String name,
        Long price,
        String mainImageUrl
    ) {
        requireMutable();
        if (categoryId != null) {
            validatePositiveId(categoryId, "categoryId");
            this.categoryId = categoryId;
        }
        if (name != null) {
            validateName(name);
            this.name = name;
        }
        if (price != null) {
            validatePrice(price);
            this.price = price;
        }
        if (mainImageUrl != null) {
            validateImageUrl(mainImageUrl);
            this.mainImageUrl = mainImageUrl;
        }
    }

    public void delete() {
        if (status.isDeleted()) {
            return;
        }
        this.status = ProductStatus.DELETED;
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isOwnedBy(Long sellerId) {
        return this.sellerId.equals(sellerId);
    }

    public boolean isDeleted() {
        return status.isDeleted();
    }

    private void requireMutable() {
        if (!status.isMutable()) {
            throw new IllegalStateException("product is not mutable: " + status);
        }
    }

    private static void validatePositiveId(Long id, String field) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("invalid " + field);
        }
    }

    private static void validateSku(String sku) {
        if (!StringUtils.hasText(sku)
            || sku.length() > 64
            || !sku.matches("^[A-Za-z0-9-]+$")) {
            throw new IllegalArgumentException("invalid sku");
        }
    }

    private static void validateName(String name) {
        if (!StringUtils.hasText(name) || name.length() > 200) {
            throw new IllegalArgumentException("invalid product name");
        }
    }

    private static void validatePrice(long price) {
        if (price <= 0) {
            throw new IllegalArgumentException("price must be positive");
        }
    }

    private static void validateImageUrl(String url) {
        if (url != null && url.length() > 500) {
            throw new IllegalArgumentException("invalid image url");
        }
    }
}
