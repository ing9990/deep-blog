package com.deepblog.order.controller;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.application.OrderFacade;
import com.deepblog.order.application.command.PlaceOrderCommand;
import com.deepblog.order.application.result.PlaceOrderResult;
import com.deepblog.order.controller.dto.PlaceOrderRequest;
import com.deepblog.order.controller.dto.PlaceOrderResponse;
import com.deepblog.order.global.auth.AuthContext;
import com.deepblog.order.global.auth.LoginRequired;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderFacade orderFacade;

    @PostMapping
    public ResponseEntity<CommonResponse<PlaceOrderResponse>> placeOrder(
        @LoginRequired AuthContext auth,
        @Valid @RequestBody PlaceOrderRequest request
    ) {
        if (auth.memberId() == null) {
            throw new BusinessException(ErrorCode.NOT_A_MEMBER);
        }
        PlaceOrderCommand command = PlaceOrderCommand.of(
            auth.memberId(),
            request.optionId(),
            request.quantity(),
            request.simulateFailure()
        );
        PlaceOrderResult result = orderFacade.placeOrder(command);
        return ResponseEntity.ok(CommonResponse.success(PlaceOrderResponse.from(result)));
    }
}
