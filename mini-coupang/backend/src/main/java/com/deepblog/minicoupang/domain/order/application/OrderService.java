package com.deepblog.minicoupang.domain.order.application;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.domain.Order;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.domain.product.domain.OptionStock;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductOptionRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Unit 2 §C: 비관적 락(SELECT ... FOR UPDATE)으로 재고 차감의 임계 영역을
// DB 행 락에 위임한다. 트랜잭션이 커밋/롤백될 때 락이 해제되므로,
// JVM 인스턴스가 여러 개여도 동일 행을 가리키는 모든 트랜잭션이 직렬화된다.
@Service
@RequiredArgsConstructor
public class OrderService {

    private final MemberRepository memberRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OptionStockRepository optionStockRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public PlaceOrderResult placeOrder(Long accountId, PlaceOrderCommand command) {
        Member member = memberRepository.findByAccountId(accountId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_A_MEMBER));

        ProductOption option = productOptionRepository.findById(command.optionId())
            .orElseThrow(() -> new BusinessException(ErrorCode.OPTION_NOT_FOUND));
        OptionStock stock = optionStockRepository.findByOptionIdForUpdate(command.optionId())
            .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_NOT_FOUND));

        try {
            stock.decrease(command.quantity());
        } catch (BusinessException e) {
            if (e.errorCode() == ErrorCode.INSUFFICIENT_STOCK) {
                throw new BusinessException(ErrorCode.INSUFFICIENT_AMOUNT, e);
            }
            throw e;
        }

        Product product = option.getProduct();
        long unitPrice = product.getBasePrice() + option.getAdditionalPrice();

        Order order = Order.create(member);
        order.addItem(
            product.getId(),
            option.getId(),
            option.getSku(),
            product.getName(),
            option.getOptionName(),
            unitPrice,
            command.quantity()
        );

        Order saved = orderRepository.save(order);
        return PlaceOrderResult.from(saved);
    }
}
