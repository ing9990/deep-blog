package com.deepblog.member.repository;

import com.deepblog.member.domain.Seller;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerRepository extends JpaRepository<Seller, Long> {

    Optional<Seller> findByAccountId(Long accountId);

    boolean existsByBusinessRegistrationNumber(String businessRegistrationNumber);
}
