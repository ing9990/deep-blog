package com.deepblog.product.catalog.entity;

import com.deepblog.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
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
@Table(name = "catalog_stores")
public class CatalogStore extends BaseTimeEntity {

    @Id
    private Long id;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 80, unique = true)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "logo_image_url", length = 500)
    private String logoImageUrl;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CatalogStoreStatus status;

    @Column(name = "product_count", nullable = false)
    private int productCount;

    @Column(name = "popularity_score", nullable = false)
    private double popularityScore;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    public boolean isVisible() {
        return status.isVisible();
    }
}
