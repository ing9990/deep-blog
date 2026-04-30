# Kafka Topics

미니 쿠팡의 모든 Kafka 토픽과 메시지 규칙을 정리한 문서입니다.

## 개요

- 모든 메시지는 **at-least-once** 로 들어온다고 가정합니다. 같은 메시지가 두 번 와도 처리는 한 번만 일어나도록 컨슈머 측에서 멱등성을 보장합니다.
- 이벤트 1개 = 토픽 1개. 한 토픽에 여러 종류의 이벤트를 섞지 않습니다.
- 발행 시점은 원칙적으로 **AFTER_COMMIT** 입니다. 트랜잭션이 롤백되면 메시지도 나가지 않도록 `@TransactionalEventListener` 로 감쌉니다. 단, 결제 실패 보상(`order.payment-failed`) 처럼 트랜잭션 자체가 없는 경로에서는 `KafkaProducer` 를 직접 호출합니다.
- 모든 메시지의 본문은 표준 형태인 `EventMessage` 의 JSON String 직렬화 결과입니다.

## 메시지 형태 (`EventMessage`)

토픽이 다르더라도 메시지의 외형은 같습니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `eventId` | `long` | TSID 로 발급된 이벤트 식별자. 컨슈머 멱등성 키로 사용됩니다. |
| `eventType` | `String` | 이벤트 종류 (예: `ORDER_CONFIRMED`). 토픽이 이미 식별하지만 self-describing 차원에서 같이 싣습니다. |
| `occurredAt` | `LocalDateTime` | 발행 측 wall-clock 시각. 밀리초 단위. |
| `payload` | `JsonNode` | 토픽별 도메인 페이로드. 토픽마다 모양이 정해져 있습니다. |

## 네이밍 컨벤션

| 항목 | 규칙 | 예 |
|---|---|---|
| 토픽 | `<domain>.<event-past-tense>` 소문자 + kebab-case | `order.confirmed`, `order.payment-failed` |
| 재시도 | `<topic>-retry-<index>` | `order.confirmed-retry-0`, `order.confirmed-retry-1` |
| DLT | `<topic>-dlt` | `order.confirmed-dlt` |
| 메시지 키 | `String` 으로 도메인 ID (같은 키 → 같은 파티션 → 순서 보장) | `"42"` (orderId) |
| 메시지 값 | `EventMessage` 의 JSON String | `{"eventId":...,"eventType":...,"payload":{...}}` |

재시도/DLT 토픽은 Spring Kafka 의 `@RetryableTopic` 이 자동으로 만들어 둡니다. 일시적 처리 실패는 backoff 재시도로 흡수하고, 한도 초과 메시지는 `@DltHandler` 가 받는 DLT 토픽으로 격리해 본류 파티션의 컨슘 진행을 막지 않습니다.

## 토픽 매트릭스

5개 토픽 모두 한눈에 정리한 표입니다. 자세한 페이로드와 발행 맥락은 아래 섹션에서 다룹니다.

