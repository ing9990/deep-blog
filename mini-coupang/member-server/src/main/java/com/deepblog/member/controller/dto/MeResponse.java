package com.deepblog.member.controller.dto;

import com.deepblog.member.application.result.MeResult;

public record MeResponse(Long accountId, String email, MemberBlock member, SellerBlock seller) {

    public record MemberBlock(Long memberId, String name, String phoneNumber, String nickname) {}
    public record SellerBlock(Long sellerId, String businessName, String businessRegistrationNumber,
                              String representativeName, String phoneNumber) {}

    public static MeResponse from(MeResult r) {
        MemberBlock mb = r.member() == null ? null
            : new MemberBlock(r.member().memberId(), r.member().name(),
                r.member().phoneNumber(), r.member().nickname());
        SellerBlock sb = r.seller() == null ? null
            : new SellerBlock(r.seller().sellerId(), r.seller().businessName(),
                r.seller().businessRegistrationNumber(), r.seller().representativeName(),
                r.seller().phoneNumber());
        return new MeResponse(r.accountId(), r.email(), mb, sb);
    }
}
