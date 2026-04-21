package com.deepblog.minicoupang.domain.seller.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Java 17+ record를 DTO로 사용. 불변 + 자동 equals/hashCode/toString.
 */
public record CreateSellerRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Email @Size(max = 200) String email
) {}
