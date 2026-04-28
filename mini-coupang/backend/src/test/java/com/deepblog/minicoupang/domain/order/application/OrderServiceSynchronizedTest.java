package com.deepblog.minicoupang.domain.order.application;

import static com.deepblog.minicoupang.domain.order.support.OrderMockFixtures.member;
import static com.deepblog.minicoupang.domain.order.support.OrderMockFixtures.option;
import static com.deepblog.minicoupang.domain.order.support.OrderMockFixtures.product;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.application.v1_deprecated.OrderServiceSynchronized;
import com.deepblog.minicoupang.domain.order.domain.Order;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import com.deepblog.minicoupang.domain.product.domain.OptionStock;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductOptionRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.test.util.ReflectionTestUtils;

@DisplayName("OrderServiceSynchronized 단건 주문")
class OrderServiceSynchronizedTest {

    private MemberRepository memberRepository;
    private ProductOptionRepository productOptionRepository;
    private OptionStockRepository optionStockRepository;
    private OrderRepository orderRepository;
    private OrderServiceSynchronized service;

    @BeforeEach
    void setUp() {
        memberRepository = mock(MemberRepository.class);
        productOptionRepository = mock(ProductOptionRepository.class);
        optionStockRepository = mock(OptionStockRepository.class);
        orderRepository = mock(OrderRepository.class);
        PlatformTransactionManager txManager = mock(PlatformTransactionManager.class);
        given(txManager.getTransaction(any())).willReturn(new SimpleTransactionStatus());
        service = new OrderServiceSynchronized(
            memberRepository, productOptionRepository, optionStockRepository, orderRepository, txManager);

        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> {
            Order persisted = invocation.getArgument(0);
            ReflectionTestUtils.setField(persisted, "id", 7L);
            return persisted;
        });
    }

    @Test
    @DisplayName("유효한 명령이면 주문이 저장되고 재고가 차감된다")
    void placeOrder_valid_savesOrderAndDecreasesStock() {
        // given
        Long accountId = 1L;
        Member member = member(10L);
        Product product = product(100L, "텀블러", 5_000L);
        ProductOption option = option(200L, product, "SKU-A", "빨강", 1_000L);
        OptionStock stock = OptionStock.forOption(200L, 50L);
        given(memberRepository.findByAccountId(accountId)).willReturn(Optional.of(member));
        given(productOptionRepository.findById(200L)).willReturn(Optional.of(option));
        given(optionStockRepository.findByOptionId(200L)).willReturn(Optional.of(stock));
        PlaceOrderCommand command = new PlaceOrderCommand(200L, 3L);

        // when
        PlaceOrderResult result = service.placeOrder(accountId, command);

        // then
        assertThat(result.orderId()).isEqualTo(7L);
        assertThat(result.memberId()).isEqualTo(10L);
        assertThat(result.status()).isEqualTo("PENDING");
        assertThat(result.totalAmount()).isEqualTo(18_000L);
        assertThat(result.item().productId()).isEqualTo(100L);
        assertThat(result.item().optionId()).isEqualTo(200L);
        assertThat(result.item().unitPrice()).isEqualTo(6_000L);
        assertThat(result.item().quantity()).isEqualTo(3L);
        assertThat(result.item().lineAmount()).isEqualTo(18_000L);
        assertThat(stock.getQuantity()).isEqualTo(47L);
    }

    @Test
    @DisplayName("회원이 존재하지 않으면 NOT_A_MEMBER 로 거절된다")
    void placeOrder_memberNotFound_throws() {
        // given
        given(memberRepository.findByAccountId(any())).willReturn(Optional.empty());
        PlaceOrderCommand command = new PlaceOrderCommand(200L, 1L);

        // when / then
        assertThatThrownBy(() -> service.placeOrder(1L, command))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_A_MEMBER);
    }

    @Test
    @DisplayName("옵션이 존재하지 않으면 OPTION_NOT_FOUND 로 거절된다")
    void placeOrder_optionNotFound_throws() {
        // given
        Member member = member(10L);
        given(memberRepository.findByAccountId(any())).willReturn(Optional.of(member));
        given(productOptionRepository.findById(any())).willReturn(Optional.empty());
        PlaceOrderCommand command = new PlaceOrderCommand(200L, 1L);

        // when / then
        assertThatThrownBy(() -> service.placeOrder(1L, command))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OPTION_NOT_FOUND);
    }

    @Test
    @DisplayName("재고 row 가 없으면 STOCK_NOT_FOUND 로 거절된다")
    void placeOrder_stockNotFound_throws() {
        // given
        Member member = member(10L);
        Product product = product(100L, "텀블러", 5_000L);
        ProductOption option = option(200L, product, "SKU-A", "빨강", 0L);
        given(memberRepository.findByAccountId(any())).willReturn(Optional.of(member));
        given(productOptionRepository.findById(200L)).willReturn(Optional.of(option));
        given(optionStockRepository.findByOptionId(200L)).willReturn(Optional.empty());
        PlaceOrderCommand command = new PlaceOrderCommand(200L, 1L);

        // when / then
        assertThatThrownBy(() -> service.placeOrder(1L, command))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.STOCK_NOT_FOUND);
    }

    @Test
    @DisplayName("재고가 요청 수량보다 적으면 INSUFFICIENT_AMOUNT 로 거절된다")
    void placeOrder_insufficientStock_throwsInsufficientAmount() {
        // given
        Member member = member(10L);
        Product product = product(100L, "텀블러", 5_000L);
        ProductOption option = option(200L, product, "SKU-A", "빨강", 0L);
        OptionStock stock = OptionStock.forOption(200L, 1L);
        given(memberRepository.findByAccountId(any())).willReturn(Optional.of(member));
        given(productOptionRepository.findById(200L)).willReturn(Optional.of(option));
        given(optionStockRepository.findByOptionId(200L)).willReturn(Optional.of(stock));
        PlaceOrderCommand command = new PlaceOrderCommand(200L, 5L);

        // when / then
        assertThatThrownBy(() -> service.placeOrder(1L, command))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_AMOUNT);
    }
}
