package com.deepblog.seller.repository;

import com.deepblog.seller.entity.Seller;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerRepository extends JpaRepository<Seller, Long> {

    Optional<Seller> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByBusinessRegistrationNo(String businessRegistrationNo);
}
