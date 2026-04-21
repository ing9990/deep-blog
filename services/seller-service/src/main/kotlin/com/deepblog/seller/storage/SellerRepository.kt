package com.deepblog.seller.storage

import com.deepblog.seller.domain.Seller
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

/**
 * Spring Data JPA 인터페이스. 메서드 선언만으로 구현체가 런타임에 생성됨.
 *
 * 커스텀 쿼리는 추후 `findByEmail`, `@Query`, QueryDSL 등으로 확장.
 */
@Repository
interface SellerRepository : JpaRepository<Seller, Long> {
    fun findByEmail(email: String): Seller?
}
