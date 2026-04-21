package com.deepblog.seller.storage

import com.deepblog.seller.domain.Seller
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

/**
 * Step 4 smoke test: Testcontainers Postgres에 Seller를 저장하고 조회.
 *
 * @ServiceConnection은 Spring Boot 3.1+가 Testcontainers를 자동 감지해
 * spring.datasource.* 속성을 주입해 준다. 수동 @DynamicPropertySource 불필요.
 *
 * 실제 Postgres 컨테이너를 띄우므로 최초 실행 시 이미지 pull(수초) 소요.
 */
@SpringBootTest
@Testcontainers
class SellerRepositoryIntegrationTest {

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:16")
    }

    @Autowired
    lateinit var repository: SellerRepository

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
