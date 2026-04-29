# Redis Keys

mini-coupang 이 Redis 에 SET 하는 키 정의.

## 1. 네이밍 컨벤션

| 항목 | 규칙 | 예 |
|---|---|---|
| 패턴 | `<purpose>:<entity>:<id>[:<sub>]` | `stock:option:42` |
| 구분자 | `:` (콜론) | |
| 대소문자 | 소문자 ASCII | |
| 첫 segment | 목적 (purpose) — `KEYS purpose:*` 스캔 / 모니터링 패턴이 깔끔해진다 | `stock`, `session`, `idem` |

## 2. Keys

| 키 패턴 | 타입 | TTL | 의미 | 소유 서비스 | 사용 명령 | Usecase |
|---|---|---|---|---|---|---|
| [`stock:option:{optionId}`](#stockoptionoptionid) | `String` (정수) | 영구 | 옵션 잔여 재고 | product-server | `EVAL` Lua (`GET`/`DECRBY`/`INCRBY`/`SET`) | [UC-10](Usecase.md#uc-10-상품-등록), [UC-11](Usecase.md#uc-11-주문-생성) |
| [`session:account:{accountId}`](#sessionaccountaccountid) | `Hash` | 30분 sliding | Spring Session 백킹 | member-server | `spring-session-data-redis` 자동 관리 | [UC-03](Usecase.md#uc-03-회원-로그인), [UC-04](Usecase.md#uc-04-판매자-로그인), [UC-06](Usecase.md#uc-06-내-정보-조회) |

## 3. 키 상세

### `stock:option:{optionId}`

옵션 SKU 단위 재고. 주문의 hot path 에서 atomic 차감/복구를 담당.

| 항목 | 값 |
|---|---|
| 키 예 | `stock:option:42` |
| 값 예 | `"100"` → `"98"` → `"96"` |
| 초기화 | 상품 등록 시 `setStock(optionId, initialStock)` ([UC-10](Usecase.md#uc-10-상품-등록)) |
| 차감 | `EVAL` Lua reserveStock — `GET → 검증 → DECRBY` 한 명령. 반환 `-1` (키 없음) / `-2` (재고 부족) / `0 이상` (남은 재고) |
| 복구 | `EVAL` Lua releaseStock — `GET → 검증 → INCRBY` |
| 정합성 | Redis 가 hot path 의 원장. MySQL `option_stock` 은 Kafka `order.confirmed` 이벤트로 수렴되는 보조 원장 |

### `session:account:{accountId}`

`spring-session-data-redis` 가 관리하는 사용자 세션 저장소.

| 항목 | 값 |
|---|---|
| 키 예 | `session:account:7` |
| 값 | 직렬화된 `HttpSession` 속성 (Spring 내부) |
| 갱신 | 매 요청마다 sliding 갱신 (TTL 30분) |
| 무효화 | 로그아웃 시 ([UC-05](Usecase.md#uc-05-로그아웃)) `DEL` |

## 4. 운영 / 디버깅

```bash
# 단일 옵션 재고 조회
redis-cli GET stock:option:42

# 모든 재고 키 (운영급은 SCAN 사용)
redis-cli --scan --pattern 'stock:option:*'

# 활성 세션 수
redis-cli --scan --pattern 'session:account:*' | wc -l
```
