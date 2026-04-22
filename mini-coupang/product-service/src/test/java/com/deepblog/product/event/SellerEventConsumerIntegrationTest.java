package com.deepblog.product.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.common.event.EventEnvelope;
import com.deepblog.product.catalog.repository.CatalogProductRepository;
import com.deepblog.product.common.idempotency.ProcessedEventRepository;
import com.deepblog.product.event.payload.ProductRegisteredPayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class SellerEventConsumerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7").withExposedPorts(6379);

    @Container
    static KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.6.0")
    );

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry reg) {
        reg.add("spring.datasource.url", postgres::getJdbcUrl);
        reg.add("spring.datasource.username", postgres::getUsername);
        reg.add("spring.datasource.password", postgres::getPassword);
        reg.add("spring.data.redis.host", redis::getHost);
        reg.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        reg.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired KafkaTemplate<String, String> kafkaTemplate;
    @Autowired CatalogProductRepository catalogProductRepository;
    @Autowired ProcessedEventRepository processedEventRepository;

    @BeforeEach
    void cleanDb() {
        catalogProductRepository.deleteAll();
        processedEventRepository.deleteAll();
    }

    @Test
    void PRODUCT_REGISTERED_이벤트를_소비하면_CatalogProduct가_생성되고_조회된다() throws Exception {
        long productId = 9001L;
        long storeId = 1L;
        long categoryId = 1L;

        EventEnvelope envelope = new EventEnvelope(
            111L,
            "PRODUCT_REGISTERED",
            om.valueToTree(new ProductRegisteredPayload(
                productId, 10L, storeId, categoryId,
                "SKU-1", "티셔츠", 19900L, "KRW",
                null, "ON_SALE"
            ))
        );
        kafkaTemplate.send("seller.product", String.valueOf(storeId), om.writeValueAsString(envelope));

        await().atMost(Duration.ofSeconds(20))
            .until(() -> catalogProductRepository.findById(productId).isPresent());

        mvc.perform(get("/api/products/" + productId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(productId))
            .andExpect(jsonPath("$.data.name").value("티셔츠"))
            .andExpect(jsonPath("$.data.price").value(19900))
            .andExpect(jsonPath("$.data.status").value("ON_SALE"))
            .andExpect(jsonPath("$.data.categoryPath").value("/1/"));

        assertThat(processedEventRepository.count()).isEqualTo(1);
    }

    @Test
    void 동일한_eventId로_같은_이벤트를_두_번_보내도_멱등하게_한_번만_반영된다() throws Exception {
        long productId = 9002L;
        long storeId = 2L;

        EventEnvelope envelope = new EventEnvelope(
            222L,
            "PRODUCT_REGISTERED",
            om.valueToTree(new ProductRegisteredPayload(
                productId, 10L, storeId, 1L,
                "SKU-2", "양말", 3000L, "KRW",
                null, "ON_SALE"
            ))
        );
        String payload = om.writeValueAsString(envelope);

        kafkaTemplate.send("seller.product", String.valueOf(storeId), payload);
        await().atMost(Duration.ofSeconds(20))
            .until(() -> catalogProductRepository.findById(productId).isPresent());
        long countBefore = catalogProductRepository.count();

        kafkaTemplate.send("seller.product", String.valueOf(storeId), payload);
        Thread.sleep(2000);

        assertThat(catalogProductRepository.count()).isEqualTo(countBefore);
        assertThat(processedEventRepository.count()).isEqualTo(1);
    }
}
