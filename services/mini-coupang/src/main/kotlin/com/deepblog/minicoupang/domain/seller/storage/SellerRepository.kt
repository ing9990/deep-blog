package com.deepblog.minicoupang.domain.seller.storage

import com.deepblog.minicoupang.domain.seller.Seller
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SellerRepository : JpaRepository<Seller, Long> {
    fun findByEmail(email: String): Seller?
}
