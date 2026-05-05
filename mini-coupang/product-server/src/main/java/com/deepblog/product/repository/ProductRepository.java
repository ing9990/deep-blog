package com.deepblog.product.repository;

import com.deepblog.product.domain.Product;
import com.deepblog.product.domain.ProductStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findBySellerId(Long sellerId);

    List<Product> findByCategoryId(Long categoryId);

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.sellerId = :sellerId ORDER BY p.createdAt DESC, p.id DESC")
    Page<Product> findBySellerIdOrderByCreatedAtDesc(@Param("sellerId") Long sellerId, Pageable pageable);

    List<Product> findBySellerIdAndStatus(Long sellerId, ProductStatus status);

    @Query("""
        SELECT p.id FROM Product p
        WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
          AND p.status = :status
          AND (:categoryId IS NULL OR p.categoryId = :categoryId)
          AND (:minPrice IS NULL OR p.basePrice.amount >= :minPrice)
          AND (:maxPrice IS NULL OR p.basePrice.amount <= :maxPrice)
        ORDER BY p.id ASC
        """)
    List<Long> searchIdsByKeyword(
        @Param("q") String keyword,
        @Param("status") ProductStatus status,
        @Param("categoryId") Long categoryId,
        @Param("minPrice") Long minPrice,
        @Param("maxPrice") Long maxPrice,
        Pageable pageable);
}
