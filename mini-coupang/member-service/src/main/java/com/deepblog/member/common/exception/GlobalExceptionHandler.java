package com.deepblog.member.common.exception;

import com.deepblog.common.error.BusinessException;
import com.deepblog.common.error.ErrorCodeSpec;
import com.deepblog.common.response.CommonResponse;
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
