package com.deepblog.seller.store.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.seller.common.auth.AuthenticatedSeller;
import com.deepblog.seller.common.auth.SellerContext;
import com.deepblog.seller.store.model.response.StoreResponse;
import com.deepblog.seller.store.service.StoreQueryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller/stores")
@RequiredArgsConstructor
public class StoreQueryController {

    private final StoreQueryService queryService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<StoreResponse>>> findMyStores(
        @AuthenticatedSeller SellerContext seller
    ) {
        List<StoreResponse> data = queryService.findMyStores(seller.sellerId()).stream()
            .map(StoreResponse::from)
            .toList();
        return ResponseEntity.ok(CommonResponse.ok(data));
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<CommonResponse<StoreResponse>> findMyStore(
        @AuthenticatedSeller SellerContext seller,
        @PathVariable Long storeId
    ) {
        StoreResponse data = StoreResponse.from(
            queryService.findMyStore(seller.sellerId(), storeId)
        );
        return ResponseEntity.ok(CommonResponse.ok(data));
    }
}
