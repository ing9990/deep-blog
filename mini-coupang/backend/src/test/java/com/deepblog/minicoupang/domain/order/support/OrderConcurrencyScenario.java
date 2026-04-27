package com.deepblog.minicoupang.domain.order.support;

import com.deepblog.minicoupang.domain.auth.domain.Account;
import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.order.domain.Order;
import com.deepblog.minicoupang.domain.order.repository.OrderRepository;
import com.deepblog.minicoupang.domain.product.domain.OptionStock;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import com.deepblog.minicoupang.domain.product.repository.OptionStockRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;

public class OrderConcurrencyScenario {

    private final AccountRepository accountRepository;
    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;
    private final OptionStockRepository optionStockRepository;
    private final MemberRepository memberRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public OrderConcurrencyScenario(
        AccountRepository accountRepository,
        SellerRepository sellerRepository,
        ProductRepository productRepository,
        OptionStockRepository optionStockRepository,
        MemberRepository memberRepository,
        OrderRepository orderRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.accountRepository = accountRepository;
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;
        this.optionStockRepository = optionStockRepository;
        this.memberRepository = memberRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void clearAll() {
        orderRepository.deleteAll();
        optionStockRepository.deleteAll();
        productRepository.deleteAll();
        sellerRepository.deleteAll();
        memberRepository.deleteAll();
        accountRepository.deleteAll();
    }

    public void dumpState(
        String label,
        Prepared prepared,
        int threads,
        long initialStock,
        int success,
        int insufficient,
        int other
    ) {
        Long finalStock = optionStockRepository.findByOptionId(prepared.optionId())
            .map(stock -> stock.getQuantity())
            .orElse(null);
        long ordersSaved = orderRepository.count();
        List<Long> orderIds = orderRepository.findAll().stream()
            .map(Order::getId)
            .toList();
        long expectedTotalAmount = orderRepository.findAll().stream()
            .mapToLong(order -> order.getTotalAmount() == null ? 0L : order.getTotalAmount())
            .sum();

        System.out.println("""

            ============ %s ============
            threads        : %d
            initial stock  : %d
            ----- 결과 -----
            success        : %d
            insufficient   : %d
            other          : %d
            ----- 최종 상태 -----
            final stock    : %s
            orders saved   : %d
            sum amount     : %d
            order ids (%d) : %s
            =====================================
            """.formatted(
                label, threads, initialStock,
                success, insufficient, other,
                String.valueOf(finalStock), ordersSaved, expectedTotalAmount,
                orderIds.size(), orderIds
            ));
    }

    public Prepared prepare(String tag, long initialStock) {
        Account sellerAccount = accountRepository.save(
            Account.create("seller-" + tag + "@test.com", passwordEncoder.encode("password123")));
        Seller seller = sellerRepository.save(Seller.create(
            sellerAccount, tag + " 상점", "1234567890", "대표", "01012345678"));

        Product product = Product.create(seller, 1L, tag + " 상품", tag + " 시나리오", 5_000L);
        product.addOption("기본", tag.toUpperCase() + "-SKU-1", 0L);
        Product saved = productRepository.save(product);
        ProductOption persistedOption = saved.getOptions().iterator().next();
        optionStockRepository.save(OptionStock.forOption(persistedOption.getId(), initialStock));

        Account memberAccount = accountRepository.save(
            Account.create("member-" + tag + "@test.com", passwordEncoder.encode("password123")));
        memberRepository.save(Member.create(memberAccount, tag + "회원", "01099998888", null));

        return new Prepared(persistedOption.getId(), memberAccount.getId());
    }

    public record Prepared(Long optionId, Long memberAccountId) {
    }
}
