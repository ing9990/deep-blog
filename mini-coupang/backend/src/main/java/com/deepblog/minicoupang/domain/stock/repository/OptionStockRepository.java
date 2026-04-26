package com.deepblog.minicoupang.domain.stock.repository;

import com.deepblog.minicoupang.domain.stock.domain.OptionStock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OptionStockRepository extends JpaRepository<OptionStock, Long> {
}
