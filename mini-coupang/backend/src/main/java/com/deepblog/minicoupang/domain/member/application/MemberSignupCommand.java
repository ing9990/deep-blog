package com.deepblog.minicoupang.domain.member.application;

public record MemberSignupCommand(
    String email,
    String rawPassword,
    String name,
    String phoneNumber,
    String nickname
) {}
