package com.deepblog.member.application.command;

public record MemberSignupCommand(
    String email,
    String rawPassword,
    String name,
    String phoneNumber,
    String nickname
) {}
