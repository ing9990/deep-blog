package com.deepblog.seller.api.dto

import com.deepblog.seller.domain.Seller
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * Create request. Bean Validation 어노테이션으로 Controller 레이어에서
 * 자동 검증. @NotBlank는 null, "", "   " 모두 거절.
 */
data class CreateSellerRequest(
    @field:NotBlank
    @field:Size(max = 80)
    val name: String,

    @field:NotBlank
    @field:Email
    @field:Size(max = 200)
    val email: String,
)

/**
 * API 응답 전용. 도메인 엔티티를 외부로 바로 노출하지 않음(@Version, lazy
 * 필드 등 유출 방지).
 */
data class SellerResponse(
    val id: Long,
    val name: String,
    val email: String,
) {
    companion object {
        fun from(seller: Seller): SellerResponse = SellerResponse(
            id = requireNotNull(seller.id) { "persisted Seller must have id" },
            name = seller.name,
            email = seller.email,
        )
    }
}
