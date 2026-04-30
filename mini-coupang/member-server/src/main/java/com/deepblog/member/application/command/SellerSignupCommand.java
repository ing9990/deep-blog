package com.deepblog.member.application.command;

public record SellerSignupCommand(
    String email,
    String rawPassword,
    String businessName,
    String businessRegistrationNumber,
    String representativeName,
    String phoneNumber
) {}
