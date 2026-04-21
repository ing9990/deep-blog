package com.deepblog.minicoupang.domain.user.storage;

import com.deepblog.minicoupang.domain.user.User;
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
class UserRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    UserRepository repository;

    @Test
    void save_and_find_user_round_trip() {
        User saved = repository.save(User.create("Alice", "alice@example.com", "$2a$hash"));

        assertThat(saved.getId()).isNotNull();

        User found = repository.findById(saved.getId()).orElseThrow();
        assertThat(found.getName()).isEqualTo("Alice");
        assertThat(found.getEmail()).isEqualTo("alice@example.com");
        assertThat(found.getPasswordHash()).isEqualTo("$2a$hash");
    }

    @Test
    void findByEmail_returns_empty_when_no_match() {
        assertThat(repository.findByEmail("ghost@example.com")).isEmpty();
    }
}
