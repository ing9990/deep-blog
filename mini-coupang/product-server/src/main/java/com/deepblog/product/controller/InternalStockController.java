package com.deepblog.product.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.product.application.StockReserveService;
import com.deepblog.product.application.command.StockReserveCommand;
import com.deepblog.product.application.result.StockReserveResult;
import com.deepblog.product.controller.dto.StockReserveRequest;
import com.deepblog.product.controller.dto.StockReserveResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * order-server 의 결제 시도 직전 단계에서 Feign 으로 호출되는 내부 API.
 *
 * <p>외부 노출 (`/api/...`) 과 분리해 `/internal/...` prefix 를 둔다. 응답은
 * {@link CommonResponse} 봉투 (CONVENTIONS.md §8.2).
 */
@RestController
@RequestMapping("/internal/stocks")
@RequiredArgsConstructor
public class InternalStockController {

    private final StockReserveService stockReserveService;

    @PostMapping("/{optionId}/reserve")
    public ResponseEntity<CommonResponse<StockReserveResponse>> reserve(
        @PathVariable long optionId,
        @Valid @RequestBody StockReserveRequest request
    ) {
        StockReserveResult result = stockReserveService.reserve(
            new StockReserveCommand(optionId, request.quantity()));
        return ResponseEntity.ok(CommonResponse.success(StockReserveResponse.from(result)));
    }
}
