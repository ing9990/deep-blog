package com.deepblog.product.catalog.entity;

import com.deepblog.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Table(name = "catalog_products")
public class CatalogProduct extends BaseTimeEntity {

    @Id
    private Long id;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "store_name", nullable = false, length = 100)
    private String storeName;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "category_path", length = 500)
    private String categoryPath;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private long price;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "main_image_url", length = 500)
    private String mainImageUrl;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CatalogProductStatus status;

    public boolean isVisible() {
        return status.isVisible();
    }

    public void applyUpdate(
        Long categoryId,
        String name,
        long price,
        String mainImageUrl,
        CatalogProductStatus status
    ) {
        if (categoryId != null) this.categoryId = categoryId;
        if (name != null) this.name = name;
        this.price = price;
        if (mainImageUrl != null) this.mainImageUrl = mainImageUrl;
        if (status != null) this.status = status;
    }

    public void markDeleted() {
        this.status = CatalogProductStatus.DELETED;
    }
}
