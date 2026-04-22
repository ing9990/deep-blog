package com.deepblog.seller.product.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.seller.common.auth.JwtProvider;
import com.deepblog.seller.entity.Seller;
import com.deepblog.seller.outbox.repository.OutboxEventRepository;
import com.deepblog.seller.product.entity.ProductStatus;
import com.deepblog.seller.product.repository.ProductRepository;
import com.deepblog.seller.repository.SellerRepository;
import com.deepblog.seller.store.entity.Store;
import com.deepblog.seller.store.repository.StoreRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Properties;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ProductCommandIntegrationTest {

    private static final String TOPIC = "seller.product";

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
        reg.add("seller.outbox.poll-delay-ms", () -> "500");
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired SellerRepository sellerRepository;
    @Autowired StoreRepository storeRepository;
    @Autowired ProductRepository productRepository;
    @Autowired OutboxEventRepository outboxEventRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtProvider jwtProvider;

    Long sellerId;
    Long storeId;
    String accessToken;

    @BeforeEach
    void setUp() {
        outboxEventRepository.deleteAll();
        productRepository.deleteAll();
        storeRepository.deleteAll();
        sellerRepository.deleteAll();

        Seller seller = sellerRepository.save(Seller.signUpAutoApproved(
            "seller@example.com",
            passwordEncoder.encode("password!23"),
            "브랜드",
            "000-00-00000",
            "대표",
            "010-0000-0000",
            null
        ));
        sellerId = seller.getId();

        Store store = storeRepository.save(Store.openNew(
            sellerId, "스토어", "store-" + sellerId, "desc", null, null
        ));
        storeId = store.getId();

        accessToken = jwtProvider.issueAccess(sellerId);
    }

    @Test
    void 상품_등록시_PRODUCT_REGISTERED_이벤트가_seller_product_토픽으로_발행된다() throws Exception {
        long productId = register("SKU-001", "티셔츠", 19900);

        assertThat(productRepository.count()).isEqualTo(1);
        assertOutboxContains("PRODUCT_REGISTERED");
        assertKafkaHasEvent("PRODUCT_REGISTERED", productId);
    }

    @Test
    void 상품_수정시_PRODUCT_UPDATED_이벤트가_발행된다() throws Exception {
        long productId = register("SKU-002", "원본", 10000);

        mvc.perform(patch("/api/seller/products/" + productId)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(APPLICATION_JSON)
                .content("{\"price\": 15000, \"name\": \"수정됨\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.price").value(15000))
            .andExpect(jsonPath("$.data.name").value("수정됨"));

        assertOutboxContains("PRODUCT_UPDATED");
        assertKafkaHasEvent("PRODUCT_UPDATED", productId);
    }

    @Test
    void 상품_삭제시_PRODUCT_DELETED_이벤트가_발행되고_soft_delete된다() throws Exception {
        long productId = register("SKU-003", "제거대상", 5000);

        mvc.perform(delete("/api/seller/products/" + productId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value(ProductStatus.DELETED.name()));

        assertThat(productRepository.findById(productId).orElseThrow().isDeleted()).isTrue();
        assertOutboxContains("PRODUCT_DELETED");
        assertKafkaHasEvent("PRODUCT_DELETED", productId);
    }

    @Test
    void 동일_IdempotencyKey로_등록_2회는_동일_응답이며_상품은_1개만_생성된다() throws Exception {
        String body = """
            {"categoryId":1,"sku":"SKU-IDEM","name":"멱등","price":9900}
            """;
        MvcResult first = mvc.perform(post("/api/seller/stores/" + storeId + "/products")
                .header("Authorization", "Bearer " + accessToken)
                .header("Idempotency-Key", "abc-123")
                .contentType(APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andReturn();

        MvcResult second = mvc.perform(post("/api/seller/stores/" + storeId + "/products")
                .header("Authorization", "Bearer " + accessToken)
                .header("Idempotency-Key", "abc-123")
                .contentType(APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andReturn();

        assertThat(first.getResponse().getContentAsString())
            .isEqualTo(second.getResponse().getContentAsString());
        assertThat(productRepository.count()).isEqualTo(1);
    }

    private long register(String sku, String name, long price) throws Exception {
        String body = String.format(
            "{\"categoryId\":1,\"sku\":\"%s\",\"name\":\"%s\",\"price\":%d}",
            sku, name, price
        );
        MvcResult result = mvc.perform(post("/api/seller/stores/" + storeId + "/products")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andReturn();
        JsonNode data = om.readTree(result.getResponse().getContentAsString()).get("data");
        return data.get("id").asLong();
    }

    private void assertOutboxContains(String eventType) {
        List<String> types = outboxEventRepository.findAll().stream()
            .map(e -> e.getEventType())
            .toList();
        assertThat(types).contains(eventType);
    }

    private void assertKafkaHasEvent(String eventType, long productId) {
        try (KafkaConsumer<String, String> consumer = newConsumer("it-" + eventType + "-" + productId)) {
            consumer.subscribe(Collections.singletonList(TOPIC));
            await().atMost(Duration.ofSeconds(15)).untilAsserted(() -> {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
                boolean hit = false;
                for (ConsumerRecord<String, String> r : records) {
                    if (r.value().contains("\"eventType\":\"" + eventType + "\"")) {
                        hit = true;
                        assertThat(r.key()).isEqualTo(storeId.toString());
                    }
                }
                assertThat(hit).isTrue();
            });
        }
    }

    private KafkaConsumer<String, String> newConsumer(String groupId) {
        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        return new KafkaConsumer<>(props);
    }
}
