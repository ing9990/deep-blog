package com.deepblog.product.stock.repository;

import com.deepblog.product.stock.entity.ProductStock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductStockRepository extends JpaRepository<ProductStock, Long> {
}
