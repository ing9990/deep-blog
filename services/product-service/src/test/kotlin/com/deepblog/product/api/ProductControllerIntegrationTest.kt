package com.deepblog.product.api

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ProductControllerIntegrationTest {

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:16")
    }

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper

    private fun validBody(overrides: Map<String, Any?> = emptyMap()): String {
        val base = mutableMapOf<String, Any?>(
            "sellerId" to 1,
            "sellerName" to "Coupang Seller",
            "name" to "스마트폰",
            "price" to 1_200_000,
            "stock" to 10,
        )
        base.putAll(overrides)
        return objectMapper.writeValueAsString(base)
    }

    @Test
    fun `POST products creates product and returns 201 with Location`() {
        mockMvc.post("/api/v1/products") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody()
        }.andExpect {
            status { isCreated() }
            header { exists("Location") }
            jsonPath("$.id") { isNumber() }
            jsonPath("$.sellerId") { value(1) }
            jsonPath("$.sellerName") { value("Coupang Seller") }
            jsonPath("$.name") { value("스마트폰") }
            jsonPath("$.price") { value(1_200_000) }
            jsonPath("$.stock") { value(10) }
        }
    }

    @Test
    fun `GET existing product returns 200`() {
        val created = mockMvc.post("/api/v1/products") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody(mapOf("name" to "노트북"))
        }.andReturn().response.contentAsString
        val id = objectMapper.readTree(created).get("id").asLong()

        mockMvc.get("/api/v1/products/$id").andExpect {
            status { isOk() }
            jsonPath("$.name") { value("노트북") }
        }
    }

    @Test
    fun `GET non-existing product returns 404`() {
        mockMvc.get("/api/v1/products/999999").andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `POST with blank name returns 400`() {
        mockMvc.post("/api/v1/products") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody(mapOf("name" to ""))
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `POST with negative price returns 400`() {
        mockMvc.post("/api/v1/products") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody(mapOf("price" to -100))
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `GET by sellerId returns only that seller's products`() {
        mockMvc.post("/api/v1/products") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody(mapOf("sellerId" to 77, "name" to "TV"))
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/v1/products") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody(mapOf("sellerId" to 77, "name" to "Tablet"))
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/v1/products") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody(mapOf("sellerId" to 88, "name" to "Other"))
        }.andExpect { status { isCreated() } }

        mockMvc.get("/api/v1/products?sellerId=77").andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(2) }
        }
    }
}
