# Kafka Topics

미니쿠팡의 모든 Kafka 토픽과 메시지 규칙을 정리한 문서입니다.

## 개요

- 모든 메시지는 **at-least-once** 로 들어온다고 가정합니다. 같은 메시지가 두 번 와도 처리는 한 번만 일어나도록 컨슈머 측에서 멱등성을 보장합니다.
- **이벤트 1개 = 토픽 1개**. 한 토픽에 여러 종류의 이벤트를 섞지 않습니다.
- 발행은 **Outbox 패턴**으로 일원화돼 있습니다. 비즈니스 트랜잭션 안에서 `outbox_events` 테이블에 INSERT 하고, 별도 relay 가 폴링해 Kafka 로 전송합니다. 보상 경로(`order.payment-failed`) 도 같은 패턴을 씁니다.
- 메시지 본문은 발행자의 `BaseEvent` 가 JSON 으로 직렬화된 결과이며, 컨슈머는 표준 record `EventMessage` 로 받습니다.

---

## 발행 흐름 (Outbox Relay)

```
[비즈니스 TX]                                [Relay (200ms 폴링)]
DB 변경 + outbox_events INSERT      ─────►  미발행 행 SELECT (top 100, by id)
  │                                          │
  └─ 같은 트랜잭션이라 둘 다 commit            │ 한 건 send → ack 도착 시 published=true
                                             │ ack 실패 시 break (다음 tick 에 재시도)
                                             ▼
                                          Kafka broker
```

| 항목 | 내용 |
|---|---|
| 저장 컴포넌트 | `outbox.OutboxEventStore.save(topic, key, BaseEvent)` |
| 폴링 주기 | `@Scheduled(fixedDelayString = "${outbox.relay.fixed-delay-ms:200}")` |
| 한 번에 가져올 행 수 | `findTop100ByPublishedFalseOrderByIdAsc()` |
| 전송 | `KafkaTemplate.send(topic, key, payload).get(2s)` (sync ack 대기) |
| 실패 처리 | `published=false` 유지 → 다음 tick 에 동일 행 재시도 |
| 순서 보존 | batch 안의 한 건이라도 실패하면 break, 같은 messageKey 는 같은 파티션으로 묶임 |
| 중복 흡수 | ack 누락으로 같은 행이 두 번 나가도 컨슈머의 `processed_events` UNIQUE 가 차단 |

발행자 서비스는 `member`, `order`, `payment` 입니다. 알림 서비스는 consumer-only 라 outbox 가 없습니다.

---

## 메시지 형태

### 발행 측: `BaseEvent`

```java
abstract class BaseEvent<T> {
    long          eventId;     // TSID, 컨슈머 멱등성 키
    String        eventType;   // 예: "ORDER_CONFIRMED"
    LocalDateTime occurredAt;  // 발행자의 wall-clock (ms 단위)
    T             payload;     // 토픽별 도메인 페이로드
}
```

### 수신 측: `EventMessage`

```java
record EventMessage(long eventId, String eventType, JsonNode payload) {}
```

JSON 본문에는 `occurredAt` 도 함께 실려 있지만, 컨슈머는 `EventMessage` 로 deserialize 하면서 `eventId / eventType / payload` 셋만 사용합니다 (`occurredAt` 은 운영 추적용으로 남기는 정보).

---

## 네이밍 컨벤션

| 항목 | 규칙 | 예 |
|---|---|---|
| 토픽 | `<domain>.<event-past-tense>` 소문자 + kebab-case | `order.confirmed`, `order.payment-failed` |
| 재시도 | `<topic>-retry-<index>` (Spring Kafka 자동 생성) | `order.confirmed-retry-0` |
| DLT | `<topic>-dlt` | `order.confirmed-dlt` |
| 메시지 키 | `String` 으로 도메인 ID (같은 키 → 같은 파티션 → 순서 보장) | `"42"` (orderId) |
| 메시지 값 | `BaseEvent` 의 JSON 직렬화 결과 | `{"eventId":...,"eventType":...,"occurredAt":...,"payload":{...}}` |

재시도/DLT 토픽은 `@RetryableTopic` 이 자동으로 만듭니다. 일시적 처리 실패는 backoff 재시도로 흡수하고, 한도 초과 메시지는 `@DltHandler` 가 받는 DLT 로 격리해 본류 파티션의 컨슘 진행을 막지 않습니다.

---

## 토픽 매트릭스

