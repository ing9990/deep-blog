package com.deepblog.product.application.command;

import java.util.List;

public record RegisterProductCommand(
    Long categoryId,
    String name,
    String description,
    Long basePrice,
    List<OptionCommand> options,
    List<ImageCommand> images
) {

    public record OptionCommand(
        String optionName,
        String sku,
        Long additionalPrice,
        Long initialStock
    ) {
        public OptionCommand(String optionName, String sku, Long additionalPrice) {
            this(optionName, sku, additionalPrice, null);
        }

        public long resolvedInitialStock() {
            return initialStock != null ? initialStock : 0L;
        }
    }

    public record ImageCommand(String url, boolean primary) {}
}
