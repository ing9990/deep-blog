package com.deepblog.minicoupang.domain.order.application.v1_deprecated;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.application.PlaceOrderCommand;
import com.deepblog.minicoupang.domain.order.application.PlaceOrderResult;
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
import org.springframework.transaction.annotation.Transactional;

// Unit 2 §1 baseline (블로그 자산): 동시성 제어 없이 단순 차감.
// 다중 스레드에서 동일 옵션을 동시 주문하면 lost update 가 발생한다.
// §2(synchronized) → §3(비관적 락) → §4(Lua + Saga) 단계 비교를 위한 자산으로 보존.
@Deprecated
@RequiredArgsConstructor
public class OrderServiceNoLock {

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
        OptionStock stock = optionStockRepository.findByOptionId(command.optionId())
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
