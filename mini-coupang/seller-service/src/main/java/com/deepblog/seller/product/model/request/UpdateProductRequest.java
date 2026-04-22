package com.deepblog.seller.product.model.request;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateProductRequest(
    Long categoryId,
    @Size(max = 200) String name,
    @Positive Long price,
    @Size(max = 500) String mainImageUrl
) {
}
