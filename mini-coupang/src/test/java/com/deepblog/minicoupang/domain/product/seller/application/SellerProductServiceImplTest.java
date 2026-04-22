package com.deepblog.minicoupang.domain.product.seller.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.deepblog.minicoupang.domain.product.domain.Product;
import com.deepblog.minicoupang.domain.product.domain.ProductStatus;
import com.deepblog.minicoupang.domain.product.repository.ProductRepository;
import com.deepblog.minicoupang.domain.product.seller.application.RegisterProductCommand.ImageCommand;
import com.deepblog.minicoupang.domain.product.seller.application.RegisterProductCommand.OptionCommand;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.minicoupang.domain.seller.exception.SellerNotRegisteredException;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SellerProductServiceImplTest {

    private ProductRepository productRepository;
    private SellerRepository sellerRepository;
    private SellerProductServiceImpl service;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        sellerRepository = mock(SellerRepository.class);
        service = new SellerProductServiceImpl(productRepository, sellerRepository);

        when(productRepository.save(any(Product.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void registerProduct_valid_savesAndReturnsDraft() {
        Long accountId = 100L;
        Seller seller = mock(Seller.class);
        when(seller.getId()).thenReturn(42L);
        when(sellerRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));

        RegisterProductCommand command = new RegisterProductCommand(
            1L,
            "프리미엄 텀블러",
            "보온 24시간",
            15_000L,
            List.of(new OptionCommand("빨강-M", "TUMBLER-RED-M", 1_000L)),
            List.of(new ImageCommand("https://cdn.example.com/main.jpg", true))
        );

        Product result = service.registerProduct(accountId, command);

        assertThat(result.getSellerId()).isEqualTo(42L);
        assertThat(result.getCategoryId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("프리미엄 텀블러");
        assertThat(result.getStatus()).isEqualTo(ProductStatus.DRAFT);
        assertThat(result.getOptions()).hasSize(1);
        assertThat(result.getImages()).hasSize(1);
    }

    @Test
    void registerProduct_nullOptionsAndImages_createsEmptyProduct() {
        Long accountId = 100L;
        Seller seller = mock(Seller.class);
        when(seller.getId()).thenReturn(42L);
        when(sellerRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));

        RegisterProductCommand command = new RegisterProductCommand(
            1L, "텀블러", "설명", 15_000L, null, null
        );

        Product result = service.registerProduct(accountId, command);

        assertThat(result.getOptions()).isEmpty();
        assertThat(result.getImages()).isEmpty();
    }

    @Test
    void registerProduct_sellerNotRegistered_throws() {
        when(sellerRepository.findByAccountId(any())).thenReturn(Optional.empty());

        RegisterProductCommand command = new RegisterProductCommand(
            1L, "텀블러", "설명", 15_000L, List.of(), List.of()
        );

        assertThatThrownBy(() -> service.registerProduct(100L, command))
            .isInstanceOf(SellerNotRegisteredException.class)
            .hasMessageContaining("판매자");
    }

    @Test
    void registerProduct_multipleOptionsAndImages_allAdded() {
        Long accountId = 100L;
        Seller seller = mock(Seller.class);
        when(seller.getId()).thenReturn(42L);
        when(sellerRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));

        RegisterProductCommand command = new RegisterProductCommand(
            1L, "텀블러", "설명", 15_000L,
            List.of(
                new OptionCommand("빨강-M", "SKU-1", 1_000L),
                new OptionCommand("파랑-L", "SKU-2", 2_000L)
            ),
            List.of(
                new ImageCommand("https://cdn.example.com/main.jpg", true),
                new ImageCommand("https://cdn.example.com/side.jpg", false)
            )
        );

        Product result = service.registerProduct(accountId, command);

        assertThat(result.getOptions()).hasSize(2);
        assertThat(result.getImages()).hasSize(2);
    }
}
