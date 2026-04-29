package com.deepblog.member.application.result;

public record MeResult(
    Long accountId,
    String email,
    MemberInfo member,
    SellerInfo seller
) {
    public record MemberInfo(Long memberId, String name, String phoneNumber, String nickname) {}
    public record SellerInfo(Long sellerId, String businessName, String businessRegistrationNumber,
                             String representativeName, String phoneNumber) {}
}
