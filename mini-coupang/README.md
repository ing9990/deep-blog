# mini-coupang

# Usecase

[Usecase.md](Usecase.md) — 시스템이 제공하는 사용자 동작 목록과 흐름 다이어그램.

# Kafka-Topics

[Kafka-Topics.md](Kafka-Topics.md) — Kafka 토픽 목록, 네이밍 컨벤션, 메시지 봉투, 페이로드.

# Redis-Keys

[Redis-Keys.md](Redis-Keys.md) — Redis 키 패턴, 타입, TTL, 사용 명령.

---

Agent 친화 오버뷰. 각 섹션은 포인터 위주로 짧게 적혀 있으며, 세부 구현은 해당 파일/디렉터리를 직접 읽으면 된다.

## 1. 프로젝트 개요

- **정체**: DEEP 블로그 레포 내부 백엔드/프론트엔드 **학습 샌드박스**. 지원서·포트폴리오용.
- **도메인**: 쿠팡 스타일 e-커머스 (구매자·판매자·상품·검색). Actor 3종(구매자·판매자·관리자) 중 현재는 구매자/판매자만 구현.
- **실행 범위**: 로컬 전용. 외부 도메인(`api.ing9990.com`) 미연결, 배포 없음.
- **철학**: 단일 Spring Boot 모노리스. 문제를 측정해 병목이 확인된 뒤에만 인프라 승격. 스킬 `backend-architect` 규칙 따름.
- **상위 디렉터리**:
  ```
  mini-coupang/
  ├── backend/   # Spring Boot 3.5.9, Java 21, Gradle Groovy
  ├── ml/        # Python gRPC 서비스 (bge-m3 + Qdrant). Dockerfile로 컨테이너화됨
  ├── ui/        # Vite 7 + React 19 SPA (구매자·판매자 포털)
  └── shared/
      ├── docker/     # docker-compose.yml (mysql, redis, qdrant, ml, prometheus, grafana) + provisioning
      ├── proto/      # embed.proto (gRPC 계약, backend ↔ ml 공유)
      ├── k6/         # 등록/검색 부하 시나리오
      └── data/       # generate_seed.py (공개 API 경로 기반 시드), .env
  ```

## 2. 요구사항

### 기능 (현재 구현)

| 도메인 | 케이스 | 상태 |
|---|---|---|
| 인증 | 구매자 가입·로그인 | ✅ |
| 인증 | 판매자 가입·로그인 (포털 분리) | ✅ |
| 프로필 | `/me` (member/seller projection) | ✅ |
| 카테고리 | 루트 카테고리 5종 시드 + 조회 | ✅ |
| 상품 | 판매자 상품 등록 (옵션·이미지 배열) | ✅ |
| 상품 | 판매자 내 상품 목록 (페이지네이션, createdAt DESC) | ✅ |
| 상품 | 하이브리드 검색 (키워드 + 시맨틱 + RRF) | ✅ |
| 관측 | Prometheus + Grafana 대시보드 (D1/D2/D3) | ✅ (2026-04-24 복원) |
| 인덱싱 | 상품 등록 → Qdrant 비동기 인덱싱 | ✅ (2026-04-24) |

### 기능 (MVP 밖)

장바구니, 주문, 결제, 배송, 리뷰, 쿠폰, 위시리스트, 상품 상세 페이지, 프로필 편집, 이메일 인증, 이미지 업로드, 관리자 기능, i18n, 다크 모드.

### 비기능

- **인증 모델**: 같은 `accounts` 테이블에 member·seller 0..1씩 붙는 구조. 로그인 엔트리 완전 분리(`/auth/login` vs `/auth/login/seller`).
- **세션**: Tomcat `HttpSession`, `SameSite=Lax`, HttpOnly, 30분 timeout.
- **Same-origin**: UI는 Vite dev 프록시(`/api`, `/auth` → `:8080`)로 same-origin 쿠키 전달.
- **테스트**: 백엔드 `@SpringBootTest` + MockMvc + AssertJ. H2 테스트 프로파일.
- **CI**: `.github/workflows/ui.yml` (UI typecheck + build). 백엔드 CI는 별도.
- **관측**: Micrometer + Prometheus + Grafana 복원. 히스토그램 4종(`http.server.requests`, `embed.index.latency`, `product.indexing.queue.wait`, `product.indexing.e2e`).

