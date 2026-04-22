package com.deepblog.product.category.repository;

import com.deepblog.product.category.entity.ProductCategory;
import com.deepblog.product.category.entity.ProductCategoryStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {

    List<ProductCategory> findAllByStatusOrderByDepthAscDisplayOrderAsc(
        ProductCategoryStatus status
    );

    boolean existsByIdAndStatus(Long id, ProductCategoryStatus status);
}
