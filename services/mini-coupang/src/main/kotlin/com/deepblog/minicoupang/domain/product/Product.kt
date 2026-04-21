package com.deepblog.minicoupang.domain.product

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.Version

/**
 * Product aggregate. Seller와 다른 aggregate이므로 ID 참조 + 이름 스냅샷만
 * 보유. 근거: `domain-design.md` §2-§4.
 */
@Entity
@Table(
    name = "products",
    indexes = [
        Index(name = "ix_products_seller_id", columnList = "seller_id"),
    ],
)
class Product(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "seller_id", nullable = false)
    val sellerId: Long,

    @Column(name = "seller_name", nullable = false, length = 80)
    val sellerName: String,

    @Column(nullable = false, length = 200)
    var name: String,

    @Column(nullable = false)
    var price: Long,

    @Column(nullable = false)
    var stock: Int,

    @Version
    var version: Long = 0,
) {
    init {
        require(price >= 0) { "price must be non-negative: $price" }
        require(stock >= 0) { "stock must be non-negative: $stock" }
    }
}
