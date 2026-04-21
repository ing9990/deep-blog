package com.deepblog.minicoupang.domain.product.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateProductRequest(
        @Positive Long sellerId,
        @NotBlank @Size(max = 80) String sellerName,
        @NotBlank @Size(max = 200) String name,
        @PositiveOrZero long price,
        @PositiveOrZero int stock
) {}
