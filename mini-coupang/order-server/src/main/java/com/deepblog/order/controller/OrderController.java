package com.deepblog.order.controller;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.application.OrderFacade;
import com.deepblog.order.application.command.ConfirmOrderCommand;
import com.deepblog.order.application.command.PrepareOrderCommand;
import com.deepblog.order.application.result.ConfirmOrderResult;
import com.deepblog.order.application.result.PrepareOrderResult;
import com.deepblog.order.controller.dto.ConfirmOrderRequest;
import com.deepblog.order.controller.dto.ConfirmOrderResponse;
import com.deepblog.order.controller.dto.PrepareOrderRequest;
import com.deepblog.order.controller.dto.PrepareOrderResponse;
import com.deepblog.order.global.auth.AuthContext;
import com.deepblog.order.global.auth.LoginRequired;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 토스 결제 모델: prepare → (브라우저 SDK 로 결제 인증) → confirm 두 엔드포인트로 분리.
 *
 * <p>brower 측 흐름:
 * <ol>
 *   <li>POST /api/orders/prepare → orderId, amount 받는다.</li>
 *   <li>토스 SDK requestPayment(orderId, amount) → 카드 인증 / 3DS.</li>
 *   <li>successUrl 로 paymentKey, orderId, amount 가 쿼리로 전달된다.</li>
 *   <li>POST /api/orders/{orderId}/confirm body { paymentKey, amount } 로 백엔드 승인 호출.</li>
 * </ol>
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderFacade orderFacade;

    @PostMapping("/prepare")
    public ResponseEntity<CommonResponse<PrepareOrderResponse>> prepare(
        @LoginRequired AuthContext auth,
        @Valid @RequestBody PrepareOrderRequest request
    ) {
        Long memberId = ensureMember(auth);
        PrepareOrderCommand command = PrepareOrderCommand.of(
            memberId, request.optionId(), request.quantity());
        PrepareOrderResult result = orderFacade.prepare(command);
        return ResponseEntity.ok(CommonResponse.success(PrepareOrderResponse.from(result)));
    }

    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<CommonResponse<ConfirmOrderResponse>> confirm(
        @LoginRequired AuthContext auth,
        @PathVariable Long orderId,
        @Valid @RequestBody ConfirmOrderRequest request
    ) {
        Long memberId = ensureMember(auth);
        ConfirmOrderCommand command = ConfirmOrderCommand.of(
            memberId,
            orderId,
            request.paymentKey(),
            request.amount(),
            request.simulateFailure()
        );
        ConfirmOrderResult result = orderFacade.confirm(command);
        return ResponseEntity.ok(CommonResponse.success(ConfirmOrderResponse.from(result)));
    }

    private Long ensureMember(AuthContext auth) {
        if (auth.memberId() == null) {
            throw new BusinessException(ErrorCode.NOT_A_MEMBER);
        }
        return auth.memberId();
    }
}
