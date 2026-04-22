package com.deepblog.seller.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SellerSignupRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 64) String password,
    @NotBlank @Size(max = 100) String businessName,
    @NotBlank @Pattern(
        regexp = "\\d{3}-\\d{2}-\\d{5}",
        message = "사업자등록번호는 NNN-NN-NNNNN 형식이어야 합니다"
    ) String businessRegistrationNo,
    @NotBlank @Size(max = 100) String representativeName,
    @NotBlank @Size(max = 20) String contactPhone,
    @Size(max = 64) String settlementAccount
) {
}
