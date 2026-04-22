package com.deepblog.seller.store.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateStoreRequest(
    @NotBlank @Size(min = 1, max = 100) String name,
    @NotBlank
    @Size(min = 3, max = 80)
    @Pattern(
        regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        message = "slug는 소문자/숫자/하이픈만 허용하며 하이픈 연속·양끝 하이픈은 불가"
    )
    String slug,
    @Size(max = 2000) String description,
    @Size(max = 500) String logoImageUrl,
    @Size(max = 500) String coverImageUrl
) {
}
