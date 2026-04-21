package com.deepblog.minicoupang.domain.seller.storage

import com.deepblog.minicoupang.domain.seller.Seller
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@SpringBootTest
@Testcontainers
class SellerRepositoryIntegrationTest {

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:16")
    }

    @Autowired lateinit var repository: SellerRepository

    @Test
    fun `save and find seller round-trip`() {
        val saved = repository.save(
            Seller(name = "Toss Seller", email = "toss@example.com"),
        )

        assertThat(saved.id).isNotNull()

        val found = repository.findById(saved.id!!).orElseThrow()
        assertThat(found.name).isEqualTo("Toss Seller")
        assertThat(found.email).isEqualTo("toss@example.com")
        assertThat(found.version).isEqualTo(0L)
    }

    @Test
    fun `findByEmail returns null when no match`() {
        val found = repository.findByEmail("no-such@example.com")
        assertThat(found).isNull()
    }
}