## 3. 구현 현황

### 3.1 인프라 (Docker Compose)

파일: `shared/docker/docker-compose.yml`

| 서비스 | 이미지 | 포트 | 비고 |
|---|---|---|---|
| MySQL | `mysql:8.4` | 3306 | 주 스토리지. `mini_coupang` DB, user `mini`/`mini`, UTC+9 |
| Redis | `redis:7.4-alpine` | 6379 | 현재 미사용. 호스트에 redis 실행 중이면 compose redis는 skip |
| Qdrant | `qdrant/qdrant:v1.12.1` | 6333(REST), 6334(gRPC) | 벡터 DB. 시드 스크립트가 REST로 컬렉션 재생성 |
| ML | `build: ml/Dockerfile` | 50051 (gRPC) | python:3.12-slim + bge-m3 + qdrant-client. `hf-cache` 볼륨으로 모델 캐시 유지 |
| Prometheus | `prom/prometheus:v2.55.0` | 9090 | backend `/actuator/prometheus` 5초 스크레이프. `host.docker.internal` 로 호스트 backend 접근 |
| Grafana | `grafana/grafana:11.4.0` | 3000 | admin/admin. datasource + D1/D2/D3 대시보드 자동 provisioning |

모든 볼륨은 named docker volume (`mysql-data`, `redis-data`, `qdrant-data`, `hf-cache`, `prometheus-data`, `grafana-data`).

### 3.2 서버 토폴로지

| 컴포넌트 | 스택 | 포트 | 실행 |
|---|---|---|---|
| `backend/` | Spring Boot 3.5.9 · Java 21 · JPA · Lombok | 8080 | IntelliJ 또는 `./gradlew bootRun` |
| `ml/` | Python 3.12 · gRPC · bge-m3 · qdrant-client | 50051 | **docker compose** (Dockerfile 빌드) |
| `ui/` | Vite 7 · React 19 · TypeScript · pnpm | 5173 | `pnpm dev` |
| MySQL / Redis / Qdrant | compose | 3306 / 6379 / 6333-6334 | compose |
| Prometheus / Grafana | compose | 9090 / 3000 | compose |

backend 쪽 gRPC 클라이언트는 `net.devh:grpc-client-spring-boot-starter`. `application.yaml` → `grpc.client.embed.address: static://localhost:50051`.

ML 서비스는 환경변수 기반 설정 지원: `QDRANT_HOST`, `QDRANT_GRPC_PORT`, `QDRANT_COLLECTION`, `EMBED_PORT`, `EMBED_MODEL`. 기본값은 로컬 `make run` 호환.

### 3.3 통신 방식

| 호출 | 프로토콜 | 인증 |
|---|---|---|
| Browser → Vite dev server | HTTP | - |
| Vite → backend (`/api`, `/auth` 프록시) | HTTP/1.1 | 세션 쿠키 |
| Browser → backend (prod 시) | HTTP/1.1 | 세션 쿠키 |
| backend ↔ ml (EmbedService) | gRPC (HTTP/2, plaintext, protobuf) | 없음 (local only) |
| ml ↔ Qdrant | gRPC + REST (prefer_grpc=True) | 없음 |
| backend ↔ MySQL | JDBC | user/pass |
| **Prometheus → backend** | HTTP GET `/actuator/prometheus` (5s 간격) | 없음 |

gRPC 계약: `shared/proto/embed.proto`, `service EmbedService` 4개 RPC (EmbedAndIndex, SearchByQuery, FindSimilar, RemoveFromIndex).

### 3.4 동기·비동기 & 트랜잭션 경계

전체 플로우는 동기 요청-응답. 예외 1곳만 비동기.

- **상품 등록** (`POST /api/seller/products`)
  - 동기: JPA로 Product 저장
  - 커밋 후: `ProductRegistered` Spring ApplicationEvent 발행 (`publishedAt: Instant` 포함)
  - **비동기 리스너** (`@Async("productIndexingExecutor")` + `@TransactionalEventListener(AFTER_COMMIT)`): `ProductRegisteredListener`가 `EmbedPort.indexProduct()` gRPC 호출
  - **Timer 3개로 경로 분해**:
    - `product.indexing.queue.wait`: 이벤트 발행 ~ 리스너 진입 (큐 대기)
    - `embed.index.latency{outcome=success|failure}`: gRPC 왕복 + 임베딩
    - `product.indexing.e2e`: 발행 ~ 리스너 완료 (E2E 최종 일관성 지연)
  - 실패는 `log.warn` swallow + failure Timer 증가. 재시도/보상 없음(TODO).
