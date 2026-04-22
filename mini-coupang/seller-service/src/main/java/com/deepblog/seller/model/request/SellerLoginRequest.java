package com.deepblog.seller.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SellerLoginRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 64) String password
) {
}
