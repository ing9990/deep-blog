# mini-coupang

단일 Spring Boot 모놀리스 백엔드 샌드박스. 구매자 / 판매자 / 관리자 세 Actor가 상호작용하는 e-커머스 도메인을 한 애플리케이션 안에서 작은 단위로 쌓아 올린다.

- Java 21 · Spring Boot 3.5.9 · Gradle 8.14 (Groovy DSL)
- 로컬 전용. 외부 도메인(`api.ing9990.com`) 연결 없음.

## 실행

```bash
./gradlew bootRun         # 8080 포트로 기동
./gradlew test            # 단위/통합 테스트
./gradlew build           # JAR 빌드 (build/libs/mini-coupang-0.0.1-SNAPSHOT.jar)
```

헬스체크: `curl http://localhost:8080/actuator/health`

## 아키텍처 예시 (참고용)

> 아래는 방향성 예시이며 실제 구현은 달라질 수 있다. 예를 들어 결제 이전 재고 예약은 Redis를 통해서만 수행하고, 결제 실패·환불 시점의 재고 복구는 Event를 발행해 Event Handler에서 수행하는 식으로 바뀔 수 있다. 세부 구현은 각 기능을 작게 쪼개 구현하는 시점에 결정한다.

### 최상위 구조

```
mini-coupang/
├── .github/
├── gradle/wrapper/
├── src/
│   ├── main/
│   │   ├── java/com/example/minicoupang/
│   │   │   ├── MiniCoupangApplication.java
│   │   │   ├── domain/
│   │   │   ├── global/
│   │   │   └── infrastructure/
│   │   └── resources/
│   │       └── application.yaml
│   └── test/
├── build.gradle
├── settings.gradle
├── docker-compose.yml   # MySQL + Redis + (Elasticsearch) + Prometheus + Grafana
└── README.md
```

### domain/ — 도메인 레이어

