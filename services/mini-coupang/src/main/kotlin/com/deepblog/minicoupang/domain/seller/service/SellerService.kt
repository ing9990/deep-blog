package com.deepblog.minicoupang.domain.seller.service

import com.deepblog.minicoupang.domain.seller.Seller
import com.deepblog.minicoupang.domain.seller.api.dto.CreateSellerRequest
import com.deepblog.minicoupang.domain.seller.api.dto.SellerResponse
import com.deepblog.minicoupang.domain.seller.storage.SellerRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

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
