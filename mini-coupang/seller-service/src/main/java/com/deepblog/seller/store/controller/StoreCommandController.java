package com.deepblog.seller.store.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.seller.common.auth.AuthenticatedSeller;
import com.deepblog.seller.common.auth.SellerContext;
import com.deepblog.seller.store.model.request.CreateStoreRequest;
import com.deepblog.seller.store.model.request.UpdateStoreRequest;
import com.deepblog.seller.store.model.response.StoreResponse;
import com.deepblog.seller.store.service.StoreCommandService;
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
@RequestMapping("/api/seller/stores")
@RequiredArgsConstructor
public class StoreCommandController {

    private final StoreCommandService commandService;

    @PostMapping
    public ResponseEntity<CommonResponse<StoreResponse>> create(
        @AuthenticatedSeller SellerContext seller,
        @Valid @RequestBody CreateStoreRequest request
    ) {
        StoreResponse data = StoreResponse.from(commandService.create(seller.sellerId(), request));
        return ResponseEntity.status(HttpStatus.CREATED).body(CommonResponse.ok(data));
    }

    @PatchMapping("/{storeId}")
    public ResponseEntity<CommonResponse<StoreResponse>> update(
        @AuthenticatedSeller SellerContext seller,
        @PathVariable Long storeId,
        @Valid @RequestBody UpdateStoreRequest request
    ) {
        StoreResponse data = StoreResponse.from(
            commandService.update(seller.sellerId(), storeId, request)
        );
        return ResponseEntity.ok(CommonResponse.ok(data));
    }

    @DeleteMapping("/{storeId}")
    public ResponseEntity<CommonResponse<StoreResponse>> close(
        @AuthenticatedSeller SellerContext seller,
        @PathVariable Long storeId
    ) {
        StoreResponse data = StoreResponse.from(commandService.close(seller.sellerId(), storeId));
        return ResponseEntity.ok(CommonResponse.ok(data));
    }
}
