package com.deepblog.payment.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.payment.application.PaymentConfirmService;
import com.deepblog.payment.application.command.PaymentConfirmCommand;
import com.deepblog.payment.application.result.PaymentConfirmResult;
import com.deepblog.payment.controller.dto.PaymentConfirmRequest;
import com.deepblog.payment.controller.dto.PaymentConfirmResponse;
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

    private final PaymentConfirmService paymentConfirmService;

    @PostMapping("/confirm")
    public ResponseEntity<CommonResponse<PaymentConfirmResponse>> confirm(
        @Valid @RequestBody PaymentConfirmRequest request
    ) {
        PaymentConfirmCommand command = PaymentConfirmCommand.of(
            request.paymentKey(),
            request.orderRef(),
            request.amount(),
            request.simulateFailure()
        );
        PaymentConfirmResult result = paymentConfirmService.confirm(command);
        return ResponseEntity.ok(CommonResponse.success(PaymentConfirmResponse.from(result)));
    }
}
