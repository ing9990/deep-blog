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

    // Stage 1 baseline: MySQL LIKE 단일 채널. LOWER + 양쪽 와일드카드라 B+Tree
    // 인덱스 사용 불가, ORDER BY p.id ASC 는 relevance 가 아닌 ID 순. 이 한계가
    // stage 2 ES 도입의 동기다. gRPC + Qdrant FusionQuery 채널은 SearchSteps
    // 에서 호출만 끊은 상태로 보존된다.
    @Query("""
        SELECT p.id FROM Product p
        WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
          AND p.status = :status
          AND (:categoryId IS NULL OR p.categoryId = :categoryId)
          AND (:minPrice IS NULL OR p.basePrice >= :minPrice)
          AND (:maxPrice IS NULL OR p.basePrice <= :maxPrice)
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
