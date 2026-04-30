package com.deepblog.product.application;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.product.application.command.StockReserveCommand;
import com.deepblog.product.application.result.StockReserveResult;
import com.deepblog.product.repository.ProductStockRedisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * order-server 가 결제 시도 직전에 호출하는 Redis 재고 선점 서비스.
 *
 * <p>Lua 스크립트 한 명령으로 GET-검증-DECRBY 가 원자적으로 실행되므로 동시 호출에서도
 * lost update 가 발생하지 않는다.
 *
 * <p>반환:
 * <ul>
 *   <li>-1 : 키 없음 → 404 STOCK_NOT_FOUND</li>
 *   <li>-2 : 재고 부족 → 409 INSUFFICIENT_AMOUNT</li>
 *   <li>0 이상 : 차감 후 남은 재고</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class StockReserveService {

    private final ProductStockRedisRepository productStockRedisRepository;

    public StockReserveResult reserve(StockReserveCommand command) {
        long result = productStockRedisRepository.reserveStock(
            command.optionId(), command.quantity());

        if (result == -1L) {
            throw new BusinessException(ErrorCode.STOCK_NOT_FOUND);
        }
        if (result == -2L) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_AMOUNT);
        }
        return StockReserveResult.of(command.optionId(), command.quantity(), result);
    }
}
