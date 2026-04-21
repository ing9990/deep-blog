package com.deepblog.seller.api

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

/**
 * HTTP 레이어 end-to-end 테스트: MockMvc가 Spring MVC 스택 + 실제 Postgres
 * (Testcontainers)를 엮어 검증. Controller + Service + Repository + DB의
 * 합이 맞는지 확인.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class SellerControllerIntegrationTest {

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:16")
    }

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper

    @Test
    fun `POST sellers creates seller and returns 201 with Location`() {
        val body = """{"name":"Toss Seller","email":"toss@example.com"}"""

        val result = mockMvc.post("/api/v1/sellers") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect {
            status { isCreated() }
            header { exists("Location") }
            jsonPath("$.name") { value("Toss Seller") }
            jsonPath("$.email") { value("toss@example.com") }
            jsonPath("$.id") { isNumber() }
        }.andReturn()

        // Location 헤더가 /api/v1/sellers/{id}를 가리키는지 확인
        val location = result.response.getHeader("Location")
        assert(location?.startsWith("/api/v1/sellers/") == true) {
            "unexpected Location: $location"
        }
    }

    @Test
    fun `GET existing seller returns 200 with body`() {
        val created = mockMvc.post("/api/v1/sellers") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Seller A","email":"a@example.com"}"""
        }.andReturn().response.contentAsString
        val id = objectMapper.readTree(created).get("id").asLong()

        mockMvc.get("/api/v1/sellers/$id").andExpect {
            status { isOk() }
            jsonPath("$.id") { value(id.toInt()) }
            jsonPath("$.name") { value("Seller A") }
        }
    }

    @Test
    fun `GET non-existing seller returns 404`() {
        mockMvc.get("/api/v1/sellers/999999").andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `POST with blank name returns 400`() {
        mockMvc.post("/api/v1/sellers") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"","email":"x@example.com"}"""
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `POST with duplicate email returns 409`() {
        val body = """{"name":"First","email":"dup@example.com"}"""
        mockMvc.post("/api/v1/sellers") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/v1/sellers") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Second","email":"dup@example.com"}"""
        }.andExpect {
            status { isConflict() }
        }
    }
}
