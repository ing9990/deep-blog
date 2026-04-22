package com.deepblog.seller.store.repository;

import com.deepblog.seller.store.entity.Store;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store, Long> {

    boolean existsBySlug(String slug);

    Optional<Store> findBySlug(String slug);

    List<Store> findAllBySellerIdOrderByCreatedAtDesc(Long sellerId);
}