| 토픽 | 발행자 | 구독자 | 메시지 키 | 발행 시점 | 관련 Usecase |
|---|---|---|---|---|---|
| [`member.signed-up`](#membersigned-up) | 회원 서비스 | 알림 서비스 | `accountId` | 회원 가입 TX (outbox) | [UC-01](Usecase.md#uc-01-회원가입-회원판매자) |
| [`seller.signed-up`](#sellersigned-up) | 회원 서비스 | 알림 서비스 | `accountId` | 판매자 가입 TX (outbox) | [UC-01](Usecase.md#uc-01-회원가입-회원판매자) |
| [`order.confirmed`](#orderconfirmed) | 주문 서비스 | 상품 서비스, 알림 서비스 | `orderId` | confirm 성공 TX (outbox) | [UC-02](Usecase.md#uc-02-상품-주문) |
| [`order.payment-failed`](#orderpayment-failed) | 주문 서비스 | 상품 서비스, 알림 서비스 | `optionId` | confirm 실패 TX (outbox) | [UC-02](Usecase.md#uc-02-상품-주문) |
| [`payment.completed`](#paymentcompleted) | 결제 서비스 | 알림 서비스 | `orderRef` | 결제 승인 TX (outbox) | [UC-02](Usecase.md#uc-02-상품-주문) |

---

## 토픽별 상세

### `member.signed-up`

회원이 새로 가입했음을 알리는 이벤트. `Account + Member` 가 같은 트랜잭션에 INSERT 된 뒤 같은 트랜잭션의 outbox 행으로 함께 들어가고, relay 가 발행합니다. 알림 서비스가 환영 알림을 보냅니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `accountId` | `Long` | 새 계정 식별자 |
| `memberId` | `Long` | 새 회원 식별자 |
| `email` | `String` | 가입 이메일 |
| `signedUpAt` | `LocalDateTime` | 가입 처리 시각 |

### `seller.signed-up`

판매자 가입 이벤트. 회원 가입과 모양이 같고 `Account + Seller` 가 같이 들어가며, 발행 흐름과 구독자도 동일합니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `accountId` | `Long` | 새 계정 식별자 |
| `sellerId` | `Long` | 새 판매자 식별자 |
| `email` | `String` | 가입 이메일 |
| `signedUpAt` | `LocalDateTime` | 가입 처리 시각 |

### `order.confirmed`

결제까지 성공한 주문이 영속화된 직후 발행되는 이벤트. **상품 서비스 컨슈머**가 받아 MySQL `option_stocks` 의 재고를 영구 차감하고, **알림 서비스 컨슈머**가 주문 완료 알림을 보냅니다. Redis 의 선점 재고는 결제 직전에 이미 차감돼 있으므로 여기서는 영구 원장(MySQL)으로 수렴시키는 작업만 합니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `orderId` | `Long` | 새로 만들어진 주문 식별자 (TSID) |
| `memberId` | `Long` | 주문한 회원 식별자 |
| `optionId` | `Long` | 주문된 상품 옵션 식별자 |
| `quantity` | `Long` | 주문 수량 |
| `totalAmount` | `Long` | 결제 총액 |

### `order.payment-failed`

재고는 선점됐지만 결제에서 실패한 경우의 보상 이벤트. `cancelOrder` 트랜잭션 안에서 주문을 `CANCELED` 로 전이하면서 같은 트랜잭션의 outbox 행으로 들어갑니다. **상품 서비스 컨슈머**가 받아 Redis 의 선점된 재고를 원복하고, **알림 서비스 컨슈머**가 결제 실패 알림을 보냅니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `memberId` | `Long` | 주문 시도자 회원 식별자 |
| `optionId` | `Long` | 선점된 옵션 식별자 |
| `quantity` | `Long` | 보상 대상 수량 (선점 시 차감했던 양 그대로) |
| `reason` | `String` | 결제 실패 사유 (`PAYMENT_DECLINED`, `PAYMENT_CALL_FAILED` 등) |

### `payment.completed`

결제 서비스가 결제 성공을 영속화한 뒤 발행하는 도메인 이벤트. 알림 서비스가 결제 알림(영수증 등) 을 보냅니다. 주문 흐름은 `order.confirmed` 로 이미 진행되므로 `payment.completed` 의 구독은 알림 용도가 주된 사용처입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `paymentId` | `String` | 결제 서비스 자체 식별자 (UUID) |
| `orderRef` | `String` | 주문 참조 식별자 (orderId 의 문자열) |
| `amount` | `Long` | 결제 금액 |

---

## 컨슈머 멱등성

같은 메시지가 두 번 들어와도 처리가 두 번 일어나지 않도록 모든 컨슈머는 자체 스키마의 `processed_events` 테이블을 함께 사용합니다.

- 처리 트랜잭션 안에서 가장 먼저 `processed_events(event_id, event_type)` 에 INSERT.
- 같은 `(event_id, event_type)` 조합에 UNIQUE 제약이 걸려 있으므로 두 번째 INSERT 는 `DataIntegrityViolationException` 으로 거부.
- 컨슈머는 이 예외를 받아 "이미 처리된 메시지" 로 간주하고 조용히 스킵. 같은 트랜잭션의 비즈니스 로직은 실행되지 않음.

이 패턴 덕분에 retry 토픽이나 컨슈머 재기동 후 오프셋 재처리 같은 상황에서도 도메인 상태가 두 번 바뀌지 않습니다.

`processed_events` 를 가진 서비스: `product-server`, `notification-server` (consumer-side 모두).
