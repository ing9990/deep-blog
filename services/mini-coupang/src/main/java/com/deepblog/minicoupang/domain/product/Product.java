package com.deepblog.minicoupang.domain.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Product aggregate root.
 *
 * Seller와 다른 aggregate이므로 sellerId 참조 + sellerName 스냅샷만 보유.
 * 근거: domain-design.md §2-§4.
 *
 * 상태 변경은 도메인 메서드 경유(decreaseStock 등). 직접 필드 접근 X.
 */
@Entity
@Table(
        name = "products",
        indexes = @Index(name = "ix_products_seller_id", columnList = "seller_id")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(toBuilder = true)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long id;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "seller_name", nullable = false, length = 80)
    private String sellerName;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private Long price;

    @Column(nullable = false)
    private Integer stock;

    @Version
    private Long version;

    public static Product create(
            Long sellerId,
            String sellerName,
            String name,
            long price,
            int stock) {
        validatePrice(price);
        validateStock(stock);
        validateName(name);
        validateSellerName(sellerName);
        return Product.builder()
                .sellerId(sellerId)
                .sellerName(sellerName.trim())
                .name(name.trim())
                .price(price)
                .stock(stock)
                .build();
    }

    /**
     * 재고 차감. Phase 2 후반에 동시성 실험 대상이 되는 핵심 메서드.
     */
    public void decreaseStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive: " + quantity);
        }
        if (this.stock < quantity) {
            throw new IllegalStateException(
                    "insufficient stock: have=" + this.stock + ", need=" + quantity);
        }
        this.stock -= quantity;
    }

    public void rename(String newName) {
        validateName(newName);
        this.name = newName.trim();
    }

    private static void validatePrice(long price) {
        if (price < 0) {
            throw new IllegalArgumentException("price must be non-negative: " + price);
        }
    }

    private static void validateStock(int stock) {
        if (stock < 0) {
            throw new IllegalArgumentException("stock must be non-negative: " + stock);
        }
    }

    private static void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
    }

    private static void validateSellerName(String sellerName) {
        if (sellerName == null || sellerName.isBlank()) {
            throw new IllegalArgumentException("sellerName must not be blank");
        }
    }
}
