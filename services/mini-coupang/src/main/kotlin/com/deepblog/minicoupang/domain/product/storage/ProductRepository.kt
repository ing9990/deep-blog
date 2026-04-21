package com.deepblog.minicoupang.domain.product.storage

import com.deepblog.minicoupang.domain.product.Product
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ProductRepository : JpaRepository<Product, Long> {
    fun findBySellerId(sellerId: Long): List<Product>
}
