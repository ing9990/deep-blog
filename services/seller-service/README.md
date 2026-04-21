# seller-service

판매자(Seller) 도메인을 담당하는 Spring Boot Kotlin 서비스. DEEP 블로그의 mini Coupang 샌드박스 중 하나.

## 현재 단계

**Phase 1 Step 6 완료**: seller-service 기본 REST API까지 동작.

누적:
- Gradle Kotlin DSL + Version Catalog (Step 2)
- Spring Boot 3.3 + Kotlin 2.1 + Java 21 Virtual Threads (Step 2)
- Spring Data JPA + Postgres 16 driver + Hibernate (Step 4)
- `Seller` 엔티티 + `SellerRepository` (Step 4)
- Testcontainers 통합 테스트 (`@ServiceConnection`, Step 4)
- Bean Validation 기반 request DTO + service + controller (Step 6)
- `POST /api/v1/sellers`, `GET /api/v1/sellers/{id}` (Step 6)
- MockMvc end-to-end 테스트 5건 (Step 6)

아직 없는 것:
- Multi-module 분리 (`storage:domain`, `storage:core-db`, `core:core-api`) — 추후 refactor
- product-service (Step 7)
- 관측성 스택 (Prometheus, Grafana, OTel, k6) — Step 8~11

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/sellers` | 판매자 등록. body: `{name, email}`. 201 + `Location` 헤더 |
| `GET`  | `/api/v1/sellers/{id}` | 단건 조회. 200 or 404 |
| `GET`  | `/actuator/health` | Spring Actuator health |

## 예시 요청 (bootRun 중)

```bash
# Postgres 먼저 기동
cd services && docker compose up -d postgres

# 서비스 기동
cd services/seller-service && ./gradlew bootRun

# 등록
curl -i -X POST http://localhost:8081/api/v1/sellers \
  -H 'Content-Type: application/json' \
  -d '{"name":"Toss Seller","email":"toss@example.com"}'

# 조회 (생성 응답의 id 사용)
curl http://localhost:8081/api/v1/sellers/1
```

## 실행

```bash
cd services/seller-service

./gradlew build        # 컴파일 + 테스트 (Step 2에는 테스트 없음)
./gradlew bootRun      # Spring Boot 기동
```

기동 후 확인:

```bash
curl http://localhost:8081/actuator/health
# {"status":"UP","groups":["liveness","readiness"]}
```

중단은 Ctrl-C 또는:

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN -t | xargs -r kill -TERM
```

## 스택 (이번 단계까지)

| 항목 | 값 |
|---|---|
| JDK | 21 (Gradle toolchain, Virtual Threads enabled) |
| 언어 | Kotlin 2.1 |
| 빌드 | Gradle 8.14 + Kotlin DSL + Version Catalog (`gradle/libs.versions.toml`) |
| 프레임워크 | Spring Boot 3.3.5 |
| 포트 | 8081 |

## 레이아웃

```
services/seller-service/
├── build.gradle.kts             # 플러그인 alias, 의존성
├── settings.gradle.kts          # 단일 모듈
├── gradle/
│   ├── libs.versions.toml       # Version Catalog
│   └── wrapper/                 # gradle-wrapper.jar 포함
├── gradlew / gradlew.bat        # 래퍼 스크립트
└── src/
    └── main/
        ├── kotlin/com/deepblog/seller/
        │   └── SellerServiceApplication.kt
        └── resources/
            └── application.yml
```

**Multi-module 분리**(`storage:domain`, `storage:core-db`, `core:core-api`)는 JPA 도입(Step 4~6) 시 도입. 초기부터 완성형 레이아웃을 만들지 않는다.

## 다음 단계

- **Step 4**: `storage:domain`, `storage:core-db` 모듈 분리 + Postgres JPA 연결
- **Step 5**: Testcontainers 통합 테스트
- **Step 6**: REST `POST /api/v1/sellers`, `GET /api/v1/sellers/{id}`
