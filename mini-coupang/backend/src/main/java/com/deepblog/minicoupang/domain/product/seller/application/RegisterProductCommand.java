package com.deepblog.minicoupang.domain.product.seller.application;

import java.util.List;

public record RegisterProductCommand(
    Long categoryId,
    String name,
    String description,
    Long basePrice,
    List<OptionCommand> options,
    List<ImageCommand> images
) {

    public record OptionCommand(String optionName, String sku, Long additionalPrice) {}

    public record ImageCommand(String url, boolean primary) {}
}
