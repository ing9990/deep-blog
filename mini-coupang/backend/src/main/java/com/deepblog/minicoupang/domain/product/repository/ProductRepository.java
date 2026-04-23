package com.deepblog.minicoupang.domain.product.repository;

import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductStatus;
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

    @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId ORDER BY p.createdAt DESC, p.id DESC")
    Page<Product> findBySellerIdOrderByCreatedAtDesc(@Param("sellerId") Long sellerId, Pageable pageable);

    List<Product> findBySellerIdAndStatus(Long sellerId, ProductStatus status);

    /**
     * Lexical side of hybrid search. Returns product ids matching the
     * keyword in name or description and satisfying the optional filters.
     * Any {@code null} filter parameter means "no constraint on this axis".
     * Result is ordered by {@code product_id ASC} so ranks are stable.
     */
    @Query("""
        SELECT p.id FROM Product p
        WHERE (LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:categoryId IS NULL OR p.categoryId = :categoryId)
          AND (:minPrice IS NULL OR p.basePrice >= :minPrice)
          AND (:maxPrice IS NULL OR p.basePrice <= :maxPrice)
          AND (:status IS NULL OR p.status = :status)
        ORDER BY p.id ASC
        """)
    List<Long> searchIdsByKeyword(
        @Param("q") String q,
        @Param("categoryId") Long categoryId,
        @Param("minPrice") Long minPrice,
        @Param("maxPrice") Long maxPrice,
        @Param("status") ProductStatus status,
        Pageable page
    );
}
