package com.deepblog.minicoupang.domain.product.repository;

import com.deepblog.minicoupang.domain.product.domain.OptionStock;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OptionStockRepository extends JpaRepository<OptionStock, Long> {

    Optional<OptionStock> findByOptionId(Long optionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from OptionStock s where s.optionId = :optionId")
    Optional<OptionStock> findByOptionIdForUpdate(@Param("optionId") Long optionId);
}
