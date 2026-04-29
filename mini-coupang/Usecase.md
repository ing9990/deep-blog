# Usecase

mini-coupang 이 제공하는 사용자 동작 목록. 각 항목은 처리 흐름이 그려진 다이어그램으로 연결된다.

## 1. 사용자 시나리오 (구매 플로우)

1. 상품을 조회한다 → [UC-08](#uc-08-상품-검색)
2. 수량을 선택한다 (클라이언트 단계)
3. 결제하기 버튼을 클릭한다 → [UC-11](#uc-11-주문-생성)
4. 결제가 성공하면 상품을 수량만큼 주문 성공한다 → UC-11 의 성공 분기

## 2. Usecase 목록

| ID | Usecase | Endpoint | 인증 | 처리 서비스 | Diagram |
|---|---|---|---|---|---|
| UC-01 | 회원가입 | `POST /auth/signup/member` | 없음 | member-server | [01](diagrams/01-member-signup.md) |
| UC-02 | 판매자 가입 | `POST /auth/signup/seller` | 없음 | member-server | [02](diagrams/02-seller-signup.md) |
| UC-03 | 회원 로그인 | `POST /auth/login` | 없음 | member-server | [03](diagrams/03-member-login.md) |
| UC-04 | 판매자 로그인 | `POST /auth/login/seller` | 없음 | member-server | [04](diagrams/04-seller-login.md) |
| UC-05 | 로그아웃 | `POST /auth/logout` | 세션 | member-server | [05](diagrams/05-logout.md) |
| UC-06 | 내 정보 조회 | `GET /api/me` | 세션 | member-server | [06](diagrams/06-me.md) |
| UC-07 | 카테고리 목록 | `GET /api/categories` | 없음 | product-server | [07](diagrams/07-list-categories.md) |
| UC-08 | 상품 검색 | `GET /api/products/search` | 없음 | product-server, ml | [08](diagrams/08-product-search.md) |
| UC-09 | 판매자 상품 목록 | `GET /api/seller/products` | 세션 (판매자) | product-server, member-server | [09](diagrams/09-seller-list-products.md) |
| UC-10 | 상품 등록 | `POST /api/seller/products` | 세션 (판매자) | product-server, member-server, ml | [10](diagrams/10-register-product.md) |
| UC-11 | 주문 생성 | `POST /api/orders` | 세션 (회원) | order-server, member-server, product-server, payment-server, notification-server | [11](diagrams/11-place-order.md) |

## 3. Usecase 상세

### UC-01 회원가입
이메일과 비밀번호로 새 계정과 회원 프로필을 만든다. 이메일 중복은 거부. 가입 성공 시 가입 알림 이벤트 발행.
[Diagram](diagrams/01-member-signup.md)

### UC-02 판매자 가입
판매자 등록. 회원가입과 동일한 계정 모델 위에 판매자 프로필을 추가. 환영 알림 이벤트 발행.
[Diagram](diagrams/02-seller-signup.md)

### UC-03 회원 로그인
이메일/비밀번호 검증 후 세션 발급. 같은 계정이 회원으로 로그인.
[Diagram](diagrams/03-member-login.md)

### UC-04 판매자 로그인
판매자 권한으로 세션 발급. 같은 계정이 판매자 권한으로 로그인.
[Diagram](diagrams/04-seller-login.md)

### UC-05 로그아웃
세션 무효화. 세션이 없는 요청도 정상 응답.
[Diagram](diagrams/05-logout.md)

### UC-06 내 정보 조회
세션의 계정/회원/판매자 정보를 반환.
[Diagram](diagrams/06-me.md)

### UC-07 카테고리 목록
상품 카테고리 전체를 반환.
[Diagram](diagrams/07-list-categories.md)

### UC-08 상품 검색
키워드 + 가격/카테고리 필터로 상품을 검색. lexical (sparse) + semantic (dense) 두 채널을 Qdrant 의 RRF 융합으로 합쳐 결과를 정렬.
[Diagram](diagrams/08-product-search.md)

### UC-09 판매자 상품 목록
로그인한 판매자의 상품을 페이지 단위로 반환.
[Diagram](diagrams/09-seller-list-products.md)

### UC-10 상품 등록
상품 + 옵션 + 이미지 + 초기 재고를 한 트랜잭션으로 저장. 등록 후 Redis 재고 키 셋업과 Qdrant 검색 색인이 비동기 적용.
[Diagram](diagrams/10-register-product.md)

### UC-11 주문 생성
사용자 시나리오의 핵심. 인증 → 도메인 조회 → Redis 재고 선점 → 결제 → 주문 영속화 → 이벤트 발행 (성공) 또는 보상 이벤트 발행 (결제 실패) 의 순서. 5개 서비스를 거친다.
[Diagram](diagrams/11-place-order.md)
