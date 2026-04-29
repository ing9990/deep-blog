package com.deepblog.minicoupang.domain.order.application;

import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import com.deepblog.minicoupang.domain.product.repository.ProductOptionRepository;
import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderQueryService {

    private final MemberRepository memberRepository;
    private final ProductOptionRepository productOptionRepository;

    @Transactional(readOnly = true)
    public OrderInputs loadOrderInputs(Long accountId, Long optionId) {
        Member member = memberRepository.findByAccountId(accountId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_A_MEMBER));
        ProductOption option = productOptionRepository.findByIdWithProduct(optionId)
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
    }
}
