package com.deepblog.product.catalog.repository;

import com.deepblog.product.catalog.entity.CatalogStore;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogStoreRepository extends JpaRepository<CatalogStore, Long> {

    Optional<CatalogStore> findBySlug(String slug);
}
