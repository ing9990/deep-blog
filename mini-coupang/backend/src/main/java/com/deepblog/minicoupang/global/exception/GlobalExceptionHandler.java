package com.deepblog.minicoupang.global.exception;

import com.deepblog.minicoupang.domain.auth.exception.DuplicateEmailException;
import com.deepblog.minicoupang.domain.auth.exception.InvalidCredentialsException;
import com.deepblog.minicoupang.domain.auth.exception.NotAMemberException;
import com.deepblog.minicoupang.domain.auth.exception.UnauthenticatedException;
import com.deepblog.minicoupang.domain.product.exception.InvalidProductException;
import com.deepblog.minicoupang.domain.seller.exception.InvalidSellerException;
import com.deepblog.minicoupang.domain.seller.exception.SellerNotRegisteredException;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("DUPLICATE_EMAIL", e.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("INVALID_CREDENTIALS", e.getMessage()));
    }

    @ExceptionHandler(UnauthenticatedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthenticated(UnauthenticatedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("UNAUTHENTICATED", e.getMessage()));
    }

    @ExceptionHandler(NotAMemberException.class)
    public ResponseEntity<ErrorResponse> handleNotAMember(NotAMemberException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse("NOT_A_MEMBER", e.getMessage()));
    }

    @ExceptionHandler(SellerNotRegisteredException.class)
    public ResponseEntity<ErrorResponse> handleSellerNotRegistered(SellerNotRegisteredException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("SELLER_NOT_REGISTERED", e.getMessage()));
    }

    @ExceptionHandler(InvalidProductException.class)
    public ResponseEntity<ErrorResponse> handleInvalidProduct(InvalidProductException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("INVALID_PRODUCT", e.getMessage()));
    }

    @ExceptionHandler(InvalidSellerException.class)
    public ResponseEntity<ErrorResponse> handleInvalidSeller(InvalidSellerException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("INVALID_SELLER", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("VALIDATION_ERROR", message));
    }
}
