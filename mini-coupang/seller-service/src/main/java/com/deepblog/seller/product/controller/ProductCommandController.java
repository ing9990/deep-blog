package com.deepblog.seller.product.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.seller.common.auth.AuthenticatedSeller;
import com.deepblog.seller.common.auth.SellerContext;
import com.deepblog.seller.common.idempotency.Idempotent;
import com.deepblog.seller.product.model.request.CreateProductRequest;
import com.deepblog.seller.product.model.request.UpdateProductRequest;
import com.deepblog.seller.product.model.response.ProductResponse;
import com.deepblog.seller.product.service.ProductCommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class ProductCommandController {

    private final ProductCommandService commandService;

    @Idempotent
    @PostMapping("/stores/{storeId}/products")
    public ResponseEntity<CommonResponse<ProductResponse>> register(
        @AuthenticatedSeller SellerContext seller,
        @PathVariable Long storeId,
        @Valid @RequestBody CreateProductRequest request
    ) {
        ProductResponse data = ProductResponse.from(
            commandService.register(seller.sellerId(), storeId, request)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(CommonResponse.ok(data));
    }

    @Idempotent
    @PatchMapping("/products/{productId}")
    public ResponseEntity<CommonResponse<ProductResponse>> update(
        @AuthenticatedSeller SellerContext seller,
        @PathVariable Long productId,
        @Valid @RequestBody UpdateProductRequest request
    ) {
        ProductResponse data = ProductResponse.from(
            commandService.update(seller.sellerId(), productId, request)
        );
        return ResponseEntity.ok(CommonResponse.ok(data));
    }

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<CommonResponse<ProductResponse>> delete(
        @AuthenticatedSeller SellerContext seller,
        @PathVariable Long productId
    ) {
        ProductResponse data = ProductResponse.from(
            commandService.delete(seller.sellerId(), productId)
        );
        return ResponseEntity.ok(CommonResponse.ok(data));
    }
}
