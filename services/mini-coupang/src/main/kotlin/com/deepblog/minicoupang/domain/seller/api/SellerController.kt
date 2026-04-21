package com.deepblog.minicoupang.domain.seller.api

import com.deepblog.minicoupang.domain.seller.api.dto.CreateSellerRequest
import com.deepblog.minicoupang.domain.seller.api.dto.SellerResponse
import com.deepblog.minicoupang.domain.seller.service.SellerService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.net.URI

@RestController
@RequestMapping("/api/v1/sellers")
class SellerController(
    private val service: SellerService,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateSellerRequest): ResponseEntity<SellerResponse> {
        val response = service.create(request)
        return ResponseEntity
            .created(URI.create("/api/v1/sellers/${response.id}"))
            .body(response)
    }

    @GetMapping("/{id}")
    fun findById(@PathVariable id: Long): SellerResponse = service.findById(id)
}
