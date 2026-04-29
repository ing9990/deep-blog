package com.deepblog.product.repository;

import com.deepblog.product.domain.OptionStock;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OptionStockRepository extends JpaRepository<OptionStock, Long> {

    Optional<OptionStock> findByOptionId(Long optionId);

    /**
     * 단일 UPDATE 안에서 quantity 충분 여부와 차감을 한 번에 수행한다. affected=1 이면 성공,
     * affected=0 이면 (a) 옵션의 stock 행 부재 또는 (b) 재고 부족이다.
     *
     * <p>UPDATE 가 잡는 행 X 락이 트랜잭션 commit 까지 유지되므로, 외부 락이 commit 전에 풀려도
     * 동시 UPDATE 가 직렬화돼 lost update 가 발생하지 않는다.
     */
    @Modifying
    @Query("""
        UPDATE OptionStock optionStock
        SET optionStock.quantity = optionStock.quantity - :qty
        WHERE optionStock.optionId = :optionId
                and optionStock.quantity >= :qty
        """
    )
    int decreaseQuantityIfEnough(@Param("optionId") Long optionId, @Param("qty") long qty);
}
