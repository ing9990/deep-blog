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
├── integration-test/      # 멀티 서비스 통합 테스트 (재고 보상, 동시성 시나리오)
│   └── docker-compose-integration-tests.yml
│
└── shared/
    ├── docker/            # docker-compose-local.yml (전체 풀 스택), mysql-init, prometheus, grafana
    └── k6/                # 부하 시나리오 (상품 등록 / 검색)

각 서비스 모듈 root에는 단독 개발용 `docker-compose-{service}-dev.yml` 이 있습니다 (인프라만 컨테이너로 띄우고 서비스는 호스트에서 `bootRun`).
```

---

## 기술 스택

| Category        | Stack                                                      |
|-----------------|------------------------------------------------------------|
| Language        | Java 21                                                    |
| Framework       | Spring Boot 3.5.9 · Spring Cloud OpenFeign 2025.0.0        |
| Database        | MySQL 8.4 (서비스별 스키마 분리)                                    |
| Cache / 세션 / 재고 | Redis 7 · Lua Script · Spring Session Redis                |
| Message Broker  | Apache Kafka (KRaft 단일 노드, JSON String) · Outbox Relay     |
| 인증              | HttpSession + Spring Session Redis 외부 저장 · BCrypt          |
| ID 생성           | TSID Creator (이벤트 ID, 주문 PK)                               |
| Observability   | Prometheus · Grafana · Spring Actuator                     |
| Build           | Gradle Multi-project (Groovy DSL)                          |

---

## 실행

세 가지 시나리오에 따라 compose 파일을 골라 씁니다.

| 시나리오 | compose 파일 | 위치 |
|---|---|---|
| 단일 서비스 개발 (인프라만 컨테이너, 서비스는 `bootRun`) | `docker-compose-{service}-dev.yml` | 각 서비스 모듈 root |
| 통합 테스트 (전체 컨테이너 + 1xxxx 호스트 포트) | `docker-compose-integration-tests.yml` | `integration-test/` |
| 로컬 풀 스택 (스테이징 유사, 표준 포트 8081-8085) | `docker-compose-local.yml` | `shared/docker/` |

전 서비스가 Kafka 를 쓰므로 모든 dev compose 에 Kafka UI(`http://localhost:18099`)가 함께 뜹니다. Redis 를 쓰는 서비스(member / product / order)에는 RedisInsight(`http://localhost:5540`)가 함께 뜹니다.

### 단일 서비스 개발

```bash
# 예: product-server 개발
cd mini-coupang/product-server
docker compose -f docker-compose-product-server-dev.yml up -d
./gradlew :product-server:bootRun
```

서비스가 호스트에서 표준 포트(3306/6379/9092)로 인프라에 붙으므로 다른 dev 스택과 동시 기동은 가정하지 않습니다 (충돌 시 한쪽 `down` 후 기동).

### 통합 테스트

```bash
cd mini-coupang/integration-test
docker compose -f docker-compose-integration-tests.yml up -d --build
docker compose -f docker-compose-integration-tests.yml ps   # 모든 서비스 healthy 확인

cd ..
./gradlew :integration-test:test                            # 테스트는 호스트의 1xxxx 포트로 접근

cd integration-test
docker compose -f docker-compose-integration-tests.yml down -v
```

`-v` 로 볼륨까지 삭제하면 다음 기동에서 MySQL 초기화 스크립트(`shared/docker/mysql-init/`)가 다시 적용됩니다.

### 로컬 풀 스택 (스테이징 유사)

```bash
cd mini-coupang/shared/docker
docker compose -f docker-compose-local.yml up -d --build
```

서비스 5종 + Kafka UI + RedisInsight + Prometheus + Grafana 모두 기동.

- 서비스: `http://localhost:8081` ~ `http://localhost:8085`
- Kafka UI: `http://localhost:18099`
- RedisInsight: `http://localhost:15540`
- Grafana: `http://localhost:3000` (admin/admin)
- Prometheus: `http://localhost:9090`

헬스체크: `curl http://localhost:8081/actuator/health` (각 포트 동일 패턴).
