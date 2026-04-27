package com.deepblog.minicoupang.domain.order.support;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;

public final class OrderMockFixtures {

    private OrderMockFixtures() {
    }

    public static Member member(Long id) {
        Member member = mock(Member.class);
        given(member.getId()).willReturn(id);
        return member;
    }

    public static Product product(Long id, String name, Long basePrice) {
        Product product = mock(Product.class);
        given(product.getId()).willReturn(id);
        given(product.getName()).willReturn(name);
        given(product.getBasePrice()).willReturn(basePrice);
        return product;
    }

    public static ProductOption option(
        Long id,
        Product product,
        String sku,
        String optionName,
        Long additionalPrice
    ) {
        ProductOption option = mock(ProductOption.class);
        given(option.getId()).willReturn(id);
        given(option.getProduct()).willReturn(product);
        given(option.getSku()).willReturn(sku);
        given(option.getOptionName()).willReturn(optionName);
        given(option.getAdditionalPrice()).willReturn(additionalPrice);
        return option;
    }
}
