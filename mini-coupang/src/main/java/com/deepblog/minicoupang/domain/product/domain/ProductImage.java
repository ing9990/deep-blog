package com.deepblog.minicoupang.domain.product.domain;

import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PRIVATE;
import static lombok.AccessLevel.PROTECTED;

import com.deepblog.minicoupang.domain.common.BaseEntity;
import com.deepblog.minicoupang.domain.product.exception.InvalidProductException;
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
@Table(name = "product_images")
public class ProductImage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "product_image_id")
    private Long id;

    @ManyToOne(fetch = LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "url", nullable = false, length = 500)
    private String url;

    @Column(name = "ordering", nullable = false)
    private int ordering;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    static ProductImage forProduct(Product product, String url, int ordering, boolean isPrimary) {
        validateUrl(url);

        return ProductImage.builder()
            .product(product)
            .url(url)
            .ordering(ordering)
            .isPrimary(isPrimary)
            .build();
    }

    private static void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new InvalidProductException("이미지 URL은 비어 있을 수 없습니다.");
        }
        if (url.length() > 500) {
            throw new InvalidProductException("이미지 URL은 500자 이하여야 합니다.");
        }
    }
}