- **상품 검색** (`GET /api/products/search`): 동기. 키워드 SQL + 시맨틱 gRPC 병렬 후 RRF 머지
- **인증·me·상품 목록·카테고리**: 전부 동기

**Executor** (`global/config/AsyncConfig.java`):
- `productIndexingExecutor`: core=2, max=4, queue=100, `CallerRunsPolicy`, thread prefix `product-idx-`
- **주의**: max=4는 초기 보수적 값. 2026-04-24 시드 실측(11,893건 주입)에서 `queued_tasks`가 99까지 포화되고 CallerRunsPolicy 발동으로 HTTP 스레드가 직접 처리하는 현상 관찰. 튜닝 실험은 다음 세션에서 진행.

### 3.5 DB / 저장소

| 저장소 | 용도 | 스키마 관리 | 현재 상태 (2026-04-24) |
|---|---|---|---|
| MySQL 8.4 | 트랜잭션 주 스토리지 | Hibernate `ddl-auto: update` | accounts 40, sellers 40, **products 11,893** |
| Qdrant 1.12.1 | 상품 벡터 (bge-m3, 1024차원, Cosine) | 시드 스크립트가 REST로 delete + create + index | **points 11,893** (MySQL과 완전 일치) |
| Redis | 미사용 | - | 컨테이너만 기동 (호스트 포트 충돌 시 skip) |

**엔티티 (JPA)**
- `accounts` (`domain/auth/domain/Account`): email unique, passwordHash (BCrypt)
- `members` (`domain/member/domain/Member`): account_id 1:1
- `sellers` (`domain/seller/domain/Seller`): account_id 1:1, business_name unique, business_registration_number unique
- `categories` (`domain/category/domain/Category`): 시드 5건
- `products` (`domain/product/domain/Product`): seller_id FK, category_id, name (**varchar(200), byte 기준**), description(TEXT), base_price, status(ACTIVE/SOLD_OUT/SUSPENDED)
- `product_options` / `product_images`: @OneToMany lazy on Product

**인증 컨텍스트**
- `AuthInterceptor`: 세션 `AUTH_ACCOUNT_ID`를 `AuthContextHolder`(ThreadLocal)로 적재
- `@LoginRequired` + `LoginAccountIdArgumentResolver`: 파라미터에 accountId 주입, 없으면 `UnauthenticatedException(401)`

### 3.6 API 엔드포인트

| Method & Path | Controller | 인증 | 비고 |
|---|---|---|---|
| `POST /auth/signup/member` | `AuthController` | public | Account + Member 원자적. 중복 email → 409 |
| `POST /auth/signup/seller` | `AuthController` | public | Account + Seller 원자적. 중복 BRN → 400 |
| `POST /auth/login` | `AuthController` | public | Member 필수 |
| `POST /auth/login/seller` | `AuthController` | public | Seller 필수 |
| `POST /auth/logout` | `AuthController` | public | 세션 무효화 |
| `GET /api/me` | `MeController` | `@LoginRequired` | member/seller projection |
| `GET /api/categories` | `CategoryController` | public | 루트 5개 |
| `GET /api/products/search` | `ProductSearchController` | public | 하이브리드 검색 (SQL + gRPC + RRF) |
| `POST /api/seller/products` | `SellerProductController` | `@LoginRequired` + Seller 필수 | 등록 → `ProductRegistered` 발행 |
| `GET /api/seller/products?page&size` | `SellerProductController` | `@LoginRequired` + Seller 필수 | 내 상품 페이지네이션 |
| `GET /actuator/health` | Actuator | public | |
| `GET /actuator/prometheus` | Actuator | public | **Prometheus 스크레이프 대상** |

### 3.7 주요 도메인 구조

