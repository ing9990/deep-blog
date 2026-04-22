package com.deepblog.minicoupang.domain.product.seller.controller.dto;

import com.deepblog.minicoupang.domain.product.seller.application.RegisterProductCommand;
import com.deepblog.minicoupang.domain.product.seller.application.RegisterProductCommand.ImageCommand;
import com.deepblog.minicoupang.domain.product.seller.application.RegisterProductCommand.OptionCommand;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RegisterProductRequest(
    @NotNull(message = "카테고리는 필수입니다.")
    Long categoryId,

    @NotBlank(message = "상품명은 필수입니다.")
    @Size(min = 2, max = 200, message = "상품명은 2자 이상 200자 이하여야 합니다.")
    String name,

    @Size(max = 5000, message = "설명은 5000자 이하여야 합니다.")
    String description,

    @NotNull(message = "가격은 필수입니다.")
    @PositiveOrZero(message = "가격은 0 이상이어야 합니다.")
    Long basePrice,

    @Valid
    List<OptionRequest> options,

    @Valid
    List<ImageRequest> images
) {

    public RegisterProductCommand toCommand() {
        return new RegisterProductCommand(
            categoryId,
            name,
            description,
            basePrice,
            options == null ? null : options.stream().map(OptionRequest::toCommand).toList(),
            images == null ? null : images.stream().map(ImageRequest::toCommand).toList()
        );
    }

    public record OptionRequest(
        @NotBlank(message = "옵션명은 필수입니다.")
        @Size(min = 2, max = 100, message = "옵션명은 2자 이상 100자 이하여야 합니다.")
        String optionName,

        @NotBlank(message = "SKU는 필수입니다.")
        @Size(min = 2, max = 50, message = "SKU는 2자 이상 50자 이하여야 합니다.")
        String sku,

        @NotNull(message = "추가 가격은 필수입니다.")
        @PositiveOrZero(message = "추가 가격은 0 이상이어야 합니다.")
        Long additionalPrice
    ) {

        public OptionCommand toCommand() {
            return new OptionCommand(optionName, sku, additionalPrice);
        }
    }

    public record ImageRequest(
        @NotBlank(message = "이미지 URL은 필수입니다.")
        @Size(max = 500, message = "이미지 URL은 500자 이하여야 합니다.")
        String url,

        boolean primary
    ) {

        public ImageCommand toCommand() {
            return new ImageCommand(url, primary);
        }
    }
}
