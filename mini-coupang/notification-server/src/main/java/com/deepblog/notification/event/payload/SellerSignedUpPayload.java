package com.deepblog.notification.event.payload;

import java.time.LocalDateTime;

public record SellerSignedUpPayload(
    Long accountId,
    Long sellerId,
    String email,
    LocalDateTime signedUpAt
) {
}
