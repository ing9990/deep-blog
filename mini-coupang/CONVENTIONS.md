# mini-coupang 코드 컨벤션

이 문서는 mini-coupang 의 소스 컨벤션을 한 곳에 모은다. 외부 참조점 (drf-commerce 등) 을 매번 열지 않아도 이 문서만 보고 일관되게 작성할 수 있도록 한다. 새 패턴이 들어오면 이 문서를 먼저 갱신한다.

## 1. 모듈 구조

```
mini-coupang/                              (Gradle multi-project root)
├── settings.gradle, build.gradle           subprojects 공통 (Java 21, group/version)
├── common-modules/                         java-library. 모든 서비스가 의존
├── backend/                                (전환 중) 모놀리스. Phase 5 통과 후 archive
├── member-server/        (8081)            인증·가입·세션
├── product-server/       (8082)            상품·옵션·재고(Redis Lua)·검색(Qdrant)
├── order-server/         (8084)            주문 오케스트레이션 (Facade)
├── payment-server/       (8083)            결제 (현재 stub)
├── notification-server/  (8085)            알림 (consumer-only)
├── ml/                                     bge-m3 gRPC. product-server 가 호출
└── shared/docker/                          MySQL × 5스키마, Redis, Qdrant, Kafka(KRaft)
```

- 새 서비스를 더할 때 디렉토리명은 항상 `*-server` (e.g. `payment-server`, 절대 `payment-service` 아님).
- 각 서비스는 자체 `build.gradle` 만 가지며 `settings.gradle`/`gradlew` 는 루트만 가진다.
- 서비스간 코드 공유는 오직 `common-modules` 를 통해서. 한 서비스가 다른 서비스 패키지를 직접 참조 금지.

## 2. 패키지 구조 (per service)

```
com.deepblog.<domain>/
├── <ServiceName>Application.java
├── controller/                  REST 엔드포인트 + DTO(Request/Response)
│   └── dto/
├── application/                 Facade + Service + Command/Result + 이벤트 publisher
│   ├── port/out/                외부 시스템 추상화 (Feign 어댑터, Kafka 어댑터)
│   └── event/                   <Domain>Event extends BaseEvent
├── domain/                      엔티티, 값 객체
├── repository/                  Spring Data JPA
├── client/                      (필요 시) FeignClient 인터페이스 + dto/
├── event/
│   ├── consumer/                @KafkaListener 컴포넌트 + processor
│   └── payload/                 자기 서비스가 받는 이벤트 payload record (publisher 와 별도 정의)
└── global/                      ExceptionHandler, Filter, Config
```

원칙:
- `controller` 는 도메인 엔티티를 모른다. `Request`/`Response` 만 다룬다.
- `application` 은 외부 시스템을 직접 모르고 `port/out/*` 인터페이스를 본다 (Hexagonal). 어댑터 구현은 `infrastructure/` 또는 `client/` 에 둔다.
- `event/payload` 는 consumer 가 자기 서비스 안에 자기 모양으로 다시 정의 (publisher 와 record 공유 금지). 서비스간 DTO 결합을 회피한다.

## 3. 계층 컨벤션 (Controller → Facade → Service → Repository)

```
Controller   ← DTO 경계 (Request/Response). @LoginRequired, @Valid
   ↓
Facade       ← 오케스트레이션. @Transactional 없음
   ├── Service          (도메인별 단위 트랜잭션)
   ├── FeignClient      (다른 서비스 호출)
   ├── KafkaProducer    (이벤트 발행)
   └── ApplicationEventPublisher  (in-process 보조용)
   ↓
Service      ← @Transactional 메서드 단위로 작은 트랜잭션
   ↓
Repository   ← Spring Data JPA
```

**Facade 도입 기준**: 여러 컴포넌트 (Service + Client + Publisher) 를 조합할 때만. 단일 Service pass-through Facade 금지. 단일 Service 호출만 있는 컨트롤러는 Facade 없이 `Controller → Service` 직접.

