package com.deepblog.minicoupang.domain.product.seller.application;

import com.deepblog.minicoupang.domain.product.domain.Product;

public interface SellerProductService {

    Product registerProduct(Long accountId, RegisterProductCommand command);
}
