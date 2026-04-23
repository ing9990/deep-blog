package com.deepblog.minicoupang.domain.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.minicoupang.domain.auth.domain.Account;
import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.product.application.port.out.EmbedPort;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchHit;
import com.deepblog.minicoupang.domain.product.application.port.out.dto.ProductSearchQuery;
import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import java.util.List;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SearchFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private SellerRepository sellerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private EmbedPort embedPort;

    private Long tumblerId;
    private Long bagId;
    private Long macId;
    private Long suspendedTumblerId;
    private Long soldOutTumblerId;

    @BeforeEach
    void prepareData() {
        productRepository.deleteAll();
        sellerRepository.deleteAll();
        accountRepository.deleteAll();

        Seller s1 = saveSeller("s1@test.local", "상점1", "1111111111");
        Seller s2 = saveSeller("s2@test.local", "상점2", "2222222222");

        tumblerId = productRepository.save(
            Product.create(s1, 1L, "프리미엄 텀블러", "보온 24시간 유지", 15_000L)).getId();
        bagId = productRepository.save(
            Product.create(s1, 5L, "여행용 백팩 가방", "대용량 수납", 50_000L)).getId();
        macId = productRepository.save(
            Product.create(s2, 2L, "맥북 프로 M5", "Apple 노트북", 2_500_000L)).getId();

        Product suspended = Product.create(s2, 1L, "정지된 텀블러", "회수", 9_000L);
        suspended.suspend();
        suspendedTumblerId = productRepository.save(suspended).getId();

        Product soldOut = Product.create(s2, 1L, "품절 텀블러", "재고 없음", 10_000L);
        soldOut.markSoldOut();
        soldOutTumblerId = productRepository.save(soldOut).getId();
    }

    @Test
    void search_combinesLexicalAndSemantic_excludesSuspendedAndSoldOut() throws Exception {
        given(embedPort.search(any())).willReturn(List.of(
            new ProductSearchHit(tumblerId, 0.9f),
            new ProductSearchHit(bagId, 0.6f)
        ));

        mockMvc.perform(get("/api/products/search").param("q", "텀블러"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[*].productId",
                Matchers.hasItem(tumblerId.intValue())))
            .andExpect(jsonPath("$.items[*].productId",
                Matchers.not(Matchers.hasItem(suspendedTumblerId.intValue()))))
            .andExpect(jsonPath("$.items[*].productId",
                Matchers.not(Matchers.hasItem(soldOutTumblerId.intValue()))))
            .andExpect(jsonPath("$.items[*].status",
                Matchers.everyItem(Matchers.is("ACTIVE"))));
    }

    @Test
    void search_priceFilter_dropsOutOfRangeLexicalHits() throws Exception {
        given(embedPort.search(any())).willReturn(List.of());

        mockMvc.perform(get("/api/products/search")
                .param("q", "텀블러")
                .param("min_price", "20000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.size").value(0));
    }

    @Test
    void search_forwardsFiltersToSemanticChannelWithDefaultActiveStatus() throws Exception {
        given(embedPort.search(any())).willReturn(List.of());

        mockMvc.perform(get("/api/products/search")
                .param("q", "noop")
                .param("category_id", "2")
                .param("min_price", "1000")
                .param("max_price", "3000000"))
            .andExpect(status().isOk());

        ArgumentCaptor<ProductSearchQuery> captor = ArgumentCaptor.forClass(ProductSearchQuery.class);
        verify(embedPort).search(captor.capture());
        ProductSearchQuery sent = captor.getValue();
        assertThat(sent.query()).isEqualTo("noop");
        assertThat(sent.filter().categoryId()).isEqualTo(2L);
        assertThat(sent.filter().minPrice()).isEqualTo(1_000L);
        assertThat(sent.filter().maxPrice()).isEqualTo(3_000_000L);
        assertThat(sent.filter().status()).isEqualTo("ACTIVE");
    }

    @Test
    void search_onlySemanticHits_returnsThemInRankOrder() throws Exception {
        // Lexical 매칭 0 (키워드는 없는 단어). semantic에만 등장하는 id도 결과에 포함되어야 한다.
        given(embedPort.search(any())).willReturn(List.of(
            new ProductSearchHit(macId, 0.95f),
            new ProductSearchHit(bagId, 0.7f)
        ));

        mockMvc.perform(get("/api/products/search").param("q", "zzzxxx").param("limit", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.size").value(2))
            .andExpect(jsonPath("$.items[0].productId").value(macId.intValue()))
            .andExpect(jsonPath("$.items[1].productId").value(bagId.intValue()));
    }

    private Seller saveSeller(String email, String businessName, String brn) {
        Account account = accountRepository.save(
            Account.create(email, passwordEncoder.encode("password123"))
        );
        return sellerRepository.save(Seller.create(
            account, businessName, brn, "대표자", "01012345678"
        ));
    }
}
