package com.deepblog.minicoupang.domain.order.controller;

import static org.springframework.http.HttpStatus.CREATED;

import com.deepblog.minicoupang.domain.auth.annotation.LoginRequired;
import com.deepblog.minicoupang.domain.order.application.OrderService;
import com.deepblog.minicoupang.domain.order.application.PlaceOrderResult;
import com.deepblog.minicoupang.domain.order.controller.dto.PlaceOrderRequest;
import com.deepblog.minicoupang.domain.order.controller.dto.PlaceOrderResponse;
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

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<PlaceOrderResponse> place(
        @LoginRequired Long accountId,
        @Valid @RequestBody PlaceOrderRequest request
    ) {
        PlaceOrderResult result = orderService.placeOrder(accountId, request.toCommand());
        return ResponseEntity.status(CREATED).body(PlaceOrderResponse.from(result));
    }
}
