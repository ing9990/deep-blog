# Redis Keys 카탈로그

Redis 에 SET 가능한 모든 키를 한 곳에 등록한다. 새 키 패턴이 필요하면 이 표를 먼저 갱신한 뒤 코드에서 사용한다.

## 1. 네이밍 규칙

`<purpose>:<entity>:<id>[:<sub-purpose>]` 패턴.

- **purpose**: 목적 prefix (소문자). 예: `stock`, `lock`, `session`, `idem`.
- **entity**: 도메인 객체 종류 (소문자). 예: `option`, `order`, `member`.
- **id**: 식별자.
- **sub-purpose**: 필요 시 세부 분류 (선택).
- **구분자**: `:` (콜론). 점 / 슬래시 / 하이픈은 사용하지 않음.
- **소문자**, ASCII 만.

좋은 예: `stock:option:42`, `lock:option:42`, `session:account:7`
나쁜 예: `Stock-42`, `option:stock:42`, `STOCK_OPTION_42`

목적은 항상 첫 segment 에 둔다 (Redis 의 `KEYS purpose:*` 스캔 / Grafana 패턴 매칭이 쉬워짐).

## 2. 키 매트릭스 (현재 사용 중)

| 키 패턴 | 타입 | TTL | 값 의미 | 작성/사용 주체 | 사용 명령 | 상태 |
|---|---|---|---|---|---|---|
| `stock:option:{optionId}` | String (Long) | 없음 | 잔여 재고 수량 | 현재 backend → 목표 product-server | EVAL Lua: GET, DECRBY, INCRBY, SET | ✅ 사용 중 |
| `lock:option:{optionId}` | (Redisson 내부) | 자동 (lease) | Redisson 분산 락 | OrderServiceDistributedLock (`v1_deprecated/`) | Redisson `RLock` | 🟡 deprecated, 블로그 자산용 보존 |

## 3. 키별 상세

### `stock:option:{optionId}`

```
키 예: stock:option:42
값 예: "100" → "98" → "96" ...
```

- **소유**: product-server (현재 모놀리스 `backend/`).
- **목적**: 주문 생성 시 hot path 에서 atomic 재고 선점. MySQL `option_stock` 은 AFTER_COMMIT 이벤트로 수렴되는 보조 원장.
- **초기화**: 상품 등록 시 `setStock(optionId, initialStock)`. 시드 데이터 셋업도 동일.
- **차감**: `EVAL` Lua reserveStock — `GET → 검증 → DECRBY` 한 명령. 반환 -1 (키 없음) / -2 (재고 부족) / 0 이상 (남은 재고).
- **복구**: 결제 실패 보상 시 `EVAL` Lua releaseStock — `GET → 검증 → INCRBY`.
- **TTL**: 없음 (영구). 재고는 운영 데이터.
- **재해 복구**: Redis 가 사라지면 MySQL `option_stock` 으로부터 reseed (별도 운영 절차 필요).
- **트레이드오프**: Redis 단일 노드 장애 = 전체 주문 차단. Redis Sentinel / Cluster 도입은 보류 (sandbox).

### `lock:option:{optionId}` (deprecated)

```
키 예: lock:option:42
```

- **소유**: 없음 (deprecated). v1_deprecated 의 `OrderServiceDistributedLock` 만 사용.
- **목적**: 옵션 SKU 단위 분산 락 (PUB/SUB 알림 기반 Redisson 표준 구현).
- **현재 §4 (Lua + Saga)** 가 락 없이 같은 정합성을 달성하므로 운영 등록 안 됨. 블로그 §3 (분산 락) 자산으로만 보존.
- 신규 코드에서 사용 금지.

## 4. 향후 도입 후보 (📝)

마이그레이션 / 신규 기능에서 필요한 키들. 추가 시점에 본 문서 §2 로 승격.

| 키 패턴 | 타입 | TTL | 용도 | 단계 |
|---|---|---|---|---|
| `session:account:{accountId}` | Hash | 30분 (sliding) | Spring Session Redis 백킹. `HttpSession` 의 분산 저장소 | Phase 4 (member-server) |
| `processed-event:{eventId}` | String | 24시간 | (옵션) 짧은 시간 멱등성 캐시. 정식 멱등성은 MySQL `processed_events` 테이블 | 필요 시 |
| `idem:{scope}:{key}` | String | 24시간 | Idempotency-Key 헤더 기반 요청 dedup (Phase 6 게이트웨이) | Phase 6 |
| `rate:account:{accountId}` | String + INCR | 1분 (윈도우) | 사용자별 호출 빈도 제한 | 필요 시 |

## 5. 운영 / 디버깅

```bash
# 단일 옵션 재고 조회
redis-cli GET stock:option:42

# 모든 재고 키 조회 (작은 데이터셋에서만, 운영급은 SCAN 사용)
redis-cli KEYS 'stock:option:*'

# 옵션별 재고 일괄 (SCAN 패턴)
redis-cli --scan --pattern 'stock:option:*' | xargs -I {} sh -c 'echo "{} = $(redis-cli GET {})"'

# Lua 스크립트 직접 실행 (재고 차감)
redis-cli EVAL "$(cat - <<'EOF'
local current = redis.call('GET', KEYS[1])
if current == false then return -1 end
if tonumber(current) < tonumber(ARGV[1]) then return -2 end
return redis.call('DECRBY', KEYS[1], ARGV[1])
EOF
)" 1 stock:option:42 1
```

## 6. 새 키 추가 절차

1. 본 문서 §2 매트릭스에 행 추가 (또는 §4 후보에서 승격).
2. 키 패턴은 `<purpose>:<entity>:<id>` 컨벤션 준수.
3. 사용 명령 / TTL / 소유 서비스 명시.
4. 사용 코드는 prefix 를 `static final String` 상수로 분리 (예: `STOCK_KEY_PREFIX = "stock:option:"`).
5. 새 키 패턴이 다중 서비스에서 공유되면 prefix 상수를 `common-modules` 로 옮긴다.