**입력 유효성**:
- Controller 진입에서 `@Valid` + Bean Validation 로 nullness/empty/range 끝낸다.
- Service 는 비즈니스 invariants 만 검증 (`findById().orElseThrow(...)`).

## 4. DTO 4종 경계

| 종류 | 위치 | 역할 |
|---|---|---|
| `XxxRequest` | `controller/dto/` | HTTP 요청 바디. `@Valid` 대상 |
| `XxxResponse` | `controller/dto/` | HTTP 응답. `from(Result)` 정적 팩토리 |
| `XxxCommand` | `application/` | Controller → Service 입력. primitive/String 만 |
| `XxxResult`  | `application/` | Service → Controller 출력. JPA 엔티티 노출 금지 |

금지: `Response.from(Entity)` (Controller 가 Domain 엔티티 참조하게 됨). 항상 `Result` 를 거친다.

## 5. 도메인 엔티티 책임 경계

- 엔티티는 **자기 상태 불변식만** 검증한다.
- 외부 입력 모양 (option spec record 등) 시퀀스 조립은 application 계층 (`SellerProductService.assembleProduct` 류) 이 담당.
- 엔티티가 application 입력 형태를 알면 의존 역전이다.

## 6. Service 스타일

- `findById().orElseThrow(() -> new BusinessException(ErrorCode.X))` 패턴 적극 사용.
- `Optional.ifPresentOrElse`, `stream().filter(Objects::nonNull).toList()` 적극 활용.
- 명령형 `if (opt.isPresent()) { ... } else { ... }` 분기 지양.

## 7. 예외 + ErrorCode

- `com.deepblog.common.exception.BusinessException` 단일. 도메인별 *Exception 신규 작성 금지.
- 새 케이스는 `ErrorCode` enum 에 추가하고 `throw new BusinessException(ErrorCode.X)` (필요 시 메시지 추가).
- `GlobalExceptionHandler` 는 각 서비스의 `global/exception/` 에 배치 (component scan 단순화). 본문 로직은 동일.

## 8. Feign (서비스간 동기 호출)

서비스간 동기 호출은 Feign 만 사용한다 (RestTemplate/WebClient 직접 호출 금지).

### 8.1 호출 측 (Caller)

`*Application` 에 `@EnableFeignClients` 추가.

```java
@FeignClient(name = "product-client", url = "${clients.product-server.url}")
public interface ProductClient {

    @GetMapping("/internal/products/{id}")
    CommonResponse<ProductResponse> getProduct(@PathVariable("id") long id);

    @PostMapping("/internal/stocks/{productId}/reserve")
    CommonResponse<Void> reserveStock(
        @PathVariable long productId,
        @RequestHeader("Idempotency-Key") String idempotencyKey,
        @RequestBody StockReserveRequest request
    );
}
```

`application.yaml`:
```yaml
clients:
  product-server:
    url: http://localhost:8082
  member-server:
    url: http://localhost:8081
  payment-server:
    url: http://localhost:8083
```

### 8.2 피호출 측 (Callee)

- 내부 API 는 항상 `/internal/...` prefix.
- 응답 봉투는 항상 `CommonResponse<T>` (`com.deepblog.common.response.CommonResponse`).
- 외부 노출 API (`/api/...`) 와는 명확히 분리.

```java
@RestController
@RequestMapping("/internal/stocks")
@RequiredArgsConstructor
public class InternalStockController {

    private final StockService stockService;

    @PostMapping("/{productId}/reserve")
    public ResponseEntity<CommonResponse<StockReserveResponse>> reserveStock(
        @PathVariable long productId,
        @Valid @RequestBody StockReserveRequest request
    ) {
        StockReserveResponse response = stockService.reserveStock(productId, request);
        return ResponseEntity.ok(CommonResponse.success(response));
    }
}
```

### 8.3 호출 경계 패턴

`port/out` (인터페이스) + `client/` (Feign 어댑터) 구조를 권장. application 계층은 port 만 본다.