```
domain/
├── common/vo/
│   ├── Address.java
│   ├── Money.java
│   ├── PhoneNumber.java
│   └── Sku.java                       # 재고 식별자 VO
│
├── auth/
│   ├── AuthContext.java
│   ├── AuthContextHolder.java
│   ├── application/  (AuthService, AuthServiceImpl)
│   ├── controller/   (AuthController + dto/)
│   ├── domain/       (Account)
│   ├── repository/
│   └── exception/
│
├── user/                              # 구매자
│   └── [application | controller(+dto) | domain(User) | repository | exception]
│
├── seller/                            # 판매자
│   └── [application | controller(+dto) | domain(Seller) | repository | exception]
│
├── admin/
│   └── [...]
│
├── category/
│   └── [application | controller(+dto) | domain(Category) | repository | exception]
│
├── product/                           # 상품 — Actor별 재분할
│   ├── domain/
│   │   ├── Product.java
│   │   ├── ProductStatus.java         # DRAFT, ON_SALE, SOLD_OUT, SUSPENDED
│   │   ├── ProductOption.java         # 옵션(색상/사이즈) → SKU 단위
│   │   └── ProductImage.java
│   ├── repository/
│   ├── exception/
│   ├── admin/      [controller + service]   # 카테고리 배정, 노출 정책
│   ├── seller/     [controller(+dto) + service]   # 등록·수정·가격변경
│   └── user/       [controller(+dto) + service]   # 조회·검색 (캐싱 영역)
│
├── inventory/                         # 재고 — Hold/가계약 패턴
│   ├── domain/
│   │   ├── Stock.java                         # SKU별 총/가용 수량
│   │   ├── StockReservation.java              # 예약(Hold) 애그리게잇
│   │   ├── StockReservationStatus.java        # HELD, CONFIRMED, RELEASED, EXPIRED
│   │   ├── ReservationLineItem.java
│   │   └── StockMovement.java                 # 입고/출고/반품 이력
│   ├── application/
│   │   ├── StockReservationService.java
│   │   ├── StockReservationServiceImpl.java
│   │   ├── StockEventHandler.java             # 주문/결제 이벤트 수신
│   │   └── ReservationExpirationScheduler.java  # TTL 만료 배치
│   ├── event/
│   │   ├── StockReservedEvent.java
│   │   ├── StockConfirmedEvent.java
│   │   ├── StockReleasedEvent.java
│   │   └── StockReservationExpiredEvent.java
│   ├── controller/
│   │   └── admin/ (AdminInventoryController)   # 재고 모니터링
│   ├── repository/
│   │   ├── StockRepository.java
│   │   └── StockReservationRepository.java
│   └── exception/
│       ├── InsufficientStockException.java
│       ├── StockReservationNotFoundException.java
│       ├── StockReservationExpiredException.java
│       └── ConcurrentStockUpdateException.java
│
├── cart/
│   ├── domain/ (Cart, CartItem)
│   └── [application(+EventHandler) | controller(+dto) | repository | exception]
│
├── order/                             # 주문 — Actor별 재분할
│   ├── common/
│   │   ├── OrderItem.java
│   │   ├── OrderPrice.java
│   │   └── OrderRequest.java
│   ├── exception/
│   ├── user/
│   │   ├── domain/ (UserOrder, UserOrderStatus)
│   │   │   # CREATED → AWAITING_PAYMENT → PAID → SHIPPED → DELIVERED → COMPLETED
│   │   │   # CANCELLED / REFUND_REQUESTED / REFUNDED
│   │   ├── application/ (UserOrderService, UserOrderEventHandler)
│   │   ├── controller/ (+dto)   # @Idempotent 부착 지점
│   │   ├── repository/
│   │   └── event/
│   │       ├── OrderCreatedEvent.java
│   │       ├── UserOrderCancelledEvent.java
│   │       └── UserOrderConfirmedEvent.java
│   └── seller/
│       ├── domain/ (SellerOrder, SellerOrderStatus)
│       │   # RECEIVED → PREPARING → READY → HANDED_OVER
│       ├── application/
│       ├── controller/
│       ├── repository/
│       └── event/
│           ├── SellerOrderReadyForShipmentEvent.java
│           └── SellerOrderShippedEvent.java
│
├── payment/
│   ├── domain/ (Payment, PaymentStatus, PaymentMethod, PaymentProvider)
│   ├── gateway/                       # 포트
│   │   ├── PaymentGateway.java
│   │   ├── PaymentGatewayResolver.java
│   │   └── PaymentApprovalResult.java
│   ├── application/
│   │   ├── PaymentService.java
│   │   ├── PaymentServiceImpl.java
│   │   ├── PaymentEventHandler.java
│   │   └── PaymentFailureRecorder.java
│   ├── controller/ (+dto)             # @Idempotent 필수
│   ├── event/
│   │   ├── PaymentCompletedEvent.java
│   │   ├── PaymentFailedEvent.java
│   │   └── PaymentCancelledEvent.java
│   ├── repository/
│   └── exception/
│
├── shipping/                          # 배송
│   ├── domain/ (Shipment, ShipmentStatus, TrackingNumber, Carrier)
│   ├── application/ (ShippingService, ShippingEventHandler)
│   ├── controller/ (+dto)
│   ├── event/ (ShipmentRegisteredEvent, ShipmentDeliveredEvent)
│   ├── repository/
│   └── exception/
│
├── review/
│   ├── domain/ (Review, ReviewImage, ReviewStatus)
│   ├── repository/
│   ├── user/    [controller(+dto) + service]   # 작성·수정·삭제
│   ├── seller/  [controller(+dto) + service]   # 답글·신고
│   └── exception/
│
├── coupon/                            # 쿠폰/프로모션
│   ├── domain/ (Coupon, CouponIssuance, DiscountPolicy)
│   ├── application/
│   ├── controller/ (+dto)
│   ├── event/ (CouponIssuedEvent, CouponUsedEvent)
│   ├── repository/
│   └── exception/
│
├── wishlist/
│   └── [application | controller(+dto) | domain | repository | exception]
│
└── notification/                      # 수신자별 분리
    ├── infrastructure/ (SseEmitterManager)
    ├── user/    [controller(+dto) | domain | event | repository | service]
    ├── seller/  [controller(+dto) | domain | event | repository | service]
    └── admin/   [controller(+dto) | domain | event | repository | service]
```

