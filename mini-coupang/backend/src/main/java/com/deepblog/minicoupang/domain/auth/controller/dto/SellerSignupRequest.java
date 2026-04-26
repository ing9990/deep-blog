package com.deepblog.minicoupang.domain.auth.controller.dto;

import com.deepblog.minicoupang.domain.seller.application.SellerSignupCommand;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SellerSignupRequest(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 8, max = 72) String password,
    @NotBlank @Size(min = 2, max = 100) String businessName,
    @NotBlank @Pattern(regexp = "\\d{10}", message = "사업자등록번호는 숫자 10자리여야 합니다.") String businessRegistrationNumber,
    @NotBlank @Size(min = 2, max = 50) String representativeName,
    @NotBlank @Pattern(regexp = "\\d{10,11}") String phoneNumber
) {
    public SellerSignupCommand toCommand() {
        return new SellerSignupCommand(email, password, businessName, businessRegistrationNumber,
            representativeName, phoneNumber);
    }
}
