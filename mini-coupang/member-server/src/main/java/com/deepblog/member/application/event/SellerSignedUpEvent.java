package com.deepblog.member.application.event;

import com.deepblog.common.event.BaseEvent;
import java.time.LocalDateTime;

public class SellerSignedUpEvent extends BaseEvent<SellerSignedUpEvent.Payload> {

    public SellerSignedUpEvent(Long accountId, Long sellerId, String email) {
        super(MemberEventType.SELLER_SIGNED_UP.name(),
              new Payload(accountId, sellerId, email, LocalDateTime.now()));
    }

    public record Payload(
        Long accountId,
        Long sellerId,
        String email,
        LocalDateTime signedUpAt
    ) {
    }
}