| 토픽 | 발행자 | 구독자 | 발행 시점 | 관련 Usecase |
|---|---|---|---|---|
| [`member.signed-up`](#membersigned-up) | 회원 서비스 | 알림 서비스 | 회원 가입 트랜잭션 commit 후 | [UC-01](Usecase.md#uc-01-회원가입-회원판매자) |
| [`seller.signed-up`](#sellersigned-up) | 회원 서비스 | 알림 서비스 | 판매자 가입 트랜잭션 commit 후 | [UC-01](Usecase.md#uc-01-회원가입-회원판매자) |
| [`order.confirmed`](#orderconfirmed) | 주문 서비스 | 상품 서비스, 알림 서비스 | 결제 성공 + 주문 영속화 commit 후 | [UC-02](Usecase.md#uc-02-상품-주문) |
| [`order.payment-failed`](#orderpayment-failed) | 주문 서비스 | 상품 서비스, 알림 서비스 | 결제 실패 직후 (트랜잭션 외부) | [UC-02](Usecase.md#uc-02-상품-주문) |
| [`payment.completed`](#paymentcompleted) | 결제 서비스 | 알림 서비스 | 결제 응답 commit 후 | [UC-02](Usecase.md#uc-02-상품-주문) |

## 토픽별 상세

### `member.signed-up`

회원이 새로 가입했음을 알리는 이벤트입니다. 회원 서비스가 `Account + Member` 를 같은 트랜잭션에 INSERT 한 뒤 commit 시점에 발행합니다. 알림 서비스 컨슈머가 받아 가입 환영 알림을 보냅니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `accountId` | `Long` | 새 계정 식별자 |
| `memberId` | `Long` | 새 회원 식별자 |
| `email` | `String` | 가입 이메일 |
| `signedUpAt` | `LocalDateTime` | 가입 처리 시각 |

### `seller.signed-up`

판매자 가입 이벤트입니다. 회원 가입과 모양은 같고 `Account + Seller` 가 같이 들어가며, 발행 흐름과 구독자도 동일합니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `accountId` | `Long` | 새 계정 식별자 |
| `sellerId` | `Long` | 새 판매자 식별자 |
| `email` | `String` | 가입 이메일 |
| `signedUpAt` | `LocalDateTime` | 가입 처리 시각 |

### `order.confirmed`

결제까지 성공한 주문이 영속화된 직후 발행되는 이벤트입니다. **상품 서비스 컨슈머**가 받아 MySQL `option_stock` 의 재고를 영구 차감하고, **알림 서비스 컨슈머**가 받아 주문 완료 알림을 보냅니다. Redis 의 선점 재고는 이미 결제 직전에 차감돼 있으므로 여기서는 영구 원장(MySQL) 으로 수렴시키는 작업만 합니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `orderId` | `Long` | 새로 만들어진 주문 식별자 |
| `memberId` | `Long` | 주문한 회원 식별자 |
| `optionId` | `Long` | 주문된 상품 옵션 식별자 |
| `quantity` | `Long` | 주문 수량 |
| `totalAmount` | `Long` | 결제 총액 |

### `order.payment-failed`

재고는 선점됐지만 결제에서 실패한 경우의 보상 이벤트입니다. 주문 서비스가 주문을 영속화하지 않고 보상 경로로 빠지므로 트랜잭션이 없습니다. 따라서 `KafkaProducer` 를 직접 호출해 발행합니다. **상품 서비스 컨슈머**가 받아 Redis 의 선점된 재고를 원복하고, **알림 서비스 컨슈머**가 결제 실패 알림을 보냅니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `memberId` | `Long` | 주문 시도자 회원 식별자 |
| `optionId` | `Long` | 선점된 옵션 식별자 |
| `quantity` | `Long` | 보상 대상 수량 (선점 시 차감했던 양 그대로) |
| `reason` | `String` | 결제 실패 사유 (`PAYMENT_DECLINED`, `PAYMENT_CALL_FAILED` 등) |

### `payment.completed`

결제 서비스가 결제 성공을 영속화한 뒤 발행하는 도메인 이벤트입니다. 알림 서비스가 결제 알림(영수증 등) 을 보냅니다. 주문 흐름은 `order.confirmed` 로 이미 진행되므로 `payment.completed` 의 구독은 알림 용도가 주된 사용처입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `paymentId` | `String` | 결제 식별자 |
| `orderRef` | `String` | 주문 참조 식별자 |
| `amount` | `Long` | 결제 금액 |

## 컨슈머 멱등성

같은 메시지가 두 번 들어와도 처리가 두 번 일어나지 않도록 모든 컨슈머는 `processed_events` 테이블을 함께 사용합니다.

- 처리 트랜잭션 안에서 가장 먼저 `processed_events(event_id, event_type)` 에 INSERT 합니다.
- 같은 `(event_id, event_type)` 조합으로 UNIQUE 제약이 걸려 있으므로 두 번째 INSERT 는 `DataIntegrityViolationException` 으로 거부됩니다.
- 컨슈머는 이 예외를 받아 "이미 처리된 메시지" 로 간주하고 조용히 스킵합니다. 같은 트랜잭션의 비즈니스 로직은 실행되지 않습니다.

이 패턴 덕분에 retry 토픽이나 컨슈머 재기동 후 오프셋 재처리 같은 상황에서도 도메인 상태가 두 번 바뀌지 않습니다.
