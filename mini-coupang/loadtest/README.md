# loadtest

k6 시나리오 모음. 결과는 `results/<date>/` 아래에 JSON·HTML로 커밋해서 회귀를 추적한다.

## 실행 (docker 이미지)

`docker-compose.yml`에 `k6` 서비스가 `loadtest` profile로 정의되어 있다.

```bash
# catalog 상세 조회 p95/p99 베이스라인 측정
K6_RUN_ID=2026-04-22-product-detail \
  docker compose --profile loadtest run --rm k6 run /scripts/product-detail.js

# 결과는 loadtest/results/2026-04-22-product-detail.json 에 저장
```

환경 변수:

| 변수 | 기본 | 용도 |
|---|---|---|
| `BASE_URL` | `http://host.docker.internal:8083` | 타겟 서비스 URL |
| `PRODUCT_ID` | `9001` | 조회 대상 |
| `K6_RUN_ID` | `last` | 결과 파일명 |

## 로컬 k6 바이너리로 돌리고 싶다면

```bash
brew install k6
k6 run -e PRODUCT_ID=9001 loadtest/scripts/product-detail.js
```

## 사전 준비

- 서비스가 로컬에서 떠 있어야 함 (`./gradlew :product-service:bootRun`).
- 측정 대상 상품이 DB에 있어야 함. 없으면 seller-service API로 먼저 등록해 Kafka 파이프로 흘려보내거나, 수동으로 `catalog_products`에 행을 넣는다.

## 지표 확인

- Prometheus: http://localhost:9190
- Grafana (익명 admin): http://localhost:3100 — Explore → Prometheus에서 `http_server_requests_seconds_{count,sum}` 쿼리
- Tempo: Grafana Explore → Tempo에서 `service.name="product-service"` 로 트레이스 확인
