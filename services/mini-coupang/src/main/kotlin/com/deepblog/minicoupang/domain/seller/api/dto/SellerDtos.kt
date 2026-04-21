package com.deepblog.minicoupang.domain.seller.api.dto

import com.deepblog.minicoupang.domain.seller.Seller
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateSellerRequest(
    @field:NotBlank
    @field:Size(max = 80)
    val name: String,

    @field:NotBlank
    @field:Email
    @field:Size(max = 200)
    val email: String,
)

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
