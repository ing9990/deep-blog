package com.deepblog.minicoupang.domain.product.seller.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.deepblog.minicoupang.domain.product.application.event.ProductRegistered;
import com.deepblog.minicoupang.domain.product.domain.Product;
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
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

class SellerProductServiceTest {

    private ProductRepository productRepository;
    private SellerRepository sellerRepository;
    private ApplicationEventPublisher eventPublisher;
    private SellerProductService service;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        sellerRepository = mock(SellerRepository.class);
        eventPublisher = mock(ApplicationEventPublisher.class);
        service = new SellerProductService(productRepository, sellerRepository, eventPublisher);

        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product persisted = invocation.getArgument(0);
            ReflectionTestUtils.setField(persisted, "id", 99L);
            return persisted;
        });
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

        RegisterProductResult result = service.registerProduct(accountId, command);

        assertThat(result.sellerId()).isEqualTo(42L);
        assertThat(result.categoryId()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("프리미엄 텀블러");
        assertThat(result.status()).isEqualTo("ACTIVE");
        assertThat(result.optionCount()).isEqualTo(1);
        assertThat(result.imageCount()).isEqualTo(1);
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

        RegisterProductResult result = service.registerProduct(accountId, command);

        assertThat(result.optionCount()).isZero();
        assertThat(result.imageCount()).isZero();
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

        verify(eventPublisher, never()).publishEvent(any(ProductRegistered.class));
    }

    @Test
    void registerProduct_valid_publishesProductRegisteredEvent() {
        Long accountId = 100L;
        Seller seller = mock(Seller.class);
        when(seller.getId()).thenReturn(42L);
        when(sellerRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));

        RegisterProductCommand command = new RegisterProductCommand(
            1L, "텀블러", "보온 24시간", 15_000L, List.of(), List.of()
        );

        service.registerProduct(accountId, command);

        ArgumentCaptor<ProductRegistered> captor = ArgumentCaptor.forClass(ProductRegistered.class);
        verify(eventPublisher).publishEvent(captor.capture());
        ProductRegistered event = captor.getValue();
        assertThat(event.productId()).isEqualTo(99L);
        assertThat(event.name()).isEqualTo("텀블러");
        assertThat(event.description()).isEqualTo("보온 24시간");
        assertThat(event.categoryId()).isEqualTo(1L);
        assertThat(event.basePrice()).isEqualTo(15_000L);
        assertThat(event.status()).isEqualTo("ACTIVE");
        assertThat(event.sellerId()).isEqualTo(42L);
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

        RegisterProductResult result = service.registerProduct(accountId, command);

        assertThat(result.optionCount()).isEqualTo(2);
        assertThat(result.imageCount()).isEqualTo(2);
    }
}
