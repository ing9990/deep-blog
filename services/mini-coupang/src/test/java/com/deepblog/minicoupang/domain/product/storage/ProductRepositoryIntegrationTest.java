package com.deepblog.minicoupang.domain.product.storage;

import com.deepblog.minicoupang.domain.product.Product;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Testcontainers
class ProductRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    ProductRepository repository;

    @Test
    void save_and_find_product_round_trip() {
        Product saved = repository.save(
                Product.create(1L, "Coupang Seller", "스마트폰", 1_200_000L, 10));

        assertThat(saved.getId()).isNotNull();

        Product found = repository.findById(saved.getId()).orElseThrow();
        assertThat(found.getName()).isEqualTo("스마트폰");
        assertThat(found.getPrice()).isEqualTo(1_200_000L);
        assertThat(found.getStock()).isEqualTo(10);
        assertThat(found.getSellerId()).isEqualTo(1L);
        assertThat(found.getSellerName()).isEqualTo("Coupang Seller");
    }

    @Test
    void findBySellerId_returns_products_for_that_seller_only() {
        repository.saveAll(List.of(
                Product.create(42L, "S42", "A", 100L, 1),
                Product.create(42L, "S42", "B", 200L, 2),
                Product.create(99L, "S99", "C", 300L, 3)
        ));

        List<Product> s42Products = repository.findBySellerId(42L);
        assertThat(s42Products).hasSize(2);
        assertThat(s42Products).extracting(Product::getName)
                .containsExactlyInAnyOrder("A", "B");
    }

    @Test
    void negative_price_is_rejected_by_factory() {
        assertThatThrownBy(() -> Product.create(1L, "S", "X", -1L, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void decreaseStock_reduces_stock() {
        Product product = Product.create(1L, "S", "X", 100L, 5);
        product.decreaseStock(2);
        assertThat(product.getStock()).isEqualTo(3);
    }

    @Test
    void decreaseStock_throws_when_insufficient() {
        Product product = Product.create(1L, "S", "X", 100L, 1);
        assertThatThrownBy(() -> product.decreaseStock(2))
                .isInstanceOf(IllegalStateException.class);
    }
}
