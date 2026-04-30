package com.deepblog.member.application.event;

import com.deepblog.common.event.BaseEvent;
import java.time.LocalDateTime;

public class MemberSignedUpEvent extends BaseEvent<MemberSignedUpEvent.Payload> {

    public MemberSignedUpEvent(Long accountId, Long memberId, String email) {
        super(MemberEventType.MEMBER_SIGNED_UP.name(),
              new Payload(accountId, memberId, email, LocalDateTime.now()));
    }

    public record Payload(
        Long accountId,
        Long memberId,
        String email,
        LocalDateTime signedUpAt
    ) {
    }
}
