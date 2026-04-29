# Kafka Topics

mini-coupang 의 모든 Kafka 토픽 정의.

## 1. 네이밍 컨벤션

| 항목 | 규칙 | 예 |
|---|---|---|
| Topic | `<domain>.<event-past-tense>` (소문자 + kebab-case) | `order.confirmed`, `order.payment-failed` |
| Retry | `<topic>-retry-<index>` | `order.confirmed-retry-0`, `order.confirmed-retry-1` |
| DLQ | `<topic>-dlt` | `order.confirmed-dlt` |
| Key | `String`. 도메인 ID (같은 키 → 같은 partition → 순서 보장) | `"42"` (orderId) |
| Value | JSON String (`EventEnvelope` 직렬화 결과) | `{"eventId":...,"eventType":...,"payload":{...}}` |

이벤트 1개 = 토픽 1개. 한 토픽에 여러 eventType 을 섞지 않는다.

## 2. EventEnvelope

모든 메시지의 표준 봉투.

| 필드 | 타입 | 설명 |
|---|---|---|
| `eventId` | `long` | TSID. consumer 멱등 키 |
| `eventType` | `String` | 이벤트 식별자 (e.g. `ORDER_CONFIRMED`) |
| `occurredAt` | `LocalDateTime` | 발행 측 wall-clock, 밀리초 |
| `payload` | `JsonNode` | 도메인별 record |

## 3. Topics

| Topic | Producer | Consumer | Trigger | Usecase |
|---|---|---|---|---|
| [`member.signed-up`](#membersigned-up) | member-server | notification-server | 회원 가입 트랜잭션 commit 후 | [UC-01](Usecase.md#uc-01-회원가입) |
| [`seller.signed-up`](#sellersigned-up) | member-server | notification-server | 판매자 가입 트랜잭션 commit 후 | [UC-02](Usecase.md#uc-02-판매자-가입) |
| [`order.confirmed`](#orderconfirmed) | order-server | product-server, notification-server | 결제 성공 + 주문 INSERT 트랜잭션 commit 후 | [UC-11](Usecase.md#uc-11-주문-생성) |
| [`order.payment-failed`](#orderpayment-failed) | order-server | product-server, notification-server | 결제 실패 시 (트랜잭션 외부) | [UC-11](Usecase.md#uc-11-주문-생성) |
| [`payment.completed`](#paymentcompleted) | payment-server | notification-server | 결제 성공 응답 직후 | [UC-11](Usecase.md#uc-11-주문-생성) |

## 4. Payload

### `member.signed-up`

| 필드 | 타입 | 설명 |
|---|---|---|
| `accountId` | `Long` | 계정 ID |
| `memberId` | `Long` | 회원 ID |
| `email` | `String` | 이메일 |
| `signedUpAt` | `LocalDateTime` | 가입 시각 |

### `seller.signed-up`

| 필드 | 타입 | 설명 |
|---|---|---|
| `accountId` | `Long` | 계정 ID |
| `sellerId` | `Long` | 판매자 ID |
| `email` | `String` | 이메일 |
| `signedUpAt` | `LocalDateTime` | 가입 시각 |

### `order.confirmed`

| 필드 | 타입 | 설명 |
|---|---|---|
| `orderId` | `Long` | 주문 ID |
| `memberId` | `Long` | 주문자 회원 ID |
| `optionId` | `Long` | 상품 옵션 ID |
| `quantity` | `Long` | 주문 수량 |
| `totalAmount` | `Long` | 결제 총액 |

### `order.payment-failed`

| 필드 | 타입 | 설명 |
|---|---|---|
| `memberId` | `Long` | 주문자 회원 ID |
| `optionId` | `Long` | 상품 옵션 ID |
| `quantity` | `Long` | 선점했던 수량 (보상 대상) |
| `reason` | `String` | 결제 실패 사유 |

### `payment.completed`

| 필드 | 타입 | 설명 |
|---|---|---|
| `paymentId` | `String` | 결제 ID |
| `orderRef` | `String` | 주문 참조 ID |
| `amount` | `Long` | 결제 금액 |

## 5. Consumer 멱등성

at-least-once 전제. 같은 메시지가 두 번 들어와도 처리는 한 번만 일어난다.

- Consumer 측 DB 에 `processed_events` 테이블 운영 (`UNIQUE(event_id, event_type)`).
- 처리 메서드는 같은 `@Transactional` 안에서 `processed_events` INSERT 를 먼저 한다.
- 중복이면 `DataIntegrityViolationException` → consumer 가 catch 해 스킵.
