package com.deepblog.seller.service

import com.deepblog.seller.api.dto.CreateSellerRequest
import com.deepblog.seller.api.dto.SellerResponse
import com.deepblog.seller.domain.Seller
import com.deepblog.seller.storage.SellerRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

/**
 * 애플리케이션 서비스 레이어. 지금은 Repository 단순 위임이지만, 트랜잭션
 * 경계와 예외 매핑 책임을 여기서 부담. 도메인 로직이 자라나면 이 레이어가
 * 첫 번째 성장 지점.
 */
@Service
@Transactional(readOnly = true)
class SellerService(
    private val repository: SellerRepository,
) {
    @Transactional
    fun create(request: CreateSellerRequest): SellerResponse {
        val seller = Seller(
            name = request.name.trim(),
            email = request.email.trim().lowercase(),
        )
        val saved = try {
            repository.save(seller)
        } catch (e: DataIntegrityViolationException) {
            // unique(email) 위반. 동시 요청에서 race는 여전히 가능하므로
            // DB 제약조건이 최종 방어선.
            throw ResponseStatusException(
                HttpStatus.CONFLICT,
                "이미 등록된 email: ${request.email}",
                e,
            )
        }
        return SellerResponse.from(saved)
    }

    fun findById(id: Long): SellerResponse {
        val seller = repository.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Seller not found: $id")
        }
        return SellerResponse.from(seller)
    }
}
