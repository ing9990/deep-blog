package com.deepblog.order.client;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.order.client.dto.OptionDetailHttpResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "product-option-client", url = "${clients.product-server.url}")
public interface ProductOptionClient {

    @GetMapping("/internal/options/{optionId}")
    CommonResponse<OptionDetailHttpResponse> getOption(@PathVariable("optionId") long optionId);
}