```
domain/
├── auth/         # Account, AuthService, @LoginRequired, AuthContextHolder
├── member/       # Member, MemberSignupService
├── seller/       # Seller, SellerSignupService
├── category/     # Category, CategoryService
├── me/           # MeService, MeController
├── product/
│   ├── domain/   # Product, ProductOption, ProductImage, ProductStatus
│   ├── application/
│   │   ├── event/      # ProductRegistered (publishedAt 포함)
│   │   ├── listener/   # ProductRegisteredListener (@Async + AFTER_COMMIT)
│   │   ├── port/out/   # EmbedPort + 도메인 DTO
│   │   └── ranking/    # RrfRanker
│   ├── controller/     # ProductSearchController
│   └── seller/         # 판매자 관점: application, controller
└── common/       # BaseEntity
infrastructure/
└── clients/embed/      # EmbedGrpcAdapter, EmbedGrpcProperties, EmbedAdapterException
global/
└── config/             # AsyncConfig(@EnableAsync + productIndexingExecutor), AuthConfig, JpaConfig, WebConfig
```

### 3.8 프론트엔드 구조 (`ui/`)

(변동 없음, 이전 버전 참조)

### 3.9 실행

```bash
# 0) 인프라 전체 (mysql + redis + qdrant + ml + prometheus + grafana)
cd mini-coupang/shared/docker
docker compose up -d

# 1) Backend (IntelliJ 또는)
cd mini-coupang/backend && ./gradlew bootRun      # :8080

# 2) Frontend (선택)
cd mini-coupang/ui && pnpm install && pnpm dev    # :5173

# 3) Seed (최초 1회 또는 리셋 시) — 약 22분 소요
cd mini-coupang
set -a; source shared/data/.env; set +a
./ml/.venv/bin/python shared/data/generate_seed.py \
  --sellers 40 --products 12000 --concurrency 8

# 완료 기준:
#   - MySQL products 카운트 == Qdrant points_count == N
#   - [done] MySQL=11893 Qdrant=11893 출력
```

헬스체크: `curl http://localhost:8080/actuator/health`, `curl http://localhost:6333/collections/products`, `curl http://localhost:9090/-/ready`, `curl http://localhost:3000/api/health`.

### 3.10 테스트

```bash
# 백엔드 단위/통합 테스트
cd mini-coupang/backend && ./gradlew test

# 프론트 typecheck + build
cd mini-coupang/ui && pnpm build

# k6 부하 (등록)
set -a; source mini-coupang/shared/data/.env; set +a
docker run --rm -i -v "$(pwd)/mini-coupang:/work" \
  -e BASE_URL=http://host.docker.internal:8080 \
  -e NAVER_CLIENT_ID -e NAVER_CLIENT_SECRET \
  -e PRODUCT_COUNT=500 -e VUS=4 \
  grafana/k6 run /work/shared/k6/register_products.js

# k6 부하 (검색)
docker run --rm -i -v "$(pwd)/mini-coupang:/work" \
  -e BASE_URL=http://host.docker.internal:8080 \
  -e VUS=10 -e DURATION=60s \
  grafana/k6 run /work/shared/k6/search_products.js
```

### 3.11 관측 스택

- **Backend 측**: `io.micrometer:micrometer-registry-prometheus` 의존성 · `/actuator/prometheus` 노출
- **application.yaml 히스토그램**: `embed.index.latency`, `http.server.requests`, `product.indexing.queue.wait`, `product.indexing.e2e` (각각 p50/p95/p99)
- **Prometheus**: `:9090`, backend 5초 스크레이프
- **Grafana**: `:3000` (admin/admin), datasource + 대시보드 자동 provisioning

| 대시보드 | uid | 주제 |
|---|---|---|
| D1 인덱싱 이벤트 큐 | `mc-event-queue` | `productIndexingExecutor` queued/active/pool/completed + embed latency |
| D2 등록 → 검색 노출 지연 | `mc-indexing-e2e` | 구간별 p95 비교 (queue.wait · embed.index · e2e) + 실패율 |
| D3 검색 API 지연 | `mc-search-latency` | `/api/products/search` p50/p95/p99 + RPS + 에러율 + 상태 코드 분포 |

provisioning 파일: `shared/docker/grafana/provisioning/{datasources,dashboards}/`.

### 3.12 시드 데이터

