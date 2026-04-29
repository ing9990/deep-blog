# Kafka Topics 카탈로그

mini-coupang 의 모든 Kafka 토픽을 한 곳에 등록한다. 새 토픽이 필요하면 이 표를 먼저 갱신한 뒤 `EventTopic` enum 을 추가한다.

## 1. 네이밍 규칙

`<domain>.<event-past-tense>` 패턴을 따른다 (Confluent / AsyncAPI / DDD 보편 컨벤션).

- **domain**: 소문자 단어 1~2개. 도메인 경계 = 토픽 prefix. 예: `order`, `member`, `payment`.
- **event**: 과거형 (이벤트는 "이미 발생한 사실"). 다단어는 kebab-case. 예: `confirmed`, `signed-up`, `payment-failed`.
- **구분자**: 도메인과 이벤트는 `.` (점), 이벤트 내 다단어는 `-` (하이픈).
- **소문자만**, 한국어/대문자/언더스코어 사용 금지.

좋은 예: `order.confirmed`, `order.payment-failed`, `member.signed-up`, `payment.completed`
나쁜 예: `OrderConfirmed`, `order_confirmed`, `order-confirmed-event`, `confirmed-order`

이벤트 1개 = 토픽 1개. 한 토픽에 여러 eventType 을 섞지 않는다 (consumer 가 자기가 필요한 토픽만 구독). 이는 drf-commerce 의 도메인 묶음 토픽 (`MEMBER`, `ORDER`) 패턴과 다른 선택이며, 이유는 §6 에서 설명.

## 2. 부속 토픽 (자동 생성)

각 토픽은 `@RetryableTopic` 으로 retry / DLT 토픽이 자동 파생된다.

| 자동 파생 | 패턴 | 예 |
|---|---|---|
| Retry | `<topic>-retry-<N>` | `order.confirmed-retry-0`, `order.confirmed-retry-1` |
| DLT (Dead Letter) | `<topic>-dlt` | `order.confirmed-dlt` |

retry 단계 수는 `@RetryableTopic(attempts = "3", ...)` 로 조절. 기본 3회.

## 3. 직렬화 / 메시지 모양

- key: `String` — 도메인 ID (예: `String.valueOf(orderId)`). 같은 키는 같은 partition → 순서 보장.
- value: `String` — JSON 문자열. `EventEnvelope` 형태로 직렬화.

```json
{
  "eventId": 472103847123450112,
  "eventType": "ORDER_CONFIRMED",
  "occurredAt": "2026-04-29T11:30:15.123",
  "payload": { "orderId": 42, "optionId": 100, "quantity": 2 }
}
```

- `eventId`: TSID (long). consumer 멱등성 키.
- `eventType`: enum 이름. **토픽이 이미 type 을 식별하므로 redundant** 하지만 self-describing 차원에서 유지.
- `occurredAt`: ISO local datetime, 밀리초.
- `payload`: 도메인별 record.

## 4. 토픽 매트릭스

| Topic | Producer | Consumer (group-id) | 페이로드 | 트리거 | 비고 |
|---|---|---|---|---|---|
| `member.signed-up` | member-server | notification-server | `{ accountId, memberId, email, signedUpAt }` | UC-01 회원가입 트랜잭션 commit 후 | 알림 발송 |
| `seller.signed-up` | member-server | notification-server | `{ accountId, sellerId, email, signedUpAt }` | UC-02 판매자 가입 트랜잭션 commit 후 | 알림 발송 |
| `order.confirmed` | order-server | product-server, notification-server | `{ orderId, optionId, quantity }` | UC-11 결제 성공 + Order INSERT 트랜잭션 commit 후 | product 가 MySQL 재고 영구 차감, notification 이 알림 발송 |
| `order.payment-failed` | order-server | product-server, notification-server | `{ optionId, quantity, reason }` | UC-11 결제 실패 시 (트랜잭션 외부, AFTER_COMMIT 동의어 없음) | product 가 Redis 재고 복구 (Saga 보상), notification 이 실패 알림 |
| `payment.completed` | payment-server | notification-server | `{ paymentId, orderRef, amount }` | UC-11 결제 성공 응답 직후 | 알림 발송 |

## 5. 도입 단계 (Phase)

| Phase | 토픽 | 상태 |
|---|---|---|
| Phase 0 | (없음) | ✅ 완료 |
| Phase 1 | (없음, notification-server consumer 골격만) | 🔄 다음 |
| Phase 2 | `payment.completed` | 📝 |
| Phase 3 | `order.confirmed`, `order.payment-failed` 를 product-server consumer 가 구독 | 📝 |
| Phase 4 | `member.signed-up`, `seller.signed-up` | 📝 |
| Phase 5 | `order.confirmed`, `order.payment-failed` 발행 측 (order-server) | 📝 |

## 6. 보류 / 비채택 결정

- **Schema Registry 미도입**: JSON 문자열 + payload record 호환성 규칙으로 처리. 운영급 진입 시 재검토.
- **Outbox 미도입**: producer 측 `@TransactionalEventListener(AFTER_COMMIT)` 로 충분. commit 후 크래시 시 메시지 유실 가능 (수용).
- **Exactly-once 미도입**: at-least-once + consumer 측 `processed_events` 멱등 테이블로 충족.
- **Avro / Protobuf 미도입**: 직렬화 단순성 우선.
- **drf-commerce 의 단일 도메인 토픽 (`order`, `member`) 미채택**: 이유는 (1) consumer 가 관심 없는 eventType 을 받아 필터링하는 비용, (2) topic-level retention/partitioning 차등 불가, (3) DLT 가 도메인 단위로 묶여 이벤트별 격리 어려움. 가독성 면에서 `order.confirmed` 가 직관적이라는 점도 영향.

## 7. 새 토픽 추가 절차

1. 본 문서 §4 매트릭스에 행 추가.
2. `common-modules` 의 `EventTopic` enum 에 상수 추가.
3. publisher 측: `<Domain>EventType` enum + `<Event> extends BaseEvent<...>` 추가, `@TransactionalEventListener` 핸들러 작성.
4. consumer 측: `event/payload/<Event>Payload.java` 신규, `@KafkaListener(topics = "...")` + `@RetryableTopic` 컨슈머 작성.
5. `Usecase.md` 의 트리거 usecase 가 있다면 그 다이어그램 갱신.
