package com.deepblog.minicoupang.domain.product.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import org.junit.jupiter.api.Test;

class OptionStockTest {

    @Test
    void forOption_valid_returnsStockWithGivenQuantity() {
        OptionStock stock = OptionStock.forOption(42L, 100L);

        assertThat(stock.getOptionId()).isEqualTo(42L);
        assertThat(stock.getQuantity()).isEqualTo(100L);
    }

    @Test
    void forOption_nullOptionId_throws() {
        assertThatThrownBy(() -> OptionStock.forOption(null, 100L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_STOCK)
            .hasMessageContaining("옵션");
    }

    @Test
    void forOption_zeroOptionId_throws() {
        assertThatThrownBy(() -> OptionStock.forOption(0L, 100L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_STOCK)
            .hasMessageContaining("옵션");
    }

    @Test
    void forOption_negativeInitialQuantity_throws() {
        assertThatThrownBy(() -> OptionStock.forOption(42L, -1L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_STOCK)
            .hasMessageContaining("재고");
    }

    @Test
    void forOption_zeroInitialQuantity_isAllowed() {
        OptionStock stock = OptionStock.forOption(42L, 0L);

        assertThat(stock.getQuantity()).isZero();
    }

    @Test
    void decrease_valid_reducesQuantity() {
        OptionStock stock = OptionStock.forOption(42L, 100L);

        stock.decrease(1L);

        assertThat(stock.getQuantity()).isEqualTo(99L);
    }

    @Test
    void decrease_zero_throws() {
        OptionStock stock = OptionStock.forOption(42L, 100L);

        assertThatThrownBy(() -> stock.decrease(0L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_STOCK)
            .hasMessageContaining("차감");
    }

    @Test
    void decrease_negative_throws() {
        OptionStock stock = OptionStock.forOption(42L, 100L);

        assertThatThrownBy(() -> stock.decrease(-1L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_STOCK)
            .hasMessageContaining("차감");
    }

    @Test
    void decrease_exceedsQuantity_throwsInsufficient() {
        OptionStock stock = OptionStock.forOption(42L, 100L);

        assertThatThrownBy(() -> stock.decrease(101L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_STOCK)
            .hasMessageContaining("재고");
    }

    @Test
    void decrease_exactQuantity_isAllowed() {
        OptionStock stock = OptionStock.forOption(42L, 100L);

        stock.decrease(100L);

        assertThat(stock.getQuantity()).isZero();
    }

    @Test
    void increase_valid_addsQuantity() {
        OptionStock stock = OptionStock.forOption(42L, 100L);

        stock.increase(50L);

        assertThat(stock.getQuantity()).isEqualTo(150L);
    }

    @Test
    void increase_zero_throws() {
        OptionStock stock = OptionStock.forOption(42L, 100L);

        assertThatThrownBy(() -> stock.increase(0L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_STOCK)
            .hasMessageContaining("입고");
    }

    @Test
    void increase_negative_throws() {
        OptionStock stock = OptionStock.forOption(42L, 100L);

        assertThatThrownBy(() -> stock.increase(-1L))
            .isInstanceOf(BusinessException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_STOCK)
            .hasMessageContaining("입고");
    }
}
