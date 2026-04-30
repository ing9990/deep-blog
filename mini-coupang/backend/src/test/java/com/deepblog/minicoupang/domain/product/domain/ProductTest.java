package com.deepblog.minicoupang.domain.product.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;

class ProductTest {

    private static final Seller SELLER = Seller.builder().id(1L).build();

    @Test
    void create_valid_returnsActiveProduct() {
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
        assertThat(product.getStatus()).isEqualTo(ProductStatus.ACTIVE);
    }

    @Test
    void create_nullDescription_isAllowed() {
        Product product = Product.create(SELLER, 1L, "텀블러", null, 15_000L);

        assertThat(product.getDescription()).isNull();
    }

    @Test
    void create_nullSeller_throws() {
        assertThatThrownBy(() -> Product.create(null, 1L, "텀블러", "설명", 15_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("판매자");
    }

    @Test
    void create_nullCategoryId_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, null, "텀블러", "설명", 15_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("카테고리");
    }

    @Test
    void create_nullName_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, null, "설명", 15_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("상품명");
    }

    @Test
    void create_blankName_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, "   ", "설명", 15_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("상품명");
    }

    @Test
    void create_tooShortName_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, "a", "설명", 15_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("상품명");
    }

    @Test
    void create_tooLongName_throws() {
        String longName = "a".repeat(201);
        assertThatThrownBy(() -> Product.create(SELLER, 1L, longName, "설명", 15_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("상품명");
    }

    @Test
    void create_nullBasePrice_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, "텀블러", "설명", null))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("가격");
    }

    @Test
    void create_negativeBasePrice_throws() {
        assertThatThrownBy(() -> Product.create(SELLER, 1L, "텀블러", "설명", -1L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("가격");
    }

    @Test
    void create_zeroBasePrice_isAllowed() {
        Product product = Product.create(SELLER, 1L, "무료 샘플", "증정용", 0L);

        assertThat(product.getBasePrice()).isZero();
    }

    @Test
    void suspend_fromActive_movesToSuspended() {
        Product product = activeProduct();

        product.suspend();

        assertThat(product.getStatus()).isEqualTo(ProductStatus.SUSPENDED);
    }

    @Test
    void suspend_fromSuspended_throws() {
        Product product = activeProduct();
        product.suspend();

        assertThatThrownBy(product::suspend)
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("판매 중");
    }

    @Test
    void resume_fromSuspended_movesToActive() {
        Product product = activeProduct();
        product.suspend();

        product.resume();

        assertThat(product.getStatus()).isEqualTo(ProductStatus.ACTIVE);
    }

    @Test
    void resume_fromActive_throws() {
        Product product = activeProduct();

        assertThatThrownBy(product::resume)
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("정지");
    }

    @Test
    void markSoldOut_fromActive_movesToSoldOut() {
        Product product = activeProduct();

        product.markSoldOut();

        assertThat(product.getStatus()).isEqualTo(ProductStatus.SOLD_OUT);
    }

    @Test
    void markSoldOut_fromSuspended_throws() {
        Product product = activeProduct();
        product.suspend();

        assertThatThrownBy(product::markSoldOut)
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("판매 중");
    }

    @Test
    void addOption_valid_addedToOptions() {
        Product product = activeProduct();

        product.addOption("색상-빨강, 사이즈-M", "TUMBLER-RED-M", 1_000L);

        assertThat(product.getOptions()).hasSize(1);
        ProductOption option = product.getOptions().iterator().next();
        assertThat(option.getOptionName()).isEqualTo("색상-빨강, 사이즈-M");
        assertThat(option.getSku()).isEqualTo("TUMBLER-RED-M");
        assertThat(option.getAdditionalPrice()).isEqualTo(1_000L);
    }

    @Test
    void addOption_multipleDifferentSkus_allAdded() {
        Product product = activeProduct();

        product.addOption("빨강-M", "TUMBLER-RED-M", 1_000L);
        product.addOption("파랑-L", "TUMBLER-BLUE-L", 2_000L);

        assertThat(product.getOptions())
            .extracting(ProductOption::getSku)
            .containsExactly("TUMBLER-RED-M", "TUMBLER-BLUE-L");
    }

    @Test
    void addOption_duplicateSku_throws() {
        Product product = activeProduct();
        product.addOption("빨강-M", "TUMBLER-RED-M", 1_000L);

        assertThatThrownBy(() -> product.addOption("빨강-M-v2", "TUMBLER-RED-M", 1_500L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("SKU");
    }

    @Test
    void addOption_nullOptionName_throws() {
        Product product = activeProduct();

        assertThatThrownBy(() -> product.addOption(null, "TUMBLER-RED-M", 1_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("옵션명");
    }

    @Test
    void addOption_tooShortOptionName_throws() {
        Product product = activeProduct();

        assertThatThrownBy(() -> product.addOption("a", "TUMBLER-RED-M", 1_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("옵션명");
    }

    @Test
    void addOption_tooLongOptionName_throws() {
        Product product = activeProduct();
        String longName = "a".repeat(101);

        assertThatThrownBy(() -> product.addOption(longName, "TUMBLER-RED-M", 1_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("옵션명");
    }

    @Test
    void addOption_nullSku_throws() {
        Product product = activeProduct();

        assertThatThrownBy(() -> product.addOption("빨강-M", null, 1_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("SKU");
    }

    @Test
    void addOption_blankSku_throws() {
        Product product = activeProduct();

        assertThatThrownBy(() -> product.addOption("빨강-M", "   ", 1_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("SKU");
    }

    @Test
    void addOption_tooLongSku_throws() {
        Product product = activeProduct();
        String longSku = "S".repeat(51);

        assertThatThrownBy(() -> product.addOption("빨강-M", longSku, 1_000L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("SKU");
    }

    @Test
    void addOption_nullAdditionalPrice_throws() {
        Product product = activeProduct();

        assertThatThrownBy(() -> product.addOption("빨강-M", "TUMBLER-RED-M", null))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("추가 가격");
    }

    @Test
    void addOption_negativeAdditionalPrice_throws() {
        Product product = activeProduct();

        assertThatThrownBy(() -> product.addOption("빨강-M", "TUMBLER-RED-M", -1L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("추가 가격");
    }

    @Test
    void addOption_zeroAdditionalPrice_isAllowed() {
        Product product = activeProduct();

        product.addOption("기본", "TUMBLER-DEFAULT", 0L);

        assertThat(product.getOptions().iterator().next().getAdditionalPrice()).isZero();
    }

    @Test
    void addDefaultOption_addsOptionWithGeneratedSku() {
        Product product = activeProduct();

        ProductOption option = product.addDefaultOption();

        assertThat(product.getOptions()).hasSize(1);
        assertThat(option.getOptionName()).isEqualTo("기본");
        assertThat(option.getSku()).startsWith("DEFAULT-");
        assertThat(option.getAdditionalPrice()).isZero();
    }

    @Test
    void addDefaultOption_calledTwice_generatesDistinctSkus() {
        Product product = activeProduct();

        ProductOption first = product.addDefaultOption();
        ProductOption second = product.addDefaultOption();

        assertThat(first.getSku()).isNotEqualTo(second.getSku());
        assertThat(product.getOptions()).hasSize(2);
    }

    @Test
    void addImage_primary_isAddedAtOrderZero() {
        Product product = activeProduct();

        product.addImage("https://cdn.example.com/tumbler-main.jpg", true);

        assertThat(product.getImages()).hasSize(1);
        ProductImage image = product.getImages().get(0);
        assertThat(image.getUrl()).isEqualTo("https://cdn.example.com/tumbler-main.jpg");
        assertThat(image.isPrimary()).isTrue();
        assertThat(image.getOrdering()).isZero();
    }

    @Test
    void addImage_secondary_getsNextOrdering() {
        Product product = activeProduct();
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
        Product product = activeProduct();
        product.addImage("https://cdn.example.com/main.jpg", true);

        assertThatThrownBy(() -> product.addImage("https://cdn.example.com/another.jpg", true))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("대표 이미지");
    }

    @Test
    void addImage_nullUrl_throws() {
        Product product = activeProduct();

        assertThatThrownBy(() -> product.addImage(null, true))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("이미지");
    }

    @Test
    void addImage_blankUrl_throws() {
        Product product = activeProduct();

        assertThatThrownBy(() -> product.addImage("   ", true))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("이미지");
    }

    @Test
    void addImage_tooLongUrl_throws() {
        Product product = activeProduct();
        String longUrl = "https://cdn.example.com/" + "a".repeat(500);

        assertThatThrownBy(() -> product.addImage(longUrl, true))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRODUCT)
            .hasMessageContaining("이미지");
    }

    private static Product activeProduct() {
        return Product.create(SELLER, 1L, "텀블러", "설명", 15_000L);
    }
}
