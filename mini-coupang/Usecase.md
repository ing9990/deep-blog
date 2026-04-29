# Usecase

mini-coupang 이 제공하는 사용자 동작 목록. 굵직한 3개 (회원가입 / 상품 주문 / 상품 검색) 만 다이어그램을 두고, 나머지는 API 명세만 둔다.

## 1. 사용자 시나리오 (구매 플로우)

1. 상품을 검색한다 → [UC-03 상품 검색](#uc-03-상품-검색)
2. 수량을 선택한다 (클라이언트 단계)
3. 결제하기 버튼을 클릭한다 → [UC-02 상품 주문](#uc-02-상품-주문)
4. 결제가 성공하면 상품을 수량만큼 주문 성공한다 → UC-02 의 성공 분기

## 2. Usecase 목록

| ID | Usecase | Endpoint | 인증 | 처리 서비스 | Diagram |
|---|---|---|---|---|---|
| UC-01 | 회원가입 (회원/판매자) | `POST /auth/signup/member`, `POST /auth/signup/seller` | 없음 | 회원 서비스, 알림 서비스 | [signup](diagrams/signup.md) |
| UC-02 | 상품 주문 | `POST /api/orders` | 세션 (회원) | 주문 / 회원 / 상품 / 결제 / 알림 서비스 | [place-order](diagrams/place-order.md) |
| UC-03 | 상품 검색 | `GET /api/products/search` | 없음 | 상품 서비스 | [product-search](diagrams/product-search.md) |
| UC-04 | 회원 로그인 | `POST /auth/login` | 없음 | 회원 서비스 | — |
| UC-05 | 판매자 로그인 | `POST /auth/login/seller` | 없음 | 회원 서비스 | — |
| UC-06 | 로그아웃 | `POST /auth/logout` | 세션 | 회원 서비스 | — |
| UC-07 | 내 정보 조회 | `GET /api/me` | 세션 | 회원 서비스 | — |
| UC-08 | 카테고리 목록 | `GET /api/categories` | 없음 | 상품 서비스 | — |
| UC-09 | 판매자 상품 목록 | `GET /api/seller/products` | 세션 (판매자) | 상품 서비스, 회원 서비스 | — |
| UC-10 | 상품 등록 | `POST /api/seller/products` | 세션 (판매자) | 상품 서비스, 회원 서비스 | — |

## 3. Usecase 상세

### UC-01 회원가입 (회원/판매자)

이메일과 비밀번호로 새 계정을 만들고, 회원 또는 판매자 프로필을 함께 영속화한다. 가입 성공 시 환영 알림 이벤트가 Kafka 로 발행된다. 자세한 흐름은 [signup](diagrams/signup.md).

### UC-02 상품 주문

사용자 시나리오의 핵심. 인증 → 옵션 스냅샷 조회 → Redis 재고 선점 → 결제 호출 → 주문 영속화 → 이벤트 발행 (성공) 또는 보상 이벤트 발행 (결제 실패) 의 순서. 5개 서비스를 거친다. 자세한 흐름은 [place-order](diagrams/place-order.md).

### UC-03 상품 검색

키워드로 상품을 찾는다. MySQL `LIKE` 단일 채널로 productId 목록을 뽑은 뒤 가격/카테고리 필터와 페이지네이션을 합성한다. 자세한 흐름은 [product-search](diagrams/product-search.md).

### UC-04 회원 로그인

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/login` |
| 인증 | 없음 |
| 입력 | `{ email, password }` |
| 출력 | `{ accountId, memberId }` + `Set-Cookie: SESSION=...` |

이메일/비밀번호를 BCrypt 로 검증하고 회원 권한 (`member.members` 행) 이 있는지 확인한 뒤 `HttpSession` 에 `accountId` 를 저장한다. 세션 자체는 Spring Session Redis 가 외부 저장 (`spring:session:sessions:{id}`).

### UC-05 판매자 로그인

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/login/seller` |
| 인증 | 없음 |
| 입력 | `{ email, password }` |
| 출력 | `{ accountId, sellerId }` + `Set-Cookie: SESSION=...` |

회원 로그인과 같지만 권한 검증을 `member.sellers` 로 한다. 같은 계정이 회원/판매자 양쪽 권한을 동시에 가질 수 있다.

### UC-06 로그아웃

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/logout` |
| 인증 | 세션 |
| 입력 | (없음, 쿠키만) |
| 출력 | `204 No Content` + `Set-Cookie: SESSION=; Max-Age=0` |

`HttpSession.invalidate()` 로 Redis 의 세션 키를 즉시 제거한다. 세션이 없는 요청도 동일한 응답으로 처리한다.

### UC-07 내 정보 조회

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `GET /api/me` |
| 인증 | 세션 |
| 입력 | (없음, 쿠키만) |
| 출력 | `{ accountId, email, memberId, sellerId }` |

세션 쿠키 → Redis 에서 `accountId` 복원 → `member` 스키마에서 Account + Member/Seller 정보를 반환. 회원/판매자 권한은 둘 다 `null` 일 수 있다 (계정만 있는 상태).

### UC-08 카테고리 목록

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `GET /api/categories` |
| 인증 | 없음 |
| 입력 | (없음) |
| 출력 | `{ categories: [...] }` |

product 스키마의 `categories` 테이블 전체를 반환한다.

### UC-09 판매자 상품 목록

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `GET /api/seller/products?page={n}&size={n}` |
| 인증 | 세션 (판매자) |
| 입력 | 페이지 파라미터 |
| 출력 | `{ items, page, size, totalElements }` |

상품 서비스의 인증 인터셉터가 회원 서비스로 `/internal/auth/verify` Feign 호출을 보내 `sellerId` 를 받아온다. 그 뒤 `productRepository.findBySellerIdOrderByCreatedAtDesc` 로 페이징 조회.

### UC-10 상품 등록

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /api/seller/products` |
| 인증 | 세션 (판매자) |
| 입력 | `{ name, description, basePrice, categoryId, options: [...], images: [...] }` |
| 출력 | `{ productId }` |

판매자 권한 검증 후 단일 write TX 로 Product / ProductOption / ProductImage / OptionStock 을 INSERT 하고, 같은 트랜잭션이 끝나기 전에 Redis 재고 키 (`stock:option:{optionId}`) 를 초기 수량으로 SET 한다. 별도 이벤트 발행은 없다 (검색 인덱스 비동기 갱신은 향후 확장 영역).