### global/ — 횡단 관심사

```
global/
├── config/
│   ├── WebConfig.java
│   ├── RedisConfig.java
│   ├── CacheConfig.java
│   ├── AsyncConfig.java                  # 이벤트 비동기 처리
│   ├── SchedulingConfig.java             # 예약 만료 배치
│   └── TossPaymentsProperties.java
├── exception/
│   ├── BusinessException.java
│   ├── ErrorCode.java
│   ├── ErrorResponse.java
│   └── GlobalExceptionHandler.java
├── interceptor/
│   ├── AuthInterceptor.java
│   ├── AuthHandler.java
│   ├── UserAuthHandler.java
│   ├── SellerAuthHandler.java
│   ├── AdminAuthHandler.java
│   └── IdempotencyInterceptor.java       # 멱등 키 진입점
├── idempotency/                          # 멱등 키 설계의 본체
│   ├── Idempotent.java                   # @Idempotent 어노테이션
│   ├── IdempotencyKey.java               # VO (client key + scope + user)
│   ├── IdempotencyRecord.java            # 저장 도메인 (key, status, response snapshot)
│   ├── IdempotencyStatus.java            # IN_PROGRESS, SUCCEEDED, FAILED
│   ├── IdempotencyResult.java            # 저장된 응답 스냅샷
│   ├── IdempotencyStore.java             # 포트 인터페이스
│   ├── IdempotencyKeyResolver.java       # 헤더 파싱 + scope 결정
│   └── exception/
│       ├── DuplicateRequestInProgressException.java
│       ├── IdempotencyKeyConflictException.java   # 같은 key, 다른 payload
│       └── MissingIdempotencyKeyException.java
├── cache/                                # 캐시 전략 추상화
│   ├── CacheName.java                    # "product:detail", "product:list:cat:{id}" 등
│   ├── CacheKeys.java                    # 키 생성 규칙 (버전/네임스페이스)
│   ├── CacheTtl.java                     # 도메인별 TTL 정책
│   └── CacheEvictOn.java                 # 이벤트→무효화 매핑용 어노테이션
└── util/
    └── PasswordEncoder.java
```

### infrastructure/ — 외부 어댑터

```
infrastructure/
├── payment/
│   ├── dto/TossPaymentResponse.java
│   ├── TossPaymentClient.java
│   ├── TossPaymentGateway.java
│   ├── KakaoPayGateway.java
│   ├── TestPaymentGateway.java
│   └── PaymentGatewayResolverImpl.java
├── idempotency/
│   └── RedisIdempotencyStore.java        # IdempotencyStore의 Redis 구현
├── cache/
│   ├── RedisProductCache.java            # 상품 상세/리스트 캐시
│   └── ProductCacheWarmer.java
├── search/                               # 읽기 성능 — 검색 전용 경로
│   ├── ProductSearchAdapter.java         # (포트는 domain/product에 둘 수도)
│   └── ElasticsearchProductSearchAdapter.java
└── messaging/
    └── SpringEventPublisher.java         # 초기엔 ApplicationEvent, 나중에 Kafka로 교체
```

## 다음 단계

현재는 Spring Boot 컨텍스트가 뜨는 것 외에는 아무 기능도 없다. 이후 작은 단위(예: `auth` 회원가입 → `product` 등록/조회 → `cart` → `order` 생성 → `payment` …)로 하나씩 채워 나가며, 각 단계에서 SLO·측정·트레이드오프를 근거로 구현을 결정한다.
