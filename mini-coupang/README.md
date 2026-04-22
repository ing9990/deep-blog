# mini-coupang

DEEP 블로그의 백엔드 샌드박스. drf-commerce 패턴을 참조한 3-서비스 멀티프로젝트.

## 구성

| 모듈 | 포트 | 역할 |
|---|---|---|
| `common-module` | (라이브러리) | EventEnvelope, CommonResponse, ErrorCodeSpec 등 세 서비스가 공유하는 프로토콜 타입 |
| `member-service` | 8081 | 회원 가입·로그인(JWT) |
| `seller-service` | 8082 | 판매자 로그인, 상품 등록/수정/삭제 |
| `product-service` | 8083 | 상품 전시, 재고, 카테고리 |

자세한 스택 계약·패키지 패턴·Kafka/Redis/Feign 패턴은 `.claude/skills/service-builder/references/project-architecture.md` 참조. 도메인 경계 결정 근거는 `docs/adr/` 참조.

## 도메인 결정 기록 (ADR)

| 번호 | 제목 | 상태 |
|---|---|---|
| [0001](docs/adr/0001-seller-store-product-boundary.md) | Seller / Store / Product 도메인 경계 | Accepted |

## 빌드

```bash
./gradlew build
```

## 실행 (로컬)

```bash
# 인프라 (Postgres×3 + Redis + Kafka + Zookeeper + 관측 스택)
docker compose up -d

# 서비스 (각각 별 터미널)
./gradlew :member-service:bootRun
./gradlew :seller-service:bootRun
./gradlew :product-service:bootRun
```

## 이벤트 파이프 (Outbox + Debezium)

seller-service는 상품 쓰기 커맨드에 대해 **Transactional Outbox** 패턴을 쓴다.

- `seller_products` INSERT/UPDATE와 **같은 트랜잭션**으로 `outbox_events` INSERT
- `outbox_events.aggregate_type` 값 (`seller.product`)이 그대로 **Kafka topic명**
- **운영**은 Debezium Outbox Event Router (Postgres logical replication → Kafka Connect → Kafka)
- **테스트·로컬**은 `OutboxRelay` 앱 폴러가 같은 결과를 냄 (`@Profile("!debezium")`로 분리)

### Debezium 등록 절차

```bash
docker compose up -d
bash scripts/register-debezium.sh              # 한 번만
curl http://localhost:8084/connectors/seller-outbox-connector/status | jq .
```

운영 프로파일로 서비스를 띄울 때는 OutboxRelay를 끄고 Debezium만 발행하도록:

```bash
SPRING_PROFILES_ACTIVE=debezium ./gradlew :seller-service:bootRun
```

### 토픽 / 키 / 계약

| aggregate_type (= topic) | 파티션 키 | 현재 eventType |
|---|---|---|
| `seller.product` | `storeId` | PRODUCT_REGISTERED / PRODUCT_UPDATED / PRODUCT_DELETED |

페이로드는 `EventEnvelope { eventId, eventType, payload }` JSON. **스키마 진화 규칙**:

- 필드 **추가만** 허용. 기본값이 null 허용.
- **필드 제거·타입 변경·이름 변경 금지**. 파괴적 변경 시 `seller.product.v2` 토픽 신설.
- consumer는 미지의 eventType을 무시(log debug)해야 한다. 이미 적용됨.

### Replay 전략

- Kafka `log.retention.hours=168` (7일). 보존 기간 내에서는 consumer group offset 리셋으로 재생.
- 7일 초과 데이터 backfill이 필요하면 seller-service에 `/internal/products/replay` 엔드포인트를 추가(미구현, Phase 4 승격 주제).

### Outbox cleanup

- `OutboxCleanup` 배치가 매일 03:00 KST에 `created_at < now() - 7 days` 행을 삭제.
- Debezium이 Kafka로 보낸 후 테이블 크기를 제한된 수준으로 유지.

## API 멱등성

`POST /api/seller/stores/{storeId}/products`, `PATCH /api/seller/products/{productId}`는 `Idempotency-Key` 헤더를 지원한다. 동일 키 + 동일 경로의 재요청은 24시간 동안 Redis에 저장된 첫 응답을 그대로 반환한다.

```bash
curl -X POST ... \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{...}'
```

## 관측 스택

각 서비스는 `/actuator/prometheus` 메트릭과 OTLP(4318) 트레이스를 내보낸다.

| 대상 | URL |
|---|---|
| Prometheus | http://localhost:9190 |
| Grafana (익명 admin) | http://localhost:3100 |
| Tempo 쿼리 API | http://localhost:3200 |

Grafana에는 Prometheus·Tempo datasource가 프로비저닝되어 있다. Explore 탭에서 바로 `http_server_requests_seconds_count` 같은 메트릭이나 `service.name="product-service"` 트레이스를 조회할 수 있다.

## 부하 테스트

k6는 `loadtest` compose profile로 실행한다. 자세한 명령은 [`loadtest/README.md`](loadtest/README.md) 참고.

```bash
K6_RUN_ID=2026-04-22-product-detail \
  docker compose --profile loadtest run --rm k6 run /scripts/product-detail.js
```

결과 JSON은 `loadtest/results/`에 떨어진다.

## 포트 할당

| 대상 | 포트 |
|---|---|
| member-service | 8081 |
| seller-service | 8082 |
| product-service | 8083 |
| postgres-member | 5442 |
| postgres-seller | 5443 |
| postgres-product | 5444 |
| redis | 6390 |
| kafka | 9092 |
| zookeeper | 2181 |
| prometheus | 9190 |
| grafana | 3100 |
| tempo (query) | 3200 |
| tempo (OTLP http/grpc) | 4318 / 4317 |
| kafka-connect (REST) | 8084 |

> 다른 로컬 프로젝트가 5432/6379를 점유 중이라 충돌을 피해 5442~5444, 6390으로 잡음.
