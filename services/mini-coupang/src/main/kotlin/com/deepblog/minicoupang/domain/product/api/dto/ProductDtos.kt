package com.deepblog.minicoupang.domain.product.api.dto

import com.deepblog.minicoupang.domain.product.Product
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import jakarta.validation.constraints.Size

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
