# 미니 쿠팡

---

## 소개

미니 쿠팡은 대규모 트래픽과 높은 동시성 환경을 가정하고 회원, 상품, 주문, 결제, 알림을 **독립적인 마이크로 서비스**로 분리해 동기 호출(Feign)과 비동기 이벤트(Kafka)로 재고 정합성, 결제 실패 보상, 컨슈머 멱등성까지 다루는 이커머스 백엔드 프로젝트입니다.

**고민했던 문제들**

- **재고 원자적 선점**: 주문 시 결제 호출 직전에 Redis Luascript 로 `GET → 검증 → DECRBY` 를 단일 명령에 묶어 동시 요청 환경에서도 네트워크
  왕복 없이 재고 정합성을 보장합니다.
- **Choreography Saga 보상 트랜잭션**: 결제 실패 시 `order.payment-failed` 이벤트를 발행해 상품 서비스 컨슈머가 선점됐던 재고를 비동기로
  원복합니다. 주문 서비스가 보상 경로를 직접 호출하지 않고 broker 가 흐름의 책임을 갖습니다.
- **Stateless 서비스 + 외부 세션 저장소**: WAS 자체는 stateless 로 두고 `HttpSession` 의 실 저장은 Spring Session Redis (
  `spring:session:sessions:{id}`) 가 맡습니다. 어떤 인스턴스로 라우팅돼도 같은 세션을 인식하므로 서비스 단위 수평 확장에 부담이 없습니다.
- **컨슈머 멱등성**: 모든 Kafka 컨슈머는 `processed_events(event_id, event_type)` UNIQUE 제약으로 중복 컨슘을 차단합니다. 같은
  이벤트가 재전송돼도 두 번째 INSERT 가 `DataIntegrityViolationException` 으로 즉시 거부됩니다.
- **재시도 + DLT 격리**: 컨슈머는 `@RetryableTopic` 으로 일시적 네트워크/처리 실패에 대한 backoff 재시도를 구성하고, 모두 실패하면
  `@DltHandler` 가 받는 dead-letter topic 으로 메시지를 옮겨 본류 파티션의 컨슘 진행을 막지 않습니다.
- **Port-And-Adapter 격리**: 외부 호출(Feign / Kafka)을 도메인이 직접 다루지 않고 `application/port/out` 인터페이스에만 의존하도록
  분리했습니다. 통신 수단이 바뀌어도 도메인 코드는 그대로 두고 어댑터만 교체합니다.

---

## 문서

- [Usecase.md](Usecase.md): 서비스별 유스케이스 표 + 굵직한 3개 흐름 다이어그램 (회원가입 / 상품 주문 / 상품 검색)
- [Kafka-Topics.md](Kafka-Topics.md): 토픽 매트릭스, 메시지 형태(`EventMessage`)/페이로드, 멱등성 키 규칙
- [Redis-Keys.md](Redis-Keys.md): 키 패턴, 타입, TTL, 사용 명령

---

## 모듈 구조

```
mini-coupang/
├── common-modules/        # 공유 라이브러리 모듈 (bootJar = False)

# Gateway, RateLimiter ... 추가 예정
├── member-server/         # 회원 · 인증 서비스 (8081)
├── product-server/        # 상품 · 카테고리 · 재고 서비스 (8082)
├── payment-server/        # 결제 서비스 (8083)
├── order-server/          # 주문 오케스트레이션 서비스 (8084)
├── notification-server/   # 알림 서비스 (8085, consumer-only)

==== Infrastructure, Script ====
├── shared/
│   ├── docker/            # Infrastructure docker-compose 
│   └── k6/                # 부하 시나리오 (등록 / 검색 / 주문)
```

---

## 기술 스택

| Category        | Stack                                               |
|-----------------|-----------------------------------------------------|
| Language        | Java 21                                             |
| Framework       | Spring Boot 3.5.9 · Spring Cloud OpenFeign 2025.0.0 |
| Database        | MySQL 8.4 (서비스별 스키마 분리)                             |
| Cache / 세션 / 재고 | Redis 7 · Lua Script · Spring Session Redis         |
| Message Broker  | Apache Kafka (KRaft 단일 노드, JSON String)             |
| 인증              | HttpSession + Spring Session Redis 외부 저장 · BCrypt   |
| ID 생성           | TSID Creator (이벤트 ID)                               |
| Build           | Gradle Multi-project (Groovy DSL)                   |

---

## 실행

```bash
# 1) 인프라 (Kafka KRaft + MySQL × 5 schemas + Redis)
cd mini-coupang/shared/docker
docker compose up -d

# 2) 서비스 5종 (각각 별도 셸에서)
./gradlew :member-server:bootRun        # :8081
./gradlew :product-server:bootRun       # :8082
./gradlew :payment-server:bootRun       # :8083
./gradlew :order-server:bootRun         # :8084
./gradlew :notification-server:bootRun  # :8085
```

헬스체크: `curl http://localhost:8081/actuator/health` (각 포트 동일 패턴).