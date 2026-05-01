# Usecase

미니쿠팡이 제공하는 사용자 동작 목록. 굵직한 3개(회원가입 / 상품 주문 / 상품 검색)는 다이어그램을 두고, 나머지는 API 명세만 둡니다.

---

## 1. 사용자 시나리오 (구매 플로우)

1. 상품을 검색한다 → [UC-03 상품 검색](#uc-03-상품-검색)
2. 수량을 선택한다 (클라이언트 단계)
3. **결제 준비** 호출 → [UC-02 상품 주문](#uc-02-상품-주문) (prepare 단계)
4. 토스 SDK 로 카드 인증 / 3DS 진행
5. 인증이 성공하면 **결제 승인** 호출 → UC-02 (confirm 단계)
6. 결제 승인 성공 시 주문이 `PAID` 로 전이되고 `order.confirmed` 이벤트가 발행된다.

---

## 2. Usecase 목록

| ID | Usecase | Endpoint | 인증 | 처리 서비스 | Diagram |
|---|---|---|---|---|---|
| UC-01 | 회원가입 (회원/판매자) | `POST /auth/signup/member`, `POST /auth/signup/seller` | 없음 | 회원, 알림 | [signup](diagrams/signup.md) |
| UC-02 | 상품 주문 | `POST /api/orders/prepare`, `POST /api/orders/{orderId}/confirm` | 세션 (회원) | 주문, 회원, 상품, 결제, 알림 | [place-order](diagrams/place-order.md) |
| UC-03 | 상품 검색 | `GET /api/products/search` | 없음 | 상품 | [product-search](diagrams/product-search.md) |
| UC-04 | 회원 로그인 | `POST /auth/login` | 없음 | 회원 | — |
| UC-05 | 판매자 로그인 | `POST /auth/login/seller` | 없음 | 회원 | — |
| UC-06 | 로그아웃 | `POST /auth/logout` | 세션 | 회원 | — |
| UC-07 | 내 정보 조회 | `GET /api/me` | 세션 | 회원 | — |
| UC-08 | 카테고리 목록 | `GET /api/categories` | 없음 | 상품 | — |
| UC-09 | 판매자 상품 목록 | `GET /api/seller/products` | 세션 (판매자) | 상품, 회원 | — |
| UC-10 | 상품 등록 | `POST /api/seller/products` | 세션 (판매자) | 상품, 회원 | — |

---

## 3. Usecase 상세

### UC-01 회원가입 (회원/판매자)

이메일과 비밀번호로 새 계정을 만들고, 회원 또는 판매자 프로필을 함께 영속화합니다. 가입 성공 시 `member.signed-up` 또는 `seller.signed-up` 이벤트가 같은 트랜잭션의 outbox 로 들어가고 relay 가 Kafka 로 발행합니다. 자세한 흐름은 [signup](diagrams/signup.md).

### UC-02 상품 주문

사용자 시나리오의 핵심. 토스 결제 모델에 맞춰 **prepare → confirm 두 단계**로 분리됩니다.

| 단계 | 엔드포인트 | 핵심 작업 |
|---|---|---|
| prepare | `POST /api/orders/prepare` | 옵션 스냅샷 조회 (Feign) → Redis 재고 선점 (Lua) → 주문 INSERT (PENDING) |
| (브라우저) | 토스 SDK `requestPayment` | 카드 인증 / 3DS. successUrl 로 `paymentKey, orderId, amount` 전달 |
| confirm | `POST /api/orders/{orderId}/confirm` | 결제 서비스 승인 호출 → 성공 시 `PAID` 전이 + `order.confirmed` outbox / 실패 시 `CANCELED` 전이 + `order.payment-failed` outbox |

5개 서비스를 거칩니다. 자세한 흐름은 [place-order](diagrams/place-order.md).

### UC-03 상품 검색

키워드로 상품을 찾습니다. 현재는 MySQL `LIKE` 단일 채널로 productId 목록을 뽑은 뒤 가격 / 카테고리 필터를 합성합니다. 자세한 흐름은 [product-search](diagrams/product-search.md).

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `GET /api/products/search` |
| 인증 | 없음 |
| 쿼리 파라미터 | `q` (필수), `category_id`, `min_price`, `max_price`, `limit` (기본 20, 최대 100) |
| 출력 | `{ items: [{ productId, sellerId, categoryId, name, description, basePrice, status, score }] }` |
| 필터 | `ACTIVE` 상태만 노출 (suspended, sold-out 제외) |

> **확장 진행 중**: Qdrant + bge-m3 임베딩 기반 dense 채널을 더해 sparse(MySQL) + dense(Qdrant) hybrid 검색 + RRF 머지로 전환 중.

### UC-04 회원 로그인

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/login` |
| 인증 | 없음 |
| 입력 | `{ email, password }` |
| 출력 | `{ accountId, memberId }` + `Set-Cookie: SESSION=...` |

이메일 / 비밀번호를 BCrypt 로 검증하고 회원 권한 (`member.members` 행) 이 있는지 확인한 뒤 `HttpSession` 에 `accountId` 를 저장합니다. 세션 자체는 Spring Session Redis 가 외부 저장 (`spring:session:sessions:{id}`).

### UC-05 판매자 로그인

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/login/seller` |
| 인증 | 없음 |
| 입력 | `{ email, password }` |
| 출력 | `{ accountId, sellerId }` + `Set-Cookie: SESSION=...` |

회원 로그인과 같지만 권한 검증을 `member.sellers` 로 합니다. 같은 계정이 회원 / 판매자 양쪽 권한을 동시에 가질 수 있습니다.

### UC-06 로그아웃

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/logout` |
| 인증 | 세션 |
| 입력 | (없음, 쿠키만) |
| 출력 | `204 No Content` + `Set-Cookie: SESSION=; Max-Age=0` |

`HttpSession.invalidate()` 로 Redis 의 세션 키를 즉시 제거합니다. 세션이 없는 요청도 동일한 응답으로 처리합니다.

### UC-07 내 정보 조회

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `GET /api/me` |
| 인증 | 세션 |
| 입력 | (없음, 쿠키만) |
| 출력 | `{ accountId, email, memberId, sellerId }` |

세션 쿠키 → Session Store(Redis) 에서 `accountId` 복원 → `member` 스키마에서 Account + Member / Seller 를 같이 조회해 묶어서 반환합니다. 같은 Account 가 회원 · 판매자 양쪽으로 가입된 경우엔 `memberId` 와 `sellerId` 둘 다 채워지고, 한쪽으로만 가입한 경우 가입하지 않은 쪽이 `null` 이 됩니다.

### UC-08 카테고리 목록

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `GET /api/categories` |
| 인증 | 없음 |
| 입력 | (없음) |
| 출력 | `{ categories: [...] }` |

product 스키마의 `categories` 테이블 전체를 반환합니다.

### UC-09 판매자 상품 목록

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `GET /api/seller/products?page={n}&size={n}` |
| 인증 | 세션 (판매자) |
| 입력 | 페이지 파라미터 |
| 출력 | `{ items, page, size, totalElements }` |

상품 서비스의 인증 인터셉터가 회원 서비스로 `/internal/auth/verify` Feign 호출을 보내 `sellerId` 를 받아옵니다. 그 뒤 `productRepository.findBySellerIdOrderByCreatedAtDesc` 로 페이징 조회.

### UC-10 상품 등록

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /api/seller/products` |
| 인증 | 세션 (판매자) |
| 입력 | `{ name, description, basePrice, categoryId, options: [...], images: [...] }` |
| 출력 | `{ productId }` |

판매자 권한 검증 후 단일 write TX 로 `Product / ProductOption / ProductImage / OptionStock` 을 INSERT 하고, 같은 트랜잭션이 끝나기 전에 Redis 재고 키 (`stock:option:{optionId}`) 를 초기 수량으로 SET 합니다. 별도 이벤트 발행은 없습니다 (검색 인덱스 비동기 갱신은 향후 확장 영역).

---

## 4. Internal 엔드포인트 (서비스 간 호출)

UI 가 직접 호출하지 않는 Feign 전용 엔드포인트입니다.

| 엔드포인트 | 호출자 → 피호출자 | 용도 |
|---|---|---|
| `GET /internal/auth/verify` | (모든 서비스) → 회원 | 세션 쿠키로 `accountId / memberId / sellerId` 복원 |
| `GET /internal/options/{optionId}` | 주문 → 상품 | 옵션 스냅샷 (`productId, sku, productName, optionName, unitPrice`) |
| `POST /internal/stocks/{optionId}/reserve` | 주문 → 상품 | Redis Lua 로 재고 선점 (성공 / 부족 / 키 없음) |
| `POST /internal/payments/confirm` | 주문 → 결제 | 토스 PG 승인 호출 (paymentKey + amount) |

응답은 모두 `CommonResponse<T>` 로 감싸집니다 (`common-modules` 참고).