`shared/data/generate_seed.py` — 네이버 쇼핑 API 기반, 공개 API 경로로 주입.

```
1. Naver Shopping API 로 N건 수집 (QUERIES 15개, dedup)
2. (옵션) MySQL TRUNCATE + Qdrant collection REST 재생성
3. POST /auth/signup/seller x 40 (409 skip, 멱등)
4. POST /auth/login/seller x 40 → cookie
5. POST /api/seller/products 를 ThreadPoolExecutor 로 병렬 (기본 concurrency=8)
6. Qdrant points_count 가 target 에 도달할 때까지 polling
```

- **SQL 파일 방식 폐기** (2026-04-24): SQL 직접 적재는 JPA 이벤트 우회라 Qdrant 에 반영되지 않아 MySQL ↔ Qdrant 불일치
- 파라미터: `--sellers`, `--products`, `--concurrency`, `--base-url`, `--qdrant-url`, `--no-reset`
- 의존성: ml venv(`ml/.venv/bin/python`)의 requests, python-dotenv, bcrypt 사용 가능

## 4. 주요 기술 결정 & 안티패턴 방어

- **단일 모놀리스 유지**: 3-서비스 MSA + Kafka + Debezium 조합은 2026-04-22 드롭
- **Hexagonal 포트 필수**: 외부 시스템 호출은 `port/out/` + `infrastructure/clients/` 분리
- **단일 구현 interface 금지**: domain 내부 application 서비스는 interface+Impl 쌍 금지. Hexagonal 포트·JPA Repository는 예외
- **DTO 경계**: Controller ↔ Service 간 Request/Response + Command/Result 4종
- **세션 키**: `SessionKeys.AUTH_ACCOUNT_ID` 상수 한 곳
- **상품 등록 후 인덱싱 = 비동기** (2026-04-24): `@Async` + AFTER_COMMIT. 실패는 log.warn swallow + failure Timer. 이유: 판매자 UX는 등록 응답 속도 우선 / ML 지연이 HTTP 응답에 전파되지 않도록 격리
- **시드는 공개 API 경로** (2026-04-24): SQL 적재는 JPA 이벤트 우회 문제. 구조적으로 MySQL ↔ Qdrant 일치 보장
- **커밋·PR 에 AI 마커 금지**
- **브랜치 컨벤션**: `develop-<name>` → `feature-<name>` → `main`, squash merge

## 5. 현재 진행 상태 (2026-04-24 기준)

- 현재 브랜치: `develop-backend-observability` (base: `feature-backend-ml`)
- 주요 커밋 (최신 → 과거):
  - `f6d208f refactor(seed): API 경로 전환으로 MySQL ↔ Qdrant 자동 일치`
  - `039ac7a refactor(k6): register_products.js 네이버 API 기반 동적 수집`
  - `7c5b376 feat(seed): 40 sellers + 12,000 products 단일 seed_data.sql.gz` (이후 f6d208f 에서 파일 삭제)
  - `fe83b84 feat(ml): containerize ML service with env-based config`
  - `3574417 chore(k6): add hybrid search load scenario`
  - `d0f11d9 feat(backend): async product indexing with queue and e2e latency metrics`
  - `e4d1a0d chore(observability): add Prometheus + Grafana with provisioned dashboards`
- DB: MySQL 11,893 products / Qdrant 11,893 points / 40 sellers
- 시드 주입(`generate_seed.py`) 22분 15초, fail 0. 시드는 부하 테스트 대상이 아니므로 블로그에서는 "검색·등록 측정을 위해 시드 상품 1만여 건을 미리 준비했다" 수준으로만 언급한다.
- **다음 세션 예정**: 상품 등록 부하 테스트 (`register_products.js`), 검색 성능 테스트 (`search_products.js`), blog-writer 로 블로그 포스트 작성

## 6. 참고 문서

- `backend/README.md`
- `ml/README.md`
- `ui/README.md`
- `shared/proto/embed.proto` (gRPC 계약)
- `shared/data/README.md` (**주의**: SQL 기반 워크플로 설명이 남아있다면 outdated. 현재는 API 기반 `generate_seed.py` 가 단일 경로)
- 블로그: gRPC essentials, Qdrant 입문 (DEEP 블로그)
