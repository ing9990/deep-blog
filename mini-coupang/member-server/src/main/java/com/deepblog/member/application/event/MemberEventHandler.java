package com.deepblog.member.application.event;

import com.deepblog.common.event.EventTopic;
import com.deepblog.common.infrastructure.kafka.KafkaProducer;
import com.deepblog.common.util.JsonConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 회원/판매자 가입 이벤트를 commit 후 Kafka 로 발행한다 (트랜잭션 롤백 시 메시지 안 나감).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MemberEventHandler {

    private final KafkaProducer kafkaProducer;
    private final JsonConverter jsonConverter;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMemberSignedUp(MemberSignedUpEvent event) {
        String key = String.valueOf(event.getPayload().accountId());
        kafkaProducer.sendMessage(
            EventTopic.MEMBER_SIGNED_UP.getName(),
            key,
            jsonConverter.toJson(event),
            () -> log.error("member.signed-up publish failed. accountId={}", key)
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSellerSignedUp(SellerSignedUpEvent event) {
        String key = String.valueOf(event.getPayload().accountId());
        kafkaProducer.sendMessage(
            EventTopic.SELLER_SIGNED_UP.getName(),
            key,
            jsonConverter.toJson(event),
            () -> log.error("seller.signed-up publish failed. accountId={}", key)
        );
    }
}
