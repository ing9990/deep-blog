package com.deepblog.minicoupang.domain.product.repository;

import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductOptionRepository extends JpaRepository<ProductOption, Long> {

    @Query("select po from ProductOption po join fetch po.product where po.id = :id")
    Optional<ProductOption> findByIdWithProduct(@Param("id") Long id);
}
