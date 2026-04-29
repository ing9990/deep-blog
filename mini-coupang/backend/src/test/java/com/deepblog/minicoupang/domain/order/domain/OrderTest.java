package com.deepblog.minicoupang.domain.order.domain;

import static com.deepblog.minicoupang.domain.order.support.OrderMockFixtures.member;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Order 도메인")
class OrderTest {

    @Test
    @DisplayName("회원이 유효하면 PENDING 상태와 0 totalAmount 로 주문이 만들어진다")
    void create_validMember_initializesPendingWithZeroTotal() {
        // given
        Member member = member(1L);

        // when
        Order order = Order.create(member);

        // then
        assertThat(order.getMember()).isSameAs(member);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(order.getTotalAmount()).isZero();
        assertThat(order.getItems()).isEmpty();
    }

    @Test
    @DisplayName("회원이 null 이면 INVALID_ORDER 로 거절된다")
    void create_nullMember_throws() {
        // given / when / then
        assertThatThrownBy(() -> Order.create(null))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_ORDER)
            .hasMessageContaining("회원");
    }

    @Test
    @DisplayName("addItem 은 항목을 누적하고 totalAmount 를 합산한다")
    void addItem_valid_appendsAndAccumulatesTotal() {
        // given
        Order order = Order.create(member(1L));

        // when
        OrderItem first = order.addItem(10L, 100L, "SKU-A", "텀블러", "빨강", 5_000L, 2L);
        OrderItem second = order.addItem(11L, 101L, "SKU-B", "텀블러", "파랑", 7_000L, 1L);

        // then
        assertThat(order.getItems()).containsExactly(first, second);
        assertThat(first.getLineAmount()).isEqualTo(10_000L);
        assertThat(second.getLineAmount()).isEqualTo(7_000L);
        assertThat(order.getTotalAmount()).isEqualTo(17_000L);
    }

    @Test
    @DisplayName("수량이 0 이하이면 INVALID_ORDER 로 거절된다")
    void addItem_invalidQuantity_throws() {
        // given
        Order order = Order.create(member(1L));

        // when / then
        assertThatThrownBy(() -> order.addItem(10L, 100L, "SKU", "텀블러", "빨강", 5_000L, 0L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_ORDER)
            .hasMessageContaining("주문 수량");
    }

    @Test
    @DisplayName("상품 ID 가 0 이하이면 INVALID_ORDER 로 거절된다")
    void addItem_invalidProductId_throws() {
        // given
        Order order = Order.create(member(1L));

        // when / then
        assertThatThrownBy(() -> order.addItem(0L, 100L, "SKU", "텀블러", "빨강", 5_000L, 1L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_ORDER)
            .hasMessageContaining("상품");
    }

    @Test
    @DisplayName("SKU 가 공백이면 INVALID_ORDER 로 거절된다")
    void addItem_blankSku_throws() {
        // given
        Order order = Order.create(member(1L));

        // when / then
        assertThatThrownBy(() -> order.addItem(10L, 100L, " ", "텀블러", "빨강", 5_000L, 1L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_ORDER)
            .hasMessageContaining("SKU");
    }

    @Test
    @DisplayName("단가가 음수이면 INVALID_ORDER 로 거절된다")
    void addItem_negativeUnitPrice_throws() {
        // given
        Order order = Order.create(member(1L));

        // when / then
        assertThatThrownBy(() -> order.addItem(10L, 100L, "SKU", "텀블러", "빨강", -1L, 1L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_ORDER)
            .hasMessageContaining("단가");
    }
}
