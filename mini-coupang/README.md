# mini-coupang

DEEP 블로그의 백엔드 샌드박스. drf-commerce 패턴을 참조한 3-서비스 멀티프로젝트.

## 구성

| 모듈 | 포트 | 역할 |
|---|---|---|
| `common-module` | (라이브러리) | EventEnvelope, CommonResponse, ErrorCodeSpec 등 세 서비스가 공유하는 프로토콜 타입 |
| `member-service` | 8081 | 회원 가입·로그인(JWT) |
| `seller-service` | 8082 | 판매자 로그인, 상품 등록/수정/삭제 |
| `product-service` | 8083 | 상품 전시, 재고, 카테고리 |

자세한 스택 계약·패키지 패턴·Kafka/Redis/Feign 패턴은 `.claude/skills/service-builder/references/project-architecture.md` 참조.

## 빌드

```bash
./gradlew build
```

## 실행 (로컬)

```bash
# 인프라 (Postgres×3 + Redis + Kafka + Zookeeper)
docker compose up -d

# 서비스 (각각 별 터미널)
./gradlew :member-service:bootRun
./gradlew :seller-service:bootRun
./gradlew :product-service:bootRun
```

## 포트 할당

| 대상 | 포트 |
|---|---|
| member-service | 8081 |
| seller-service | 8082 |
| product-service | 8083 |
| postgres-member | 5442 |
| postgres-seller | 5443 |
| postgres-product | 5444 |
| redis | 6390 |
| kafka | 9092 |
| zookeeper | 2181 |

> 다른 로컬 프로젝트가 5432/6379를 점유 중이라 충돌을 피해 5442~5444, 6390으로 잡음.
