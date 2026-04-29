package com.deepblog.payment.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.payment.application.PaymentChargeService;
import com.deepblog.payment.application.command.PaymentChargeCommand;
import com.deepblog.payment.application.result.PaymentChargeResult;
import com.deepblog.payment.controller.dto.PaymentChargeRequest;
import com.deepblog.payment.controller.dto.PaymentChargeResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentChargeService paymentChargeService;

    @PostMapping("/charge")
    public ResponseEntity<CommonResponse<PaymentChargeResponse>> charge(
        @Valid @RequestBody PaymentChargeRequest request
    ) {
        PaymentChargeCommand command = PaymentChargeCommand.of(
            request.orderRef(), request.amount(), request.simulateFailure());
        PaymentChargeResult result = paymentChargeService.charge(command);
        return ResponseEntity.ok(CommonResponse.success(PaymentChargeResponse.from(result)));
    }
}
