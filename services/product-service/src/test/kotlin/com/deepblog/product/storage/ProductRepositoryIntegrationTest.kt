package com.deepblog.product.storage

import com.deepblog.product.domain.Product
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
class ProductRepositoryIntegrationTest {

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:16")
    }

    @Autowired lateinit var repository: ProductRepository

    @Test
    fun `save and find product round-trip`() {
        val saved = repository.save(
            Product(
                sellerId = 1L,
                sellerName = "Coupang Seller",
                name = "스마트폰",
                price = 1_200_000L,
                stock = 10,
            ),
        )

        assertThat(saved.id).isNotNull()

        val found = repository.findById(saved.id!!).orElseThrow()
        assertThat(found.name).isEqualTo("스마트폰")
        assertThat(found.price).isEqualTo(1_200_000L)
        assertThat(found.stock).isEqualTo(10)
        assertThat(found.sellerId).isEqualTo(1L)
        assertThat(found.sellerName).isEqualTo("Coupang Seller")
    }

    @Test
    fun `findBySellerId returns products for that seller only`() {
        repository.saveAll(
            listOf(
                Product(sellerId = 42L, sellerName = "S42", name = "A", price = 100, stock = 1),
                Product(sellerId = 42L, sellerName = "S42", name = "B", price = 200, stock = 2),
                Product(sellerId = 99L, sellerName = "S99", name = "C", price = 300, stock = 3),
            ),
        )

        val s42Products = repository.findBySellerId(42L)
        assertThat(s42Products).hasSize(2)
        assertThat(s42Products.map { it.name }).containsExactlyInAnyOrder("A", "B")
    }

    @Test
    fun `negative price is rejected at entity init`() {
        val ex = runCatching {
            Product(sellerId = 1L, sellerName = "S", name = "X", price = -1, stock = 0)
        }.exceptionOrNull()
        assertThat(ex).isInstanceOf(IllegalArgumentException::class.java)
    }
}