```java
// application/port/out/StockReservePort.java
public interface StockReservePort {
    void reserve(long optionId, long quantity);
}

// client/StockReserveFeignAdapter.java
@Component
@RequiredArgsConstructor
public class StockReserveFeignAdapter implements StockReservePort {
    private final ProductClient productClient;

    @Override
    public void reserve(long optionId, long quantity) {
        productClient.reserveStock(optionId, "...", new StockReserveRequest(quantity));
    }
}
```

이유: 단위 테스트에서 stub 으로 교체 용이 + Feign 결합도 Hexagonal 원칙 준수.

## 9. Kafka (서비스간 비동기)

### 9.1 토픽

`com.deepblog.common.event.EventTopic` enum 으로 중앙 관리. **토픽 1개에 여러 eventType 을 담는다** (도메인 단위로 토픽 분할).

```java
public enum EventTopic {
    MEMBER("member"),
    ORDER("order"),
    PAYMENT("payment");

    private final String name;
    // ...
}
```

토픽 추가는 enum 갱신 + 본 문서의 §9.7 토픽 매트릭스 갱신.

### 9.2 메시지 봉투

producer 가 발행하는 모든 메시지는 `EventEnvelope` 형태.

```java
public record EventEnvelope(
    @JsonProperty(required = true) long eventId,
    @JsonProperty(required = true) String eventType,
    @JsonProperty(required = true) JsonNode payload
) {}
```

- `eventId`: TSID 기반 long. 멱등성 키 (consumer 측 dedup 에 사용).
- `eventType`: enum 이름 그대로. e.g. `"ORDER_CONFIRMED"`, `"PAYMENT_COMPLETED"`.
- `payload`: 도메인별 record 를 JsonNode 로 직렬화한 것.

producer 측 추상 클래스:

```java
public abstract class BaseEvent<T> {
    private final long eventId;
    private final String eventType;
    private final LocalDateTime occurredAt;
    private final T payload;

    public BaseEvent(String eventType, T payload) {
        this.eventId = TsidCreator.getTsid().toLong();
        this.eventType = eventType;
        this.occurredAt = LocalDateTime.now().truncatedTo(ChronoUnit.MILLIS);
        this.payload = payload;
    }
    // ...
}
```

도메인별 이벤트:

```java
// order-server/src/main/java/com/deepblog/order/event/OrderConfirmedEvent.java
public class OrderConfirmedEvent extends BaseEvent<OrderConfirmedEvent.Payload> {
    public OrderConfirmedEvent(long orderId, long optionId, long quantity) {
        super(OrderEventType.ORDER_CONFIRMED.name(),
              new Payload(orderId, optionId, quantity));
    }

    public record Payload(long orderId, long optionId, long quantity) {}
}
```

```java
// order-server/src/main/java/com/deepblog/order/event/OrderEventType.java
public enum OrderEventType {
    ORDER_CONFIRMED,
    ORDER_PAYMENT_FAILED
}
```

### 9.3 직렬화

- key: `String` (도메인 ID, e.g. `String.valueOf(orderId)`). 같은 키는 같은 partition → 순서 보장.
- value: `String` (JSON 문자열). `JsonConverter` (common-modules) 가 직렬화/역직렬화.
- producer/consumer 모두 `StringSerializer` / `StringDeserializer`. Schema Registry 사용 안 함 (sandbox).

`application.yaml`:
```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
    consumer:
      group-id: <service-name>      # e.g. product-server
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
```

### 9.4 Producer

