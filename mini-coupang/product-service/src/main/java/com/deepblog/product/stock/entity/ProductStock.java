package com.deepblog.product.stock.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Entity
@Builder
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Table(name = "product_stocks")
public class ProductStock {

    @Id
    @Column(name = "product_id")
    private Long productId;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "reserved_quantity", nullable = false)
    private int reservedQuantity;

    @Column(name = "safety_stock", nullable = false)
    private int safetyStock;

    @Version
    private long version;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static ProductStock empty(Long productId, int safetyStock) {
        return ProductStock.builder()
            .productId(productId)
            .quantity(0)
            .reservedQuantity(0)
            .safetyStock(safetyStock)
            .build();
    }

    public void decrease(int amount) {
        requirePositive(amount);
        int available = availableQuantity();
        if (available < amount) {
            throw new IllegalStateException(
                "insufficient stock: available=" + available + " requested=" + amount
            );
        }
        this.quantity -= amount;
    }

    public void increase(int amount) {
        requirePositive(amount);
        this.quantity += amount;
    }

    public int availableQuantity() {
        return Math.max(0, quantity - reservedQuantity - safetyStock);
    }

    private void requirePositive(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be positive: " + amount);
        }
    }
}
