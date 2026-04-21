package com.deepblog.product.storage

import com.deepblog.product.domain.Product
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ProductRepository : JpaRepository<Product, Long> {
    fun findBySellerId(sellerId: Long): List<Product>
}
