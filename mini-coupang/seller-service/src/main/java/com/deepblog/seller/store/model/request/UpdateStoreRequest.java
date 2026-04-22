package com.deepblog.seller.store.model.request;

import jakarta.validation.constraints.Size;

public record UpdateStoreRequest(
    @Size(min = 1, max = 100) String name,
    @Size(max = 2000) String description,
    @Size(max = 500) String logoImageUrl,
    @Size(max = 500) String coverImageUrl
) {
}
