package com.deepblog.minicoupang.domain.auth.controller.dto;

import com.deepblog.minicoupang.domain.member.application.MemberSignupCommand;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MemberSignupRequest(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 8, max = 72) String password,
    @NotBlank @Size(min = 2, max = 50) String name,
    @NotBlank @Pattern(regexp = "\\d{10,11}", message = "전화번호는 숫자 10~11자리여야 합니다.") String phoneNumber,
    @Size(min = 2, max = 30) String nickname
) {
    public MemberSignupCommand toCommand() {
        return new MemberSignupCommand(email, password, name, phoneNumber, nickname);
    }
}
