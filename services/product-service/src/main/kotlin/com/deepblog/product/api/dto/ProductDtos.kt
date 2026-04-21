package com.deepblog.product.api.dto

import com.deepblog.product.domain.Product
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import jakarta.validation.constraints.Size

/**
 * 상품 등록 요청. 판매자 인증은 Phase 2(인증 도입) 이전까지는 클라이언트가
 * sellerId + sellerName 스냅샷을 같이 전달하는 것으로 대체.
 * `project-architecture.md` 통합 패턴 옵션 A.
 */
data class CreateProductRequest(
    @field:Positive
    val sellerId: Long,

    @field:NotBlank
    @field:Size(max = 80)
    val sellerName: String,

    @field:NotBlank
    @field:Size(max = 200)
    val name: String,

    @field:PositiveOrZero
    val price: Long,

    @field:PositiveOrZero
    val stock: Int,
)

data class ProductResponse(
    val id: Long,
    val sellerId: Long,
    val sellerName: String,
    val name: String,
    val price: Long,
    val stock: Int,
) {
    companion object {
        fun from(product: Product): ProductResponse = ProductResponse(
            id = requireNotNull(product.id) { "persisted Product must have id" },
            sellerId = product.sellerId,
            sellerName = product.sellerName,
            name = product.name,
            price = product.price,
            stock = product.stock,
        )
    }
}
