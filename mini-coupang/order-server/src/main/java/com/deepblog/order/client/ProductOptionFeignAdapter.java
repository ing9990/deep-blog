package com.deepblog.order.client;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.application.port.out.ProductOptionPort;
import com.deepblog.order.application.port.out.dto.OptionSnapshot;
import com.deepblog.order.client.dto.OptionDetailHttpResponse;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductOptionFeignAdapter implements ProductOptionPort {

    private final ProductOptionClient productOptionClient;

    @Override
    public OptionSnapshot findOption(long optionId) {
        try {
            CommonResponse<OptionDetailHttpResponse> response = productOptionClient.getOption(optionId);
            OptionDetailHttpResponse data = response == null ? null : response.data();
            if (data == null) {
                throw new BusinessException(ErrorCode.OPTION_NOT_FOUND);
            }
            return new OptionSnapshot(
                data.productId(),
                data.productName(),
                data.sellerId(),
                data.optionId(),
                data.optionName(),
                data.sku(),
                data.unitPrice(),
                data.productStatus()
            );
        } catch (FeignException.NotFound e) {
            throw new BusinessException(ErrorCode.OPTION_NOT_FOUND);
        } catch (FeignException e) {
            log.warn("option fetch failed. optionId={}, status={}, message={}",
                optionId, e.status(), e.getMessage());
            throw new BusinessException(ErrorCode.INVALID_PRODUCT, "옵션 정보를 가져오지 못했습니다.");
        }
    }
}
