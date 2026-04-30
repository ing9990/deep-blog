package com.deepblog.product.application;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.product.application.result.OptionDetailResult;
import com.deepblog.product.domain.Product;
import com.deepblog.product.domain.ProductOption;
import com.deepblog.product.repository.ProductOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OptionDetailService {

    private final ProductOptionRepository productOptionRepository;

    @Transactional(readOnly = true)
    public OptionDetailResult getOptionDetail(long optionId) {
        ProductOption option = productOptionRepository.findByIdWithProduct(optionId)
            .orElseThrow(() -> new BusinessException(ErrorCode.OPTION_NOT_FOUND));
        Product product = option.getProduct();
        long unitPrice = product.getBasePrice() + option.getAdditionalPrice();
        return new OptionDetailResult(
            product.getId(),
            product.getName(),
            product.getSellerId(),
            option.getId(),
            option.getOptionName(),
            option.getSku(),
            unitPrice,
            product.getStatus().name()
        );
    }
}