`KafkaProducer` 단일 컴포넌트 (common-modules):

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaProducer {
    private final KafkaTemplate<String, String> kafkaTemplate;

    public void sendMessage(String topic, String key, String payload, Runnable onError) {
        try {
            kafkaTemplate.send(topic, key, payload).whenComplete((result, e) -> {
                if (e == null) {
                    log.info("Sent. topic={}, offset={}", topic, result.getRecordMetadata().offset());
                } else {
                    log.error("Kafka send failed. topic={}, payload={}", topic, payload, e);
                    onError.run();
                }
            });
        } catch (Exception e) {
            log.error("Kafka send sync-failed. topic={}, payload={}", topic, payload, e);
            onError.run();
        }
    }
}
```

**발행 위치는 항상 `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`** 핸들러:

```java
@Component
@RequiredArgsConstructor
public class OrderConfirmedEventHandler {
    private final KafkaProducer kafkaProducer;
    private final JsonConverter jsonConverter;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderConfirmedEvent event) {
        String key = String.valueOf(event.getPayload().orderId());
        kafkaProducer.sendMessage(
            EventTopic.ORDER.getName(),
            key,
            jsonConverter.toJson(event),
            () -> log.error("publish failed. orderId={}", event.getPayload().orderId())
        );
    }
}
```

이유: 트랜잭션 commit 이후에만 발행 → 롤백 시 메시지가 나가지 않는다. 단점은 commit 직후 크래시 시 메시지 유실 가능 (Outbox 도입 전까지 수용).

발행 트리거는 도메인 트랜잭션 내부에서 `ApplicationEventPublisher.publishEvent(new OrderConfirmedEvent(...))`.

### 9.5 Consumer

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final OrderEventProcessor orderEventProcessor;
    private final JsonConverter jsonConverter;

    @RetryableTopic(
        backoff = @Backoff(delay = 1000, multiplier = 2.0),
        topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE,
        exclude = { IllegalArgumentException.class }
    )
    @KafkaListener(topics = "#{T(com.deepblog.common.event.EventTopic).ORDER.getName()}")
    public void consume(String message) {
        long eventId = 0L;
        try {
            EventEnvelope envelope = jsonConverter.fromJson(message, EventEnvelope.class);
            eventId = envelope.eventId();

            switch (envelope.eventType()) {
                case "ORDER_CONFIRMED" -> {
                    OrderConfirmedPayload p = jsonConverter.treeToValue(envelope.payload(), OrderConfirmedPayload.class);
                    orderEventProcessor.processOrderConfirmed(eventId, p.optionId(), p.quantity());
                }
                case "ORDER_PAYMENT_FAILED" -> {
                    OrderPaymentFailedPayload p = jsonConverter.treeToValue(envelope.payload(), OrderPaymentFailedPayload.class);
                    orderEventProcessor.processPaymentFailed(eventId, p.optionId(), p.quantity());
                }
                default -> log.warn("Unknown order event type: {}", envelope.eventType());
            }
        } catch (DataIntegrityViolationException e) {
            log.info("Duplicate event skipped. eventId={}", eventId);
        }
    }

    @DltHandler
    public void handleDlt(String message,
                          @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                          @Header(KafkaHeaders.EXCEPTION_MESSAGE) String errorMessage) {
        log.error("Event moved to DLT. topic={}, errorMessage={}, message={}", topic, errorMessage, message);
    }
}
```

규칙:
- `@RetryableTopic` 으로 자동 retry topic 생성 (`<topic>-retry-0`, `<topic>-retry-1`, ...). DLT 는 `<topic>-dlt`.
- `exclude` 에 비즈니스 예외 (e.g. `IllegalArgumentException`) 를 두면 retry 없이 DLT 로 직행.
- consumer-group-id 는 서비스명 그대로 (e.g. `product-server`). 같은 서비스의 인스턴스는 같은 group.
- payload record 는 consumer 자기 모듈 (`event/payload/`) 에 다시 정의. publisher 모듈 record 를 import 하지 않는다.

### 9.6 멱등성 (Consumer 측)

같은 메시지가 두 번 들어와도 처리는 한 번만. consumer 의 DB 에 `processed_events` 테이블 + UNIQUE(event_id, event_type).

```java
@Entity
@Table(
    name = "processed_events",
    uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "event_type"})
)
public class ProcessedEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long eventId;

    @Column(nullable = false, length = 50)
    private String eventType;

    @Column(nullable = false)
    private LocalDateTime processedAt;
    // ...
}
```

처리 메서드는 같은 `@Transactional` 안에서 `processedEventRepository.save(...)` 를 먼저 한다. 중복이면 `DataIntegrityViolationException` → consumer 가 catch 해서 스킵 (위 §9.5 코드).

