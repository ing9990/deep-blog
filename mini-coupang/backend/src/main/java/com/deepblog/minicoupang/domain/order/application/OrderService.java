package com.deepblog.minicoupang.domain.order.application;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.domain.Order;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductOptionRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Unit 2 §C: 비관적 락을 @Modifying UPDATE 한 줄로 압축한다.
// quantity >= :qty 조건이 SET 절과 함께 들어가 조회·검사·차감이 한 SQL 안에서 원자화되고,
// UPDATE 가 잡는 행 X 락이 트랜잭션 커밋까지 유지돼 동시 UPDATE 가 직렬화된다.
// 별도 SELECT ... FOR UPDATE 가 필요 없고 JPA dirty checking 도 거치지 않는다.
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

        int updated = optionStockRepository.decreaseQuantityIfEnough(
            command.optionId(), command.quantity());
        if (updated == 0) {
            // affected=0 은 (a) stock 행 부재 또는 (b) quantity < qty 둘 중 하나.
            // 시드/트리거로 옵션과 stock 행이 1:1 보장되므로, 운영상 의미는 재고 부족이다.
            throw new BusinessException(ErrorCode.INSUFFICIENT_AMOUNT);
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
