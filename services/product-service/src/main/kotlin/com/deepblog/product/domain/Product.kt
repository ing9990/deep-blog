package com.deepblog.product.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.Version

/**
 * Product 도메인 엔티티.
 *
 * aggregate 설계 (`project-architecture.md` §2 + `domain-design.md` §4):
 * - Seller와는 다른 aggregate. `sellerId: Long`로 ID 참조만 보관.
 * - `sellerName: String`은 등록 시점 **스냅샷**. Seller가 나중에 이름을
 *   바꿔도 과거 상품에는 소급 적용하지 않음(조회 QPS + 판매자 재명명
 *   빈도 낮음 가정). 실 환경에서 판매자 변경 이벤트 도착 시 upsert 전략은
 *   Phase 2 이후에 도입.
 * - price는 원화 단위 `Long` (소수점 없음).
 * - @Version optimistic locking은 Phase 2 재고 차감 동시성 실험용 기반.
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
