package com.deepblog.minicoupang.domain.product.seller.controller;

import static org.springframework.http.HttpStatus.CREATED;

import com.deepblog.minicoupang.domain.auth.context.AuthContext;
import com.deepblog.minicoupang.domain.auth.context.AuthContextHolder;
import com.deepblog.minicoupang.domain.auth.exception.UnauthenticatedException;
import com.deepblog.minicoupang.domain.product.domain.Product;
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
        @Valid @RequestBody RegisterProductRequest request
    ) {
        Long accountId = AuthContextHolder.get()
            .map(AuthContext::accountId)
            .orElseThrow(UnauthenticatedException::new);

        Product product = sellerProductService.registerProduct(accountId, request.toCommand());
        return ResponseEntity.status(CREATED).body(RegisterProductResponse.from(product));
    }
}
