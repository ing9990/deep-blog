package com.deepblog.minicoupang.domain.product.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductOption;
import com.deepblog.minicoupang.domain.product.domain.ProductStatus;
import com.deepblog.minicoupang.global.config.JpaConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Import(JpaConfig.class)
@ActiveProfiles("test")
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TestEntityManager em;

    @Test
    void save_thenFindById_restoresFields() {
        Product product = Product.create(1L, 1L, "텀블러", "보온 24h", 15_000L);

        Product saved = productRepository.save(product);
        em.flush();
        em.clear();

        Product found = productRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getSellerId()).isEqualTo(1L);
        assertThat(found.getCategoryId()).isEqualTo(1L);
        assertThat(found.getName()).isEqualTo("텀블러");
        assertThat(found.getDescription()).isEqualTo("보온 24h");
        assertThat(found.getBasePrice()).isEqualTo(15_000L);
        assertThat(found.getStatus()).isEqualTo(ProductStatus.DRAFT);
        assertThat(found.getCreatedAt()).isNotNull();
    }

    @Test
    void save_withOptions_cascadePersists() {
        Product product = Product.create(1L, 1L, "텀블러", "설명", 15_000L);
        product.addOption("빨강-M", "TUMBLER-RED-M", 1_000L);
        product.addOption("파랑-L", "TUMBLER-BLUE-L", 2_000L);

        Product saved = productRepository.save(product);
        em.flush();
        em.clear();

        Product found = productRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getOptions()).hasSize(2);
        assertThat(found.getOptions())
            .extracting(ProductOption::getSku)
            .containsExactlyInAnyOrder("TUMBLER-RED-M", "TUMBLER-BLUE-L");
    }

    @Test
    void save_withImages_cascadePersists() {
        Product product = Product.create(1L, 1L, "텀블러", "설명", 15_000L);
        product.addImage("https://cdn.example.com/main.jpg", true);
        product.addImage("https://cdn.example.com/side.jpg", false);

        Product saved = productRepository.save(product);
        em.flush();
        em.clear();

        Product found = productRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getImages()).hasSize(2);
    }

    @Test
    void removeOption_orphanRemovalDeletes() {
        Product product = Product.create(1L, 1L, "텀블러", "설명", 15_000L);
        product.addOption("빨강-M", "TUMBLER-RED-M", 1_000L);
        product.addOption("파랑-L", "TUMBLER-BLUE-L", 2_000L);
        Product saved = productRepository.save(product);
        em.flush();
        em.clear();

        Product loaded = productRepository.findById(saved.getId()).orElseThrow();
        loaded.getOptions().removeIf(o -> o.getSku().equals("TUMBLER-RED-M"));
        productRepository.save(loaded);
        em.flush();
        em.clear();

        Product reloaded = productRepository.findById(saved.getId()).orElseThrow();
        assertThat(reloaded.getOptions())
            .extracting(ProductOption::getSku)
            .containsExactly("TUMBLER-BLUE-L");
    }

    @Test
    void findBySellerId_returnsOnlyMatching() {
        productRepository.save(Product.create(10L, 1L, "A상품", "설명", 1_000L));
        productRepository.save(Product.create(10L, 1L, "B상품", "설명", 1_000L));
        productRepository.save(Product.create(20L, 1L, "C상품", "설명", 1_000L));
        em.flush();
        em.clear();

        assertThat(productRepository.findBySellerId(10L)).hasSize(2);
        assertThat(productRepository.findBySellerId(20L)).hasSize(1);
        assertThat(productRepository.findBySellerId(99L)).isEmpty();
    }

    @Test
    void findByCategoryId_returnsOnlyMatching() {
        productRepository.save(Product.create(1L, 100L, "A상품", "설명", 1_000L));
        productRepository.save(Product.create(1L, 100L, "B상품", "설명", 1_000L));
        productRepository.save(Product.create(1L, 200L, "C상품", "설명", 1_000L));
        em.flush();
        em.clear();

        assertThat(productRepository.findByCategoryId(100L)).hasSize(2);
        assertThat(productRepository.findByCategoryId(200L)).hasSize(1);
    }

    @Test
    void findByStatus_withPaging_returnsPage() {
        for (int i = 0; i < 5; i++) {
            Product draft = Product.create(1L, 1L, "초안 " + i, "설명", 1_000L);
            productRepository.save(draft);
        }
        Product selling = Product.create(1L, 1L, "판매중", "설명", 1_000L);
        selling.publish();
        productRepository.save(selling);
        em.flush();
        em.clear();

        Page<Product> page = productRepository.findByStatus(ProductStatus.DRAFT, PageRequest.of(0, 3));
        assertThat(page.getTotalElements()).isEqualTo(5);
        assertThat(page.getContent()).hasSize(3);
    }

    @Test
    void findBySellerIdAndStatus_returnsOnlyMatching() {
        Product a = Product.create(1L, 1L, "상품A", "설명", 1_000L);
        a.publish();
        Product b = Product.create(1L, 1L, "상품B", "설명", 1_000L);
        Product c = Product.create(2L, 1L, "상품C", "설명", 1_000L);
        c.publish();
        productRepository.save(a);
        productRepository.save(b);
        productRepository.save(c);
        em.flush();
        em.clear();

        assertThat(productRepository.findBySellerIdAndStatus(1L, ProductStatus.ON_SALE))
            .extracting(Product::getName)
            .containsExactly("상품A");
    }
}
