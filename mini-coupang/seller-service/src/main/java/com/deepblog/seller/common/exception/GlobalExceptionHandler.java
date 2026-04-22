package com.deepblog.seller.common.exception;

import com.deepblog.common.error.BusinessException;
import com.deepblog.common.error.ErrorCodeSpec;
import com.deepblog.common.response.CommonResponse;
import com.deepblog.seller.common.auth.InvalidJwtException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<CommonResponse<Void>> handleBusiness(BusinessException ex) {
        ErrorCodeSpec spec = ex.spec();
        return ResponseEntity.status(spec.status())
            .body(CommonResponse.fail(spec.code(), spec.message()));
    }

    @ExceptionHandler(InvalidJwtException.class)
    public ResponseEntity<CommonResponse<Void>> handleInvalidJwt(InvalidJwtException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(CommonResponse.fail("AUTH_TOKEN_001", "유효하지 않은 인증 토큰입니다"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<CommonResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .orElse("validation failed");
        return ResponseEntity.badRequest()
            .body(CommonResponse.fail("VALIDATION_001", message));
    }
}
