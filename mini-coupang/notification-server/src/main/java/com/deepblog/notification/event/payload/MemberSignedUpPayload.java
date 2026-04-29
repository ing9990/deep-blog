package com.deepblog.notification.event.payload;

import java.time.LocalDateTime;

public record MemberSignedUpPayload(
    Long accountId,
    Long memberId,
    String email,
    LocalDateTime signedUpAt
) {
}
