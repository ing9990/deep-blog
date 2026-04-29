# Redis Keys

미니 쿠팡이 Redis 에 저장하는 키와 운영 규칙을 정리한 문서입니다.

## 개요

- Redis 는 두 가지 책임을 동시에 맡습니다. 하나는 주문 hot path 의 **재고 1차 원장**, 다른 하나는 **세션 외부 저장소** 입니다.
- 재고 키는 직접 정의하고 Lua 스크립트로 다룹니다. 세션 키는 Spring Session Redis (`spring-session-data-redis`) 가 자동으로 만들고 갱신합니다.
- 두 책임 모두 동일한 Redis 인스턴스를 공유하지만, 키 prefix (`stock:` / `spring:session:`) 로 충돌하지 않습니다.

## 네이밍 컨벤션

직접 만드는 키는 다음 형태를 따릅니다.

| 항목 | 규칙 | 예 |
|---|---|---|
| 패턴 | `<purpose>:<entity>:<id>[:<sub>]` | `stock:option:42` |
| 구분자 | `:` (콜론) | |
| 대소문자 | 소문자 ASCII | |
| 첫 segment | 목적(purpose) 으로 시작합니다. `SCAN purpose:*` 같은 모니터링/정리 패턴이 깔끔해집니다. | `stock`, `idem` |

세션 키는 Spring Session Redis 가 `spring.session.redis.namespace = spring:session` 설정을 따라 `spring:session:sessions:{sessionId}` 형태로 자동 생성합니다. 직접 손대지 않습니다.

## 키 매트릭스

| 키 패턴 | 타입 | TTL | 용도 | 소유 서비스 | 사용 명령 |
|---|---|---|---|---|---|
| [`stock:option:{optionId}`](#stockoptionoptionid) | `String` (정수) | 영구 | 옵션 잔여 재고 | 상품 서비스 | `EVAL` Lua (`GET`/`DECRBY`/`INCRBY`/`SET`) |
| [`spring:session:sessions:{sessionId}`](#springsessionsessionssessionid) | `Hash` | 30분 sliding | Spring Session 외부 저장 | 회원 서비스 | `spring-session-data-redis` 자동 관리 |

## 키별 상세

### `stock:option:{optionId}`

옵션 SKU 단위의 잔여 재고입니다. 주문 hot path 에서 결제 호출 직전에 차감되고, 결제 실패 시 보상 경로로 다시 복구되는 Redis 의 **1차 원장** 입니다. MySQL `option_stock` 은 `order.confirmed` Kafka 이벤트를 받은 상품 서비스 컨슈머가 비동기로 수렴시키는 **보조 원장** 입니다. 동시 요청 환경에서 정합성을 보장하기 위해 모든 변경은 Lua 스크립트 안에서 원자적으로 일어납니다.

| 항목 | 값 |
|---|---|
| 키 예 | `stock:option:42` |
| 값 예 | `"100"` → `"98"` → `"96"` |
| 초기화 | 상품 등록 시 같은 트랜잭션 안에서 `setStock(optionId, initialStock)` ([UC-10](Usecase.md#uc-10-상품-등록)) |
| 차감 | `EVAL` Lua `reserveStock` — `GET → 검증 → DECRBY` 한 명령. 반환 `-1` (키 없음) / `-2` (재고 부족) / `0 이상` (남은 재고) |
| 복구 | `EVAL` Lua `releaseStock` — `GET → 검증 → INCRBY`. 결제 실패 보상 경로 ([UC-02](Usecase.md#uc-02-상품-주문)) |
| 정합성 | Redis 가 hot path 의 1차 원장. MySQL 은 `order.confirmed` 컨슈머를 통해 수렴되는 보조 원장 |

### `spring:session:sessions:{sessionId}`

`spring-session-data-redis` 가 자동으로 만들고 관리하는 사용자 세션 저장소입니다. WAS 자체는 stateless 로 두고 `HttpSession` 의 실 저장은 Redis 가 맡으므로, 어떤 회원 서비스 인스턴스로 라우팅돼도 같은 세션을 인식합니다.

| 항목 | 값 |
|---|---|
| 키 예 | `spring:session:sessions:7f3b2c8e-...` |
| 값 | 직렬화된 `HttpSession` 속성 (Spring 내부 포맷). `AUTH_ACCOUNT_ID` 등이 들어 있음 |
| 생성 | 로그인 시 ([UC-04](Usecase.md#uc-04-회원-로그인), [UC-05](Usecase.md#uc-05-판매자-로그인)) `request.getSession(true)` 호출과 함께 Spring Session 이 자동 생성 |
| 갱신 | 매 요청마다 sliding 갱신. TTL 30분 (`spring.session.timeout=30m`) |
| 무효화 | 로그아웃 시 ([UC-06](Usecase.md#uc-06-로그아웃)) `HttpSession.invalidate()` → 해당 키 `DEL` |

## 운영 / 디버깅

```bash
# 단일 옵션 재고 조회
redis-cli GET stock:option:42

# 재고 키 전체 (운영 환경에서는 KEYS 대신 SCAN 사용)
redis-cli --scan --pattern 'stock:option:*'

# 활성 세션 수
redis-cli --scan --pattern 'spring:session:sessions:*' | wc -l

# 특정 옵션 재고 직접 초기화 (긴급 운영용)
redis-cli SET stock:option:42 100
```
