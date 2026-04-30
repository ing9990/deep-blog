package com.deepblog.minicoupang.domain.order.application.v1_deprecated;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.locks.ReentrantLock;

// Unit 2 §2 (블로그 자산): 옵션 SKU 단위 ReentrantLock + @Transactional.
// 락 풀을 ConcurrentHashMap<optionId, ReentrantLock> 으로 두어 서로 다른 옵션은
// 병렬로 처리되고 같은 옵션의 동시 주문만 직렬화한다. 단일 인스턴스에서는
// 옵션 ID 별로 락이 분기되므로 같은 옵션 행에 대한 경합이 사라지고
// lost update 가 0 건이 된다. 분산 환경 (JVM 2개 이상) 에서는 각 인스턴스가
// 자기 락 풀만 가지므로 무력화된다.
@Service
@Deprecated
public class OrderServiceSynchronized {

    private final MemberRepository memberRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OptionStockRepository optionStockRepository;
    private final OrderRepository orderRepository;
    private final ConcurrentMap<Long, ReentrantLock> locks = new ConcurrentHashMap<>();

    public OrderServiceSynchronized(
        MemberRepository memberRepository,
        ProductOptionRepository productOptionRepository,
        OptionStockRepository optionStockRepository,
        OrderRepository orderRepository
    ) {
        this.memberRepository = memberRepository;
        this.productOptionRepository = productOptionRepository;
        this.optionStockRepository = optionStockRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public PlaceOrderResult placeOrder(Long accountId, PlaceOrderCommand command) {
        ReentrantLock lock = locks.computeIfAbsent(
            command.optionId(), key -> new ReentrantLock());
        lock.lock();
        try {
            return doPlaceOrder(accountId, command);
        } finally {
            lock.unlock();
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
