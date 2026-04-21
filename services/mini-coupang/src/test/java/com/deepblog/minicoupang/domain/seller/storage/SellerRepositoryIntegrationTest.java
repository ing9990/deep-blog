package com.deepblog.minicoupang.domain.seller.storage;

import com.deepblog.minicoupang.domain.seller.Seller;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
class SellerRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    SellerRepository repository;

    @Test
    void save_and_find_seller_round_trip() {
        Seller saved = repository.save(Seller.create("Toss Seller", "toss@example.com"));

        assertThat(saved.getId()).isNotNull();

        Seller found = repository.findById(saved.getId()).orElseThrow();
        assertThat(found.getName()).isEqualTo("Toss Seller");
        assertThat(found.getEmail()).isEqualTo("toss@example.com");
        assertThat(found.getVersion()).isEqualTo(0L);
    }

    @Test
    void findByEmail_returns_empty_when_no_match() {
        assertThat(repository.findByEmail("no-such@example.com")).isEmpty();
    }
}
