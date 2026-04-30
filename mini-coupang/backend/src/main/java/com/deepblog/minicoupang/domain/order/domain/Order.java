package com.deepblog.minicoupang.domain.order.domain;

import static jakarta.persistence.CascadeType.ALL;
import static jakarta.persistence.EnumType.STRING;
import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PRIVATE;
import static lombok.AccessLevel.PROTECTED;

import com.deepblog.minicoupang.domain.common.BaseEntity;
import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
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
@Table(name = "orders")
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "order_id")
    private Long id;

    @ManyToOne(fetch = LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status;

    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @OneToMany(mappedBy = "order", cascade = ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    public static Order create(Member member) {
        validateMember(member);
        return Order.builder()
            .member(member)
            .status(OrderStatus.PENDING)
            .totalAmount(0L)
            .items(new ArrayList<>())
            .build();
    }

    private static void validateMember(Member member) {
        if (member == null) {
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
}
