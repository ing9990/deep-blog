package com.deepblog.minicoupang.domain.order.application;

/**
 * read TX 결과. JPA 엔티티가 아닌 primitive/String 만 담아 트랜잭션 밖으로 안전하게 운반한다.
 */
public record OrderInputs(
    Long memberId,
    Long optionId,
    String optionSku,
    String optionName,
    long additionalPrice,
    Long productId,
    String productName,
    long basePrice
) {

    public long unitPrice() {
        return basePrice + additionalPrice;
    }
}
