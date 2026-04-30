package com.deepblog.order.client;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.application.port.out.StockReservePort;
import com.deepblog.order.application.port.out.dto.StockReserveOutcome;
import com.deepblog.order.application.port.out.dto.StockReserveRequest;
import com.deepblog.order.client.dto.StockReserveHttpRequest;
import com.deepblog.order.client.dto.StockReserveHttpResponse;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductStockFeignAdapter implements StockReservePort {

    private final ProductStockClient productStockClient;

    @Override
    public StockReserveOutcome reserve(StockReserveRequest request) {
        try {
            CommonResponse<StockReserveHttpResponse> response = productStockClient.reserve(
                request.optionId(),
                new StockReserveHttpRequest(request.quantity())
            );
            StockReserveHttpResponse data = response == null ? null : response.data();
            if (data == null) {
                return StockReserveOutcome.failure(request.optionId(), "EMPTY_RESPONSE");
            }
            return StockReserveOutcome.success(data.optionId(), data.reservedQuantity(), data.remainingStock());
        } catch (FeignException.Conflict e) {
            return StockReserveOutcome.failure(request.optionId(), "INSUFFICIENT_AMOUNT");
        } catch (FeignException.NotFound e) {
            return StockReserveOutcome.failure(request.optionId(), "STOCK_NOT_FOUND");
        } catch (FeignException e) {
            log.warn("stock reserve call failed. optionId={}, status={}, message={}",
                request.optionId(), e.status(), e.getMessage());
            return StockReserveOutcome.failure(request.optionId(), "STOCK_CALL_FAILED");
        }
    }
}
