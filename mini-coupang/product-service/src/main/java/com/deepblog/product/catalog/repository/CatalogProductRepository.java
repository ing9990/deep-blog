package com.deepblog.product.catalog.repository;

import com.deepblog.product.catalog.entity.CatalogProduct;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogProductRepository extends JpaRepository<CatalogProduct, Long> {
}
