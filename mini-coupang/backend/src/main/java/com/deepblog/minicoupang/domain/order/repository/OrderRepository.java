package com.deepblog.minicoupang.domain.order.repository;

import com.deepblog.minicoupang.domain.order.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
