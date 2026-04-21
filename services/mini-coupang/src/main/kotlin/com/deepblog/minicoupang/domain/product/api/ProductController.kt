package com.deepblog.minicoupang.domain.product.api

import com.deepblog.minicoupang.domain.product.api.dto.CreateProductRequest
import com.deepblog.minicoupang.domain.product.api.dto.ProductResponse
import com.deepblog.minicoupang.domain.product.service.ProductService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.net.URI

@RestController
@RequestMapping("/api/v1/products")
class ProductController(
    private val service: ProductService,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateProductRequest): ResponseEntity<ProductResponse> {
        val response = service.create(request)
        return ResponseEntity
            .created(URI.create("/api/v1/products/${response.id}"))
            .body(response)
    }

    @GetMapping("/{id}")
    fun findById(@PathVariable id: Long): ProductResponse = service.findById(id)

    @GetMapping
    fun listBySeller(@RequestParam sellerId: Long): List<ProductResponse> =
        service.findBySellerId(sellerId)
}
