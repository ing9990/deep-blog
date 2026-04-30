package com.deepblog.product.controller;

import static org.springframework.http.HttpStatus.CREATED;

import com.deepblog.product.application.SellerProductService;
import com.deepblog.product.application.result.ListMyProductsResult;
import com.deepblog.product.application.result.RegisterProductResult;
import com.deepblog.product.controller.dto.ListMyProductsResponse;
import com.deepblog.product.controller.dto.RegisterProductRequest;
import com.deepblog.product.controller.dto.RegisterProductResponse;
import com.deepblog.product.global.auth.AuthContext;
import com.deepblog.product.global.auth.LoginRequired;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller/products")
@RequiredArgsConstructor
public class SellerProductController {

    private final SellerProductService sellerProductService;

    @GetMapping
    public ResponseEntity<ListMyProductsResponse> list(
        @LoginRequired AuthContext auth,
        @RequestParam(value = "page", defaultValue = "0") int page,
        @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        ListMyProductsResult result = sellerProductService.listMyProducts(
            auth.sellerId(), PageRequest.of(page, size));
        return ResponseEntity.ok(ListMyProductsResponse.from(result));
    }

    @PostMapping
    public ResponseEntity<RegisterProductResponse> register(
        @LoginRequired AuthContext auth,
        @Valid @RequestBody RegisterProductRequest request
    ) {
        RegisterProductResult result = sellerProductService.registerProduct(
            auth.sellerId(), request.toCommand());
        return ResponseEntity.status(CREATED).body(RegisterProductResponse.from(result));
    }
}
