package com.deepblog.minicoupang.domain.product.repository;

import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductOptionRepository extends JpaRepository<ProductOption, Long> {
}
