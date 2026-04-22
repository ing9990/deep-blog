package com.deepblog.minicoupang.domain.product.seller.controller;

import static org.springframework.http.HttpStatus.CREATED;

import com.deepblog.minicoupang.domain.auth.annotation.LoginRequired;
import com.deepblog.minicoupang.domain.product.seller.application.RegisterProductResult;
import com.deepblog.minicoupang.domain.product.seller.application.SellerProductService;
import com.deepblog.minicoupang.domain.product.seller.controller.dto.RegisterProductRequest;
import com.deepblog.minicoupang.domain.product.seller.controller.dto.RegisterProductResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller/products")
@RequiredArgsConstructor
public class SellerProductController {

    private final SellerProductService sellerProductService;

    @PostMapping
    public ResponseEntity<RegisterProductResponse> register(
        @LoginRequired Long accountId,
        @Valid @RequestBody RegisterProductRequest request
    ) {
        RegisterProductResult result = sellerProductService.registerProduct(accountId, request.toCommand());
        return ResponseEntity.status(CREATED).body(RegisterProductResponse.from(result));
    }
}
