# product-service

상품(Product) 도메인을 담당하는 Spring Boot Kotlin 서비스. seller-service와 동일한 스택을 따름.

## 현재 단계

**Phase 1 Step 7 완료**: product-service 기본 REST API.

- Gradle Kotlin DSL + Version Catalog
- Spring Boot 3.3 + Kotlin 2.1 + Java 21 Virtual Threads
- Spring Data JPA + Postgres 16 (`product_db`)
- `Product` 엔티티: `sellerId` 참조 + `sellerName` 스냅샷, 원화 `Long` price, stock, @Version
- Testcontainers 통합 테스트

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/products` | 상품 등록. body: `{sellerId, sellerName, name, price, stock}` |
| `GET` | `/api/v1/products/{id}` | 단건 조회 |
| `GET` | `/api/v1/products?sellerId={id}` | 판매자별 상품 목록 |
| `GET` | `/actuator/health` | Spring Actuator |

## 판매자 정보 스냅샷 설계

Product는 Seller와 **다른 aggregate**이므로 ID 참조(`sellerId: Long`)만 유지하고 `sellerName`은 등록 시점 스냅샷으로 저장. 판매자가 나중에 이름을 바꿔도 과거 상품에는 소급 적용하지 않는다. 이 결정의 근거와 대안(매 조회 시 동기 호출, 이벤트 기반 upsert)은 `.claude/skills/service-builder/references/domain-design.md` §4 + `project-architecture.md` 통합 패턴 옵션 A 참조.

## 실행

```bash
# Postgres 먼저 (services/docker-compose.yml)
cd services && docker compose up -d postgres

# 서비스 기동
cd services/product-service && ./gradlew bootRun

# 등록
curl -i -X POST http://localhost:8082/api/v1/products \
  -H 'Content-Type: application/json' \
  -d '{
    "sellerId": 1,
    "sellerName": "Coupang Seller",
    "name": "스마트폰",
    "price": 1200000,
    "stock": 10
  }'

# 조회
curl http://localhost:8082/api/v1/products/1
curl "http://localhost:8082/api/v1/products?sellerId=1"
```

## 포트

- `product-service`: **8082** (seller-service는 8081)

## 레이아웃

seller-service와 동일한 단일 모듈. multi-module 분리(`storage:domain`, `storage:core-db`, `core:core-api`)는 추후 refactor step에서.
