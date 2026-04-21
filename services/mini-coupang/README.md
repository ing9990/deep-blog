# mini-coupang

**단일 Spring Boot Monolith.** 이커머스 백엔드 샌드박스. seller + product 도메인이 한 앱 안에서 `domain/{subdomain}` 패키지로 분리되어 있다. MSA 분리 시점은 `domain-design.md` §1.5 승격 체크리스트가 충족되는 시점 (예: 배포 독립성 또는 스케일 축 분화가 측정으로 입증).

## 현재 단계

**Phase 2 Step 8a**: Prometheus + Grafana 관측 스택과 함께, 두 서비스(seller-service · product-service)를 monolith로 통합.

## 레이아웃

```
mini-coupang/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/libs.versions.toml
└── src/
    ├── main/
    │   ├── kotlin/com/deepblog/minicoupang/
    │   │   ├── MiniCoupangApplication.kt
    │   │   ├── domain/
    │   │   │   ├── seller/
    │   │   │   │   ├── Seller.kt              (entity)
    │   │   │   │   ├── api/SellerController.kt + dto/
    │   │   │   │   ├── service/SellerService.kt
    │   │   │   │   └── storage/SellerRepository.kt
    │   │   │   └── product/
    │   │   │       ├── Product.kt
    │   │   │       ├── api/
    │   │   │       ├── service/
    │   │   │       └── storage/
    │   │   ├── global/          (공용 설정 — 현재 비어 있음)
    │   │   └── infrastructure/  (외부 연동 — 현재 비어 있음)
    │   └── resources/application.yml
    └── test/kotlin/com/deepblog/minicoupang/domain/...
```

`domain/{name}`이 **MSA 분리 시 서비스 경계**가 된다.

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/sellers` | 판매자 등록 |
| `GET` | `/api/v1/sellers/{id}` | 단건 조회 |
| `POST` | `/api/v1/products` | 상품 등록 |
| `GET` | `/api/v1/products/{id}` | 상품 단건 |
| `GET` | `/api/v1/products?sellerId={id}` | 판매자별 상품 목록 |
| `GET` | `/actuator/health` | Spring Actuator health |
| `GET` | `/actuator/prometheus` | Prometheus scrape endpoint |

## 실행

```bash
# 인프라 기동 (Postgres + Prometheus + Grafana)
cd services && docker compose up -d postgres prometheus grafana

# 앱 기동
cd services/mini-coupang && ./gradlew bootRun
# → localhost:8080
```

기존에 `.volumes/postgres/`에 seller_db/product_db가 있으면 새 DB (`minicoupang_db`)가 생성되지 않는다. 초기화:

```bash
docker compose down
rm -rf .volumes/postgres
docker compose up -d postgres
```

## 테스트

```bash
./gradlew test
# → 16/16 (seller 7 + product 9)
```

Testcontainers 기반 integration 테스트. 로컬 Postgres 불필요.

## 스택

| 항목 | 값 |
|---|---|
| 언어 | Kotlin 2.1 |
| JVM | Java 21 (Virtual Threads enabled) |
| 프레임워크 | Spring Boot 3.3.5 |
| ORM | Spring Data JPA + Hibernate |
| DB | PostgreSQL 16 (`minicoupang_db`) |
| 테스트 | JUnit 5 + Testcontainers |
| 관측 | Micrometer + Prometheus |
| 빌드 | Gradle 8.14 (Kotlin DSL + Version Catalog) |
| 포트 | 8080 |

## MSA 전환 체크리스트 (향후)

현재 monolith에서 각 `domain/{name}`을 별 서비스로 뽑을 조건은 `.claude/skills/service-builder/references/domain-design.md` §1.5 참조. 요약:

- 배포 독립성이 필요한가? (상품만 hotfix 하루 N회 → product 분리)
- 스케일 축이 2배 이상 분화? (상품 조회 QPS ≫ 판매자 조회)
- 장애 격리 필요? (한 도메인 장애가 다른 도메인 응답에 영향)

이 조건이 **측정으로 입증**되기 전엔 분리하지 않음.
