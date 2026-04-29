package com.deepblog.order.client;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.client.dto.StockReserveHttpRequest;
import com.deepblog.order.client.dto.StockReserveHttpResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "product-stock-client", url = "${clients.product-server.url}")
public interface ProductStockClient {

    @PostMapping("/internal/stocks/{optionId}/reserve")
    CommonResponse<StockReserveHttpResponse> reserve(
        @PathVariable("optionId") long optionId,
        @RequestBody StockReserveHttpRequest request
    );
}
