package com.deepblog.seller.common.idempotency;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 컨트롤러 메서드에 붙이면 {@code Idempotency-Key} HTTP 헤더로 재시도 중복 방지.
 * 동일 키 + 동일 경로의 첫 요청 응답을 Redis에 TTL로 저장하고, 이후 동일 키 재요청은 저장된 응답을 재사용한다.
 * 헤더가 없으면 멱등 처리 없이 그대로 통과한다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Idempotent {
}
