package com.deepblog.minicoupang.domain.product.seller.application;

public interface SellerProductService {

    RegisterProductResult registerProduct(Long accountId, RegisterProductCommand command);
}