```java
@Transactional
public void processOrderConfirmed(long eventId, long optionId, long quantity) {
    processedEventRepository.save(ProcessedEvent.of(eventId, "ORDER_CONFIRMED"));  // 멱등 체크
    int updated = optionStockRepository.decrementStock(optionId, quantity);
    if (updated == 0) {
        log.error("processOrderConfirmed - 재고 차감 실패. optionId={}", optionId);
    }
}
```

### 9.7 토픽 매트릭스 (mini-coupang 현재)

| Topic | EventType | Producer | Consumer | 용도 |
|---|---|---|---|---|
| `member` | `MEMBER_SIGNED_UP` | member-server | notification-server | 회원 가입 알림 |
| `member` | `SELLER_SIGNED_UP` | member-server | notification-server | 판매자 가입 알림 |
| `order` | `ORDER_CONFIRMED` | order-server | product-server, notification-server | MySQL 재고 영구 차감 + 주문 알림 |
| `order` | `ORDER_PAYMENT_FAILED` | order-server | product-server, notification-server | Redis 재고 복구 (Saga) + 결제 실패 알림 |
| `payment` | `PAYMENT_COMPLETED` | payment-server | notification-server | 결제 완료 알림 |

토픽/타입 추가 시 이 표를 갱신한다 (Single Source Of Truth).

### 9.8 도입 보류 (sandbox 정책)

- **Outbox 패턴 미도입**: Order INSERT + Kafka publish 사이 크래시 시 메시지 유실 위험 수용. 추후 별도 단계.
- **Schema Registry 미도입**: JSON 문자열 + 코드 호환성으로 처리.
- **Exactly-once 미도입**: at-least-once + consumer 멱등으로 충족.

## 10. 테스트 컨벤션

- 클래스/메서드에 `@DisplayName` 필수.
- given/when/then 주석 + BDDMockito (`given(...).willReturn(...)`).
- 반복 셋업은 `support/<Aggregate>MockFixtures` / `<Aggregate>Scenario` 로 분리.
- 동시성 테스트는 별도 패키지 (`concurrency/`) + `OrderConcurrencyScenario` 같은 시나리오 객체로 셋업 분리.

## 11. 공용 클래스 위치 (common-modules)

| 클래스 | 패키지 | 역할 |
|---|---|---|
| `BusinessException` | `com.deepblog.common.exception` | 단일 비즈니스 예외 |
| `ErrorCode` | `com.deepblog.common.exception` | 모든 서비스가 공유하는 에러 코드 enum |
| `ErrorResponse` | `com.deepblog.common.exception` | HTTP 에러 본문 |
| `CommonResponse<T>` | `com.deepblog.common.response` | 성공 응답 봉투 |
| `EventTopic` | `com.deepblog.common.event` | Kafka 토픽 enum |
| `EventEnvelope` | `com.deepblog.common.event` | Kafka 메시지 봉투 |
| `BaseEvent<T>` | `com.deepblog.common.event` | publisher 측 추상 이벤트 |
| `KafkaProducer` | `com.deepblog.common.infrastructure.kafka` | 단일 send 컴포넌트 |
| `JsonConverter` | `com.deepblog.common.util` | Jackson 래퍼 |

common-modules 에 들어가는 것:
- 도메인 중립 + 모든 서비스가 같은 모양으로 쓰는 것.

common-modules 에 들어가지 않는 것:
- 도메인 엔티티, 서비스/Repository 인터페이스, 비즈니스 로직.
- `@RestControllerAdvice`/`@Configuration` 클래스 (component scan 결합 회피).

## 12. Git/PR

- 브랜치: `feature-<function-name>` → `main` (squash). 메모리 룰 그대로.
- 커밋 메시지에 AI 출처 표시 절대 금지 (`Co-Authored-By: Claude`, `🤖 Generated...` 등).
- 한 PR = 한 논리 단위. 검증/테스트 통과 후 PR.
