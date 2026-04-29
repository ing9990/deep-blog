package com.deepblog.product.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.product.application.OptionDetailService;
import com.deepblog.product.application.result.OptionDetailResult;
import com.deepblog.product.controller.dto.OptionDetailResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 다른 서비스가 옵션 스냅샷을 조회하는 내부 API. order-server 가 결제 직전 호출한다.
 *
 * <p>외부 노출 (`/api/...`) 과 분리해 `/internal/...` prefix.
 */
@RestController
@RequestMapping("/internal/options")
@RequiredArgsConstructor
public class InternalOptionController {

    private final OptionDetailService optionDetailService;

    @GetMapping("/{optionId}")
    public ResponseEntity<CommonResponse<OptionDetailResponse>> getOption(
        @PathVariable long optionId
    ) {
        OptionDetailResult result = optionDetailService.getOptionDetail(optionId);
        return ResponseEntity.ok(CommonResponse.success(OptionDetailResponse.from(result)));
    }
}
