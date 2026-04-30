package com.deepblog.order.application.port.out;

import com.deepblog.order.application.port.out.dto.StockReserveOutcome;
import com.deepblog.order.application.port.out.dto.StockReserveRequest;

/**
 * 외부 재고 선점 포트. 어댑터(Feign)가 product-server 의
 * {@code POST /internal/stocks/{optionId}/reserve} 를 호출한다.
 *
 * <p>도메인은 본 인터페이스에만 의존한다. 전송 계층의 예외(`FeignException`)는 어댑터에서
 * {@link StockReserveOutcome#failure} 로 변환한다.
 */
public interface StockReservePort {

    StockReserveOutcome reserve(StockReserveRequest request);
}
