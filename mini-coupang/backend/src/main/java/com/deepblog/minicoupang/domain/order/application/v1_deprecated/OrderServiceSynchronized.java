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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

// Unit 2 §2 (블로그 자산): synchronized + TransactionTemplate.
// 잠금이 트랜잭션 커밋까지 임계 영역에 포함되도록 잠금 안쪽에서 TransactionTemplate 으로
// 트랜잭션을 직접 열고 닫는다. 단일 인스턴스에서 lost update 0 건이지만,
// 분산 환경(JVM 2개 이상)에서는 각 인스턴스가 자기 모니터만 가지므로 무력화된다.
@Deprecated
public class OrderServiceSynchronized {

    private final MemberRepository memberRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OptionStockRepository optionStockRepository;
    private final OrderRepository orderRepository;
    private final TransactionTemplate transactionTemplate;
    private final Object lock = new Object();

    public OrderServiceSynchronized(
        MemberRepository memberRepository,
        ProductOptionRepository productOptionRepository,
        OptionStockRepository optionStockRepository,
        OrderRepository orderRepository,
        PlatformTransactionManager transactionManager
    ) {
        this.memberRepository = memberRepository;
        this.productOptionRepository = productOptionRepository;
        this.optionStockRepository = optionStockRepository;
        this.orderRepository = orderRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public PlaceOrderResult placeOrder(Long accountId, PlaceOrderCommand command) {
        synchronized (lock) {
            return transactionTemplate.execute(status -> doPlaceOrder(accountId, command));
        }
    }

    private PlaceOrderResult doPlaceOrder(Long accountId, PlaceOrderCommand command) {
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
