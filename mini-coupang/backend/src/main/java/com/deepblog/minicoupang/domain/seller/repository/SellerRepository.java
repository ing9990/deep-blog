package com.deepblog.minicoupang.domain.seller.repository;

import com.deepblog.minicoupang.domain.seller.domain.Seller;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerRepository extends JpaRepository<Seller, Long> {

    Optional<Seller> findByAccountId(Long accountId);

    Optional<Seller> findByBusinessRegistrationNumber(String businessRegistrationNumber);

    boolean existsByAccountId(Long accountId);

    boolean existsByBusinessRegistrationNumber(String businessRegistrationNumber);
}
