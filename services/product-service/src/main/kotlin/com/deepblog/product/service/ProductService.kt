package com.deepblog.product.service

import com.deepblog.product.api.dto.CreateProductRequest
import com.deepblog.product.api.dto.ProductResponse
import com.deepblog.product.domain.Product
import com.deepblog.product.storage.ProductRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
@Transactional(readOnly = true)
class ProductService(
    private val repository: ProductRepository,
) {
    @Transactional
    fun create(request: CreateProductRequest): ProductResponse {
        val product = Product(
            sellerId = request.sellerId,
            sellerName = request.sellerName.trim(),
            name = request.name.trim(),
            price = request.price,
            stock = request.stock,
        )
        val saved = repository.save(product)
        return ProductResponse.from(saved)
    }

    fun findById(id: Long): ProductResponse {
        val product = repository.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: $id")
        }
        return ProductResponse.from(product)
    }

    fun findBySellerId(sellerId: Long): List<ProductResponse> =
        repository.findBySellerId(sellerId).map { ProductResponse.from(it) }
}
