# mini-coupang Usecase 카탈로그

현재까지 구현된 사용자 동작과 그 처리 흐름을 한 곳에 모은다. 새 기능을 추가할 때 이 표를 먼저 갱신한 뒤 코드를 만든다. 각 usecase 의 아키텍처 다이어그램은 `diagrams/` 디렉토리에 1:1 로 매핑된다.

## 표기

| 마크 | 의미 |
|---|---|
| ✅ | 모놀리스 `backend/` 에서 구현 완료. 사용 가능 |
| 🔄 | 모놀리스에서 구현 완료, MSA 서비스로 이전 대상 (Phase 1~5) |
| 📝 | 미구현, 마이그레이션 후 신규 |

## Usecase 표

| ID | Usecase | 엔드포인트 | 인증 | 상태 | 현재 위치 → 목표 위치 | 다이어그램 |
|---|---|---|---|---|---|---|
| UC-01 | 회원가입 | `POST /auth/signup/member` | 없음 | 🔄 | backend → member-server | [01-member-signup.md](diagrams/01-member-signup.md) |
| UC-02 | 판매자 가입 | `POST /auth/signup/seller` | 없음 | 🔄 | backend → member-server | [02-seller-signup.md](diagrams/02-seller-signup.md) |
| UC-03 | 회원 로그인 | `POST /auth/login` | 없음 | 🔄 | backend → member-server | [03-member-login.md](diagrams/03-member-login.md) |
| UC-04 | 판매자 로그인 | `POST /auth/login/seller` | 없음 | 🔄 | backend → member-server | [04-seller-login.md](diagrams/04-seller-login.md) |
| UC-05 | 로그아웃 | `POST /auth/logout` | 세션 | 🔄 | backend → member-server | [05-logout.md](diagrams/05-logout.md) |
| UC-06 | 내 정보 조회 | `GET /api/me` | 세션 | 🔄 | backend → member-server | [06-me.md](diagrams/06-me.md) |
| UC-07 | 카테고리 목록 | `GET /api/categories` | 없음 | 🔄 | backend → product-server | [07-list-categories.md](diagrams/07-list-categories.md) |
| UC-08 | 상품 검색 (하이브리드) | `GET /api/products/search` | 없음 | 🔄 | backend (+ml/) → product-server (+ml/) | [08-product-search.md](diagrams/08-product-search.md) |
| UC-09 | 판매자 상품 목록 | `GET /api/seller/products` | 세션 | 🔄 | backend → product-server | [09-seller-list-products.md](diagrams/09-seller-list-products.md) |
| UC-10 | 상품 등록 | `POST /api/seller/products` | 세션 | 🔄 | backend → product-server | [10-register-product.md](diagrams/10-register-product.md) |
| UC-11 | 주문 생성 | `POST /api/orders` | 세션 | 🔄 | backend (+payment-server) → order-server (+ product-server, payment-server) | [11-place-order.md](diagrams/11-place-order.md) |

## 사용자 시나리오 (구매 플로우)

블로그 §1 에서 명시한 사용자 시나리오를 위 UC 매핑으로 재기술한다.

1. **상품을 조회한다** → UC-08 (검색) 또는 카테고리 페이지 (UC-07 + 추후 카테고리별 목록 UC)
2. **수량을 선택한다** → 클라이언트 단계, 서버 호출 없음
3. **결제하기 버튼을 클릭한다** → UC-11 (주문 생성). 내부적으로 재고 선점 + 결제 + 주문 영속화 + 이벤트 발행
4. **결제가 성공하면 상품을 수량만큼 주문 성공한다** → UC-11 의 성공 분기

UC-11 가 이 시나리오의 핵심이며 트랜잭션 / 분산 / 보상 / 비동기 이벤트가 모두 등장한다.

## 새 Usecase 추가 절차

1. 위 표에 새 행을 추가 (다음 UC-12, UC-13, ...).
2. `diagrams/{id}-{name}.md` 작성 (포맷은 기존 파일 참고).
3. 새 토픽이 발생하면 `Kafka-Topics.md` 에 추가.
4. 새 Redis 키가 발생하면 `Redis-Keys.md` 에 추가.
5. 코드 작성은 `CONVENTIONS.md` 를 따른다.
