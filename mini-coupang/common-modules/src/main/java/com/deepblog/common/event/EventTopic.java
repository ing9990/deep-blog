package com.deepblog.common.event;

/**
 * Kafka 토픽 enum. 카탈로그의 단일 출처는 {@code mini-coupang/Kafka-Topics.md}.
 * 새 토픽은 이 enum 갱신 + 카탈로그 갱신 + CONVENTIONS.md §9.7 갱신을 같이 한다.
 *
 * 패턴: <domain>.<event-past-tense> (kebab-case 다단어). 이벤트 1개 = 토픽 1개.
 */
public enum EventTopic {
    MEMBER_SIGNED_UP("member.signed-up"),
    SELLER_SIGNED_UP("seller.signed-up"),
    ORDER_CONFIRMED("order.confirmed"),
    ORDER_PAYMENT_FAILED("order.payment-failed"),
    PAYMENT_COMPLETED("payment.completed");

    private final String name;

    EventTopic(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
