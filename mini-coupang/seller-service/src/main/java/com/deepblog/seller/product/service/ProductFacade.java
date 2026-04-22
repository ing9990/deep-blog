package com.deepblog.seller.product.service;

import com.deepblog.seller.product.entity.Product;
import com.deepblog.seller.product.model.request.CreateProductRequest;
import com.deepblog.seller.product.model.request.UpdateProductRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductFacade {

    private final ProductCommandService commandService;

    public Product register(Long sellerId, Long storeId, CreateProductRequest request) {
        return commandService.register(sellerId, storeId, request);
    }

    public Product update(Long sellerId, Long productId, UpdateProductRequest request) {
        return commandService.update(sellerId, productId, request);
    }

    public Product delete(Long sellerId, Long productId) {
        return commandService.delete(sellerId, productId);
    }
}
