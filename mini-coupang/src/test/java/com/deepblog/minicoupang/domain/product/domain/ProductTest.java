package com.deepblog.minicoupang.domain.product.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.deepblog.minicoupang.domain.product.exception.InvalidProductException;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import org.junit.jupiter.api.Test;

class ProductTest {

    private static final Seller SELLER = Seller.builder().id(1L).build();

    @Test
    void create_valid_returnsDraftProduct() {
        Product product = Product.create(
            SELLER,
            1L,
            "프리미엄 텀블러",
            "보온 24시간 유지",
            15_000L
        );

        assertThat(product.getSeller()).isSameAs(SELLER);
        assertThat(product.getCategoryId()).isEqualTo(1L);
        assertThat(product.getName()).isEqualTo("프리미엄 텀블러");
        assertThat(product.getDescription()).isEqualTo("보온 24시간 유지");
        assertThat(product.getBasePrice()).isEqualTo(15_000L);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.DRAFT);
    }

    @Test
    void create_nullDescription_isAllowed() {
        Product product = Product.create(SELLER, 1L, "텀블러", null, 15_000L);

        assertThat(product.getDescription()).isNull();
    }

    @Test
    void create_nullSeller_throws() {
        assertThatThrownBy(() -> Product.create(null, 1L, "텀블러", "설명", 15_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("판매자");
    }

    @Test
    void create_nullCategoryId_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, null, "텀블러", "설명", 15_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("카테고리");
    }

    @Test
    void create_nullName_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, null, "설명", 15_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("상품명");
    }

    @Test
    void create_blankName_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, "   ", "설명", 15_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("상품명");
    }

    @Test
    void create_tooShortName_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, "a", "설명", 15_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("상품명");
    }

    @Test
    void create_tooLongName_throws() {
        String longName = "a".repeat(201);
        assertThatThrownBy(() -> Product.create(SELLER, 1L, longName, "설명", 15_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("상품명");
    }

    @Test
    void create_nullBasePrice_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, "텀블러", "설명", null))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("가격");
    }

    @Test
    void create_negativeBasePrice_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, "텀블러", "설명", -1L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("가격");
    }

    @Test
    void create_zeroBasePrice_isAllowed() {
        Product product = Product.create(SELLER, 1L, "무료 샘플", "증정용", 0L);

        assertThat(product.getBasePrice()).isZero();
    }

    @Test
    void publish_fromDraft_movesToOnSale() {
        Product product = draftProduct();

        product.publish();

        assertThat(product.getStatus()).isEqualTo(ProductStatus.ON_SALE);
    }

    @Test
    void publish_fromOnSale_throws() {
        Product product = draftProduct();
        product.publish();

        assertThatThrownBy(product::publish)
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("초안");
    }

    @Test
    void publish_fromSuspended_throws() {
        Product product = draftProduct();
        product.publish();
        product.suspend();

        assertThatThrownBy(product::publish)
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("초안");
    }

    @Test
    void suspend_fromOnSale_movesToSuspended() {
        Product product = draftProduct();
        product.publish();

        product.suspend();

        assertThat(product.getStatus()).isEqualTo(ProductStatus.SUSPENDED);
    }

    @Test
    void suspend_fromDraft_throws() {
        Product product = draftProduct();

        assertThatThrownBy(product::suspend)
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("판매 중");
    }

    @Test
    void resume_fromSuspended_movesToOnSale() {
        Product product = draftProduct();
        product.publish();
        product.suspend();

        product.resume();

        assertThat(product.getStatus()).isEqualTo(ProductStatus.ON_SALE);
    }

    @Test
    void resume_fromDraft_throws() {
        Product product = draftProduct();

        assertThatThrownBy(product::resume)
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("정지");
    }

    @Test
    void markSoldOut_fromOnSale_movesToSoldOut() {
        Product product = draftProduct();
        product.publish();

        product.markSoldOut();

        assertThat(product.getStatus()).isEqualTo(ProductStatus.SOLD_OUT);
    }

    @Test
    void markSoldOut_fromDraft_throws() {
        Product product = draftProduct();

        assertThatThrownBy(product::markSoldOut)
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("판매 중");
    }

    @Test
    void markSoldOut_fromSuspended_throws() {
        Product product = draftProduct();
        product.publish();
        product.suspend();

        assertThatThrownBy(product::markSoldOut)
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("판매 중");
    }

    @Test
    void addOption_valid_addedToOptions() {
        Product product = draftProduct();

        product.addOption("색상-빨강, 사이즈-M", "TUMBLER-RED-M", 1_000L);

        assertThat(product.getOptions()).hasSize(1);
        ProductOption option = product.getOptions().get(0);
        assertThat(option.getOptionName()).isEqualTo("색상-빨강, 사이즈-M");
        assertThat(option.getSku()).isEqualTo("TUMBLER-RED-M");
        assertThat(option.getAdditionalPrice()).isEqualTo(1_000L);
    }

    @Test
    void addOption_multipleDifferentSkus_allAdded() {
        Product product = draftProduct();

        product.addOption("빨강-M", "TUMBLER-RED-M", 1_000L);
        product.addOption("파랑-L", "TUMBLER-BLUE-L", 2_000L);

        assertThat(product.getOptions())
            .extracting(ProductOption::getSku)
            .containsExactly("TUMBLER-RED-M", "TUMBLER-BLUE-L");
    }

    @Test
    void addOption_duplicateSku_throws() {
        Product product = draftProduct();
        product.addOption("빨강-M", "TUMBLER-RED-M", 1_000L);

        assertThatThrownBy(() -> product.addOption("빨강-M-v2", "TUMBLER-RED-M", 1_500L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("SKU");
    }

    @Test
    void addOption_nullOptionName_throws() {
        Product product = draftProduct();

        assertThatThrownBy(() -> product.addOption(null, "TUMBLER-RED-M", 1_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("옵션명");
    }

    @Test
    void addOption_tooShortOptionName_throws() {
        Product product = draftProduct();

        assertThatThrownBy(() -> product.addOption("a", "TUMBLER-RED-M", 1_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("옵션명");
    }

    @Test
    void addOption_tooLongOptionName_throws() {
        Product product = draftProduct();
        String longName = "a".repeat(101);

        assertThatThrownBy(() -> product.addOption(longName, "TUMBLER-RED-M", 1_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("옵션명");
    }

    @Test
    void addOption_nullSku_throws() {
        Product product = draftProduct();

        assertThatThrownBy(() -> product.addOption("빨강-M", null, 1_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("SKU");
    }

    @Test
    void addOption_blankSku_throws() {
        Product product = draftProduct();

        assertThatThrownBy(() -> product.addOption("빨강-M", "   ", 1_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("SKU");
    }

    @Test
    void addOption_tooLongSku_throws() {
        Product product = draftProduct();
        String longSku = "S".repeat(51);

        assertThatThrownBy(() -> product.addOption("빨강-M", longSku, 1_000L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("SKU");
    }

    @Test
    void addOption_nullAdditionalPrice_throws() {
        Product product = draftProduct();

        assertThatThrownBy(() -> product.addOption("빨강-M", "TUMBLER-RED-M", null))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("추가 가격");
    }

    @Test
    void addOption_negativeAdditionalPrice_throws() {
        Product product = draftProduct();

        assertThatThrownBy(() -> product.addOption("빨강-M", "TUMBLER-RED-M", -1L))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("추가 가격");
    }

    @Test
    void addOption_zeroAdditionalPrice_isAllowed() {
        Product product = draftProduct();

        product.addOption("기본", "TUMBLER-DEFAULT", 0L);

        assertThat(product.getOptions().get(0).getAdditionalPrice()).isZero();
    }

    @Test
    void addImage_primary_isAddedAtOrderZero() {
        Product product = draftProduct();

        product.addImage("https://cdn.example.com/tumbler-main.jpg", true);

        assertThat(product.getImages()).hasSize(1);
        ProductImage image = product.getImages().get(0);
        assertThat(image.getUrl()).isEqualTo("https://cdn.example.com/tumbler-main.jpg");
        assertThat(image.isPrimary()).isTrue();
        assertThat(image.getOrdering()).isZero();
    }

    @Test
    void addImage_secondary_getsNextOrdering() {
        Product product = draftProduct();
        product.addImage("https://cdn.example.com/main.jpg", true);

        product.addImage("https://cdn.example.com/side.jpg", false);
        product.addImage("https://cdn.example.com/back.jpg", false);

        assertThat(product.getImages())
            .extracting(ProductImage::getOrdering)
            .containsExactly(0, 1, 2);
        assertThat(product.getImages())
            .extracting(ProductImage::isPrimary)
            .containsExactly(true, false, false);
    }

    @Test
    void addImage_secondPrimary_throws() {
        Product product = draftProduct();
        product.addImage("https://cdn.example.com/main.jpg", true);

        assertThatThrownBy(() -> product.addImage("https://cdn.example.com/another.jpg", true))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("대표 이미지");
    }

    @Test
    void addImage_nullUrl_throws() {
        Product product = draftProduct();

        assertThatThrownBy(() -> product.addImage(null, true))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("이미지");
    }

    @Test
    void addImage_blankUrl_throws() {
        Product product = draftProduct();

        assertThatThrownBy(() -> product.addImage("   ", true))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("이미지");
    }

    @Test
    void addImage_tooLongUrl_throws() {
        Product product = draftProduct();
        String longUrl = "https://cdn.example.com/" + "a".repeat(500);

        assertThatThrownBy(() -> product.addImage(longUrl, true))
            .isInstanceOf(InvalidProductException.class)
            .hasMessageContaining("이미지");
    }

    private static Product draftProduct() {
        return Product.create(SELLER, 1L, "텀블러", "설명", 15_000L);
    }
}
