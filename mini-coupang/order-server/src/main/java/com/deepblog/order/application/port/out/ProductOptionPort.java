package com.deepblog.order.application.port.out;

import com.deepblog.order.application.port.out.dto.OptionSnapshot;

/**
 * 외부 옵션 조회 포트. 어댑터(Feign)가 product-server `/internal/options/{optionId}` 를 호출한다.
 *
 * <p>옵션이 없거나 조회에 실패하면 {@link com.deepblog.common.exception.BusinessException}.
 * 도메인 입장에서 "옵션이 없다"는 사실 자체가 비즈니스 실패이므로 Optional 로 감싸지 않는다.
 */
public interface ProductOptionPort {

    OptionSnapshot findOption(long optionId);
}
