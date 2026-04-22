package com.deepblog.seller.product.repository;

import com.deepblog.seller.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySellerIdAndSku(Long sellerId, String sku);
}
