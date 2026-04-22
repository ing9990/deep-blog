package com.deepblog.minicoupang.domain.product.seller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepblog.minicoupang.domain.auth.context.SessionKeys;
import com.deepblog.minicoupang.domain.auth.domain.Account;
import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SellerProductFlowIntegrationTest {

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

    @BeforeEach
    void cleanDatabase() {
        productRepository.deleteAll();
        sellerRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    void register_asSeller_returns201WithDraftProduct() throws Exception {
        Long accountId = createSellerAccount("seller@example.com");
        MockHttpSession session = sessionFor(accountId);

        String body = """
            {
              "categoryId": 1,
              "name": "프리미엄 텀블러",
              "description": "보온 24시간",
              "basePrice": 15000,
              "options": [
                {"optionName": "빨강-M", "sku": "TUMBLER-RED-M", "additionalPrice": 1000}
              ],
              "images": [
                {"url": "https://cdn.example.com/main.jpg", "primary": true}
              ]
            }
            """;

        mockMvc.perform(post("/api/seller/products")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.productId").isNumber())
            .andExpect(jsonPath("$.name").value("프리미엄 텀블러"))
            .andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.optionCount").value(1))
            .andExpect(jsonPath("$.imageCount").value(1));
    }

    @Test
    void register_withoutOptionsAndImages_returns201() throws Exception {
        Long accountId = createSellerAccount("seller2@example.com");
        MockHttpSession session = sessionFor(accountId);

        String body = """
            {
              "categoryId": 1,
              "name": "텀블러",
              "description": "설명",
              "basePrice": 15000
            }
            """;

        mockMvc.perform(post("/api/seller/products")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.optionCount").value(0))
            .andExpect(jsonPath("$.imageCount").value(0));
    }

    @Test
    void register_notLoggedIn_returns401() throws Exception {
        String body = """
            {
              "categoryId": 1,
              "name": "텀블러",
              "description": "설명",
              "basePrice": 15000
            }
            """;

        mockMvc.perform(post("/api/seller/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void register_loggedInButNotSeller_returns404() throws Exception {
        Account account = accountRepository.save(
            Account.create("not-seller@example.com", passwordEncoder.encode("password123"))
        );
        MockHttpSession session = sessionFor(account.getId());

        String body = """
            {
              "categoryId": 1,
              "name": "텀블러",
              "description": "설명",
              "basePrice": 15000
            }
            """;

        mockMvc.perform(post("/api/seller/products")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("SELLER_NOT_REGISTERED"));
    }

    @Test
    void register_blankName_returns400() throws Exception {
        Long accountId = createSellerAccount("seller3@example.com");
        MockHttpSession session = sessionFor(accountId);

        String body = """
            {
              "categoryId": 1,
              "name": "",
              "description": "설명",
              "basePrice": 15000
            }
            """;

        mockMvc.perform(post("/api/seller/products")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void register_negativeBasePrice_returns400() throws Exception {
        Long accountId = createSellerAccount("seller4@example.com");
        MockHttpSession session = sessionFor(accountId);

        String body = """
            {
              "categoryId": 1,
              "name": "텀블러",
              "description": "설명",
              "basePrice": -1
            }
            """;

        mockMvc.perform(post("/api/seller/products")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    private Long createSellerAccount(String email) {
        Account account = accountRepository.save(
            Account.create(email, passwordEncoder.encode("password123"))
        );
        sellerRepository.save(Seller.create(
            account,
            "상점 " + account.getId(),
            String.format("%010d", account.getId() + 1_000_000_000L),
            "대표자",
            "01012345678"
        ));
        return account.getId();
    }

    private MockHttpSession sessionFor(Long accountId) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionKeys.AUTH_ACCOUNT_ID, accountId);
        return session;
    }
}
