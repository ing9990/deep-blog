# 미니쿠팡 (Mini Coupang)

> 미니쿠팡은 **대규모 트래픽과 높은 동시성을 가정**하고 회원, 상품, 주문, 결제, 알림을 마이크로 서비스로 분리해 동기 호출(REST, gRPC)과 비동기 이벤트(
> Kafka)로 **재고 정합성, 결제 실패 보상, 컨슈머 멱등성**까지 다루는 이커머스 백엔드 사이드 프로젝트입니다.

---

## 기술 포인트

- **Choreography Saga 보상 트랜잭션**
    - 블로그: https://deep.ing9990.com/posts/mini-coupang-distributed-stock-consistency
    - 결제 실패 시 `order.payment-failed` 이벤트를 발행해 상품 서비스 컨슈머가 선점 재고를 비동기로 복구.
    - 주문 서비스가 보상 경로를 직접 호출하지 않고 broker가 흐름의 책임을 가짐.

- **분산 환경에서 정렬 가능한 ID 생성**
    - 블로그: https://deep.ing9990.com/posts/mini-coupang-tsid-distributed-id
    - 자동 증가 ID는 분산 환경에서 충돌하고 UUID는 클러스터 인덱스 단편화를 일으킴.
    - TSID로 시간 기준 정렬과 분산 생성을 동시에 만족.

- **원자적 재고 선점**
    - 상품 서비스가 Redis Lua 스크립트로 `GET → 검증 → DECRBY`를 단일 명령에 묶어, 네트워크 왕복 없이 동시 요청 환경에서도 재고 정합성을 보장.

- **Outbox 패턴으로 이벤트 신뢰성 확보**
    - 비즈니스 트랜잭션 안에서 `outbox_events` 행을 INSERT, 별도 relay (`@Scheduled` 200ms)가 미발행 행을 폴링해 Kafka로 전송하고
      ack 도착 시에만 `published=true` 표시.
    - DB commit과 Kafka 발행이 원자적으로 묶여, 네트워크 장애로 인한 발행 누락이 없음.

- **컨슈머 멱등성**
    - 모든 Kafka 컨슈머가 처리 트랜잭션 안에서 `processed_events(event_id, event_type)` UNIQUE에 INSERT.
    - 같은 이벤트가 재전송돼도 두 번째 INSERT가 즉시 거부돼 비즈니스 로직이 두 번 실행되지 않음.

- **재시도 + DLT 격리**
    - `@RetryableTopic`으로 일시적 네트워크/처리 실패에 backoff 재시도를 구성.
    - 모두 실패하면 `@DltHandler`가 dead-letter topic으로 옮겨 본류 파티션의 진행을 막지 않음.

- **Stateless 서비스 + 외부 세션 저장소**
    - WAS 자체는 stateless. `HttpSession`의 실 저장은 Spring Session Redis(`spring:session:sessions:{id}`)가
      맡음.
    - 어떤 인스턴스로 라우팅돼도 같은 세션을 인식하므로 수평 확장에 부담이 없음.

- **Port-And-Adapter 격리**
    - 외부 호출(Feign, Kafka, gRPC)을 도메인이 직접 다루지 않고 `application/port/out` 인터페이스에만 의존.
    - 통신 수단이 바뀌어도 도메인 코드는 그대로 두고 어댑터만 교체.

---

## 문서

