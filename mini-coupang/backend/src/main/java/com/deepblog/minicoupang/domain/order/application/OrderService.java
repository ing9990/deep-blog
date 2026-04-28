package com.deepblog.minicoupang.domain.order.application;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.application.event.OrderConfirmed;
import com.deepblog.minicoupang.domain.order.application.port.out.PaymentPort;
import com.deepblog.minicoupang.domain.order.application.port.out.dto.PaymentChargeCommand;
import com.deepblog.minicoupang.domain.order.application.port.out.dto.PaymentChargeOutcome;
import com.deepblog.minicoupang.domain.order.domain.Order;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import com.deepblog.minicoupang.domain.product.repository.ProductOptionRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductStockRedisRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

// Unit 2 §4: Lua 원자 reserveStock + Saga 보상 release.
//
// 흐름 (3단계):
//   Phase 1. (read TX) 회원/옵션/상품 조회 + 가격 계산. JPA LAZY 프록시는 트랜잭션 안에서만 안전하므로
//            모든 도메인 조회는 read-only TX 안에서 끝낸다. 이 TX 가 종료된 뒤 사용하는 값은 primitive/String.
//   Phase 2. Redis Lua reserveStock: GET-검증-DECRBY 한 EVAL → 동시 차감 정합성. 트랜잭션 밖.
//   Phase 3. payment-service charge (~10s, Feign): 트랜잭션 밖.
//   Phase 4. (write TX) 성공 시 Order INSERT + OrderConfirmed publish → AFTER_COMMIT 에서 ProductService 가 MySQL 차감
//            실패 시 releaseStock 호출 → Redis 재고 원복 (Saga 보상)
//
// Phase 3 가 ~10s 라 트랜잭션 밖에 둬야 DB 커넥션을 그동안 잡지 않는다.
// 영속화 구간만 두 번째 트랜잭션으로 묶는다 (read TX 와 write TX 가 분리됨).
@Slf4j
@Service
public class OrderService {

    private final MemberRepository memberRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OrderRepository orderRepository;
    private final ProductStockRedisRepository stockRedisRepository;
    private final PaymentPort paymentPort;
    private final ApplicationEventPublisher eventPublisher;
    private final TransactionTemplate transactionTemplate;

    public OrderService(
        MemberRepository memberRepository,
        ProductOptionRepository productOptionRepository,
        OrderRepository orderRepository,
        ProductStockRedisRepository stockRedisRepository,
        PaymentPort paymentPort,
        ApplicationEventPublisher eventPublisher,
        PlatformTransactionManager transactionManager
    ) {
        this.memberRepository = memberRepository;
        this.productOptionRepository = productOptionRepository;
        this.orderRepository = orderRepository;
        this.stockRedisRepository = stockRedisRepository;
        this.paymentPort = paymentPort;
        this.eventPublisher = eventPublisher;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public PlaceOrderResult placeOrder(Long accountId, PlaceOrderCommand command) {
        // Phase 1: 도메인 조회 + 가격 추출. read TX 안에서 끝내고 primitive/String 만 외부로 가지고 나간다.
        OrderInputs inputs = transactionTemplate.execute(status -> {
            Member member = memberRepository.findByAccountId(accountId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_A_MEMBER));
            ProductOption option = productOptionRepository.findByIdWithProduct(command.optionId())
                .orElseThrow(() -> new BusinessException(ErrorCode.OPTION_NOT_FOUND));
            Product product = option.getProduct();
            return new OrderInputs(
                member.getId(),
                option.getId(),
                option.getSku(),
                option.getOptionName(),
                option.getAdditionalPrice(),
                product.getId(),
                product.getName(),
                product.getBasePrice()
            );
        });

        long unitPrice = inputs.basePrice() + inputs.additionalPrice();
        long totalAmount = unitPrice * command.quantity();

        // Phase 2: Redis Lua 원자 선점.
        long reserved = stockRedisRepository.reserveStock(command.optionId(), command.quantity());
        if (reserved == -1) {
            throw new BusinessException(ErrorCode.STOCK_NOT_FOUND);
        }
        if (reserved == -2) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_AMOUNT);
        }

        String orderRef = UUID.randomUUID().toString();

        // Phase 3: 결제 (외부 호출, ~10s). 트랜잭션 밖.
        PaymentChargeOutcome outcome = paymentPort.charge(
            new PaymentChargeCommand(orderRef, totalAmount, command.simulateFailure())
        );

        if (!outcome.paid()) {
            // Saga 보상: Redis 재고 원복.
            long restored = stockRedisRepository.releaseStock(command.optionId(), command.quantity());
            log.info("payment failed, released stock for optionId={}, restored={}, reason={}",
                command.optionId(), restored, outcome.reason());
            throw new BusinessException(ErrorCode.PAYMENT_FAILED);
        }

        // Phase 4: 주문 영속화 + OrderConfirmed 이벤트 발행 (write TX).
        // AFTER_COMMIT 시점에 OrderConfirmedListener -> ProductService 가 MySQL `option_stock` 을 차감한다.
        return transactionTemplate.execute(status -> persistOrder(inputs, unitPrice, command));
    }

    private PlaceOrderResult persistOrder(OrderInputs inputs, long unitPrice, PlaceOrderCommand command) {
        Member managedMember = memberRepository.findById(inputs.memberId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_A_MEMBER));

        Order order = Order.create(managedMember);
        order.addItem(
            inputs.productId(),
            inputs.optionId(),
            inputs.optionSku(),
            inputs.productName(),
            inputs.optionName(),
            unitPrice,
            command.quantity()
        );

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(
            new OrderConfirmed(saved.getId(), command.optionId(), command.quantity())
        );
        return PlaceOrderResult.from(saved);
    }

    /**
     * Phase 1 read TX 결과. JPA 엔티티가 아닌 primitive/String 만 담아 트랜잭션 밖으로 안전하게 운반한다.
     */
    private record OrderInputs(
        Long memberId,
        Long optionId,
        String optionSku,
        String optionName,
        long additionalPrice,
        Long productId,
        String productName,
        long basePrice
    ) {
    }
}
