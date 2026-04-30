package com.deepblog.order.domain;

import static jakarta.persistence.CascadeType.ALL;
import static jakarta.persistence.EnumType.STRING;
import static lombok.AccessLevel.PRIVATE;
import static lombok.AccessLevel.PROTECTED;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Persistable;

/**
 * 주문 집합. PK 는 외부에서 TSID 로 주입되는 64-bit long.
 *
 * <p>{@code @GeneratedValue} 를 제거했기 때문에 Spring Data 가 {@code save()} 시 entity 가
 * 새 것인지 판단 못 해 {@code merge()} 로 빠진다 (불필요한 SELECT). {@link Persistable} 을 구현해
 * 새 인스턴스는 {@link #isNew()} 로 명시적으로 알린다. {@code @PostPersist}/{@code @PostLoad}
 * 가 {@code newEntity} 플래그를 false 로 뒤집는다.
 */
@Entity
@Getter
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PRIVATE)
@Builder
@Table(name = "orders")
public class Order extends BaseEntity implements Persistable<Long> {

    @Id
    @Column(name = "order_id")
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Enumerated(STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status;

    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @OneToMany(mappedBy = "order", cascade = ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Transient
    @Builder.Default
    private boolean newEntity = true;

    public static Order create(Long id, Long memberId) {
        validateId(id);
        validateMemberId(memberId);
        return Order.builder()
            .id(id)
            .memberId(memberId)
            .status(OrderStatus.PENDING)
            .totalAmount(0L)
            .items(new ArrayList<>())
            .newEntity(true)
            .build();
    }

    private static void validateId(Long id) {
        if (id == null) {
            throw new BusinessException(ErrorCode.INVALID_ORDER, "주문 식별자가 없습니다.");
        }
    }

    private static void validateMemberId(Long memberId) {
        if (memberId == null || memberId <= 0L) {
            throw new BusinessException(ErrorCode.INVALID_ORDER, "회원 정보가 올바르지 않습니다.");
        }
    }

    public OrderItem addItem(
        Long productId,
        Long optionId,
        String sku,
        String productName,
        String optionName,
        Long unitPrice,
        Long quantity
    ) {
        OrderItem item = OrderItem.forOrder(
            this, productId, optionId, sku, productName, optionName, unitPrice, quantity);
        this.items.add(item);
        this.totalAmount = this.totalAmount + item.getLineAmount();
        return item;
    }

    public void markPaid() {
        this.status = OrderStatus.PAID;
    }

    public void markCanceled() {
        this.status = OrderStatus.CANCELED;
    }

    @Override
    public boolean isNew() {
        return newEntity;
    }

    @PostPersist
    @PostLoad
    void markNotNew() {
        this.newEntity = false;
    }
}