| 문서                                                                         | 내용                                                 |
|----------------------------------------------------------------------------|----------------------------------------------------|
| [ERD (dbdiagram.io)](https://dbdiagram.io/d/미니쿠팡-69f4d386ddb9320fdcad3675) | DB 다이어 그램                                          |
| [Usecase.md](Usecase.md)                                                   | 서비스별 유스케이스 표 + 회원가입 / 상품 주문 / 상품 검색 흐름 다이어그램       |
| [Kafka-Topics.md](Kafka-Topics.md)                                         | 토픽 매트릭스, `EventMessage` 형태, Outbox 발행 / 컨슈머 멱등성 규칙 |
| [Redis-Keys.md](Redis-Keys.md)                                             | 키 패턴, 타입, TTL, 사용 명령                               |

---

## 모듈 구조

```
mini-coupang/
├── common-modules/        # 공유 라이브러리 (BaseEntity, ErrorCode, EventTopic, KafkaProducer, JsonConverter, TsidGenerator)
│
├── member-server/         # 회원 / 인증 / 세션 (8081)
├── product-server/        # 상품 / 카테고리 / 재고 / 검색 (8082)
├── payment-server/        # 결제 (Toss PG 연동) (8083)
├── order-server/          # 주문 오케스트레이션 (8084)
├── notification-server/   # 알림 (consumer-only) (8085)
│
├── ml/                    # Python gRPC 서비스 (bge-m3 임베딩 + Qdrant 클라이언트)
├── integration-test/      # 멀티 서비스 통합 테스트 (재고 보상, 동시성 시나리오)
│
└── shared/
    ├── docker/            # docker-compose (Kafka KRaft + MySQL × 5 schemas + Redis + Qdrant + Prometheus + Grafana)
    ├── proto/             # gRPC .proto 정의
    └── k6/                # 부하 시나리오 (상품 등록 / 검색)
```

---

## 기술 스택

| Category        | Stack                                                      |
|-----------------|------------------------------------------------------------|
| Language        | Java 21 / Python 3.11 (ml)                                 |
| Framework       | Spring Boot 3.5.9 · Spring Cloud OpenFeign 2025.0.0 · gRPC |
| Database        | MySQL 8.4 (서비스별 스키마 분리)                                    |
| Cache / 세션 / 재고 | Redis 7 · Lua Script · Spring Session Redis                |
| Vector Search   | Qdrant 1.12 · bge-m3 (sentence embedding)                  |
| Message Broker  | Apache Kafka (KRaft 단일 노드, JSON String) · Outbox Relay     |
| 인증              | HttpSession + Spring Session Redis 외부 저장 · BCrypt          |
| ID 생성           | TSID Creator (이벤트 ID, 주문 PK)                               |
| Observability   | Prometheus · Grafana · Spring Actuator                     |
| Build           | Gradle Multi-project (Groovy DSL)                          |

---

## 실행

```bash
# 1) 인프라 (Kafka KRaft + MySQL × 5 schemas + Redis + Qdrant + Prometheus + Grafana)
cd mini-coupang/shared/docker
docker compose up -d

# 2) 서비스 5종 (각각 별도 셸에서)
./gradlew :member-server:bootRun        # :8081
./gradlew :product-server:bootRun       # :8082
./gradlew :payment-server:bootRun       # :8083
./gradlew :order-server:bootRun         # :8084
./gradlew :notification-server:bootRun  # :8085

# 3) 통합 테스트 (선택)
./gradlew :integration-test:test
```

헬스체크: `curl http://localhost:8081/actuator/health` (각 포트 동일 패턴).
대시보드: Grafana `http://localhost:3000` (admin/admin), Prometheus `http://localhost:9090`.

---

## 통합 테스트 실행

`integration-test` 모듈은 모든 서비스(member / product / payment / order / notification)와 인프라(MySQL × 5 schemas, Redis, Kafka)를 단일 docker compose 로 띄운 뒤 시나리오 테스트를 돌립니다. 재고 정합성·결제 실패 보상·컨슈머 멱등성 같은 멀티 서비스 흐름을 검증할 때 사용합니다.

### compose 파일

| 파일 | 역할 |
|---|---|
| `shared/docker/docker-integration-test.yml` | MySQL · Redis · Kafka · 5개 서비스 정의 (이미지 빌드 포함, healthcheck 포함) |
| `shared/docker/docker-integration-test.override.yml` | 호스트 포트 매핑 (mysql `13306`, redis `16379`, kafka `19092`, 서비스 `1808x`). 로컬 디버깅·k6·테스트 코드의 host 접근용 |

### 기동

```bash
cd mini-coupang/shared/docker

# 백그라운드 기동 (이미지 빌드 + 헬스체크 통과까지 기다림)
docker compose \
  -f docker-integration-test.yml \
  -f docker-integration-test.override.yml \
  up -d

# 모든 서비스 healthy 인지 확인
docker compose \
  -f docker-integration-test.yml \
  -f docker-integration-test.override.yml \
  ps
```

`order-server` 까지 모두 `healthy` 가 되면 준비 완료입니다.

### 테스트 실행

```bash
cd mini-coupang
./gradlew :integration-test:test
```

테스트 코드는 호스트 매핑 포트(`localhost:18084` 등)로 접근하므로 override 파일이 같이 떠 있어야 합니다.

### 종료

```bash
cd mini-coupang/shared/docker
docker compose \
  -f docker-integration-test.yml \
  -f docker-integration-test.override.yml \
  down -v
```

`-v` 로 볼륨까지 삭제하면 다음 기동에서 MySQL 초기화 스크립트(`mysql-init/`)가 다시 적용됩니다.

### 관찰 도구 추가 (선택)

Kafka UI 와 RedisInsight 를 같이 띄우려면 `docker-compose.observability.yml` 도 함께 사용합니다.

```bash
docker compose \
  -f docker-integration-test.yml \
  -f docker-integration-test.override.yml \
  -f docker-compose.observability.yml \
  up -d
```

- Kafka UI: `http://localhost:18099`
- RedisInsight: `http://localhost:15540`
