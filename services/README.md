# services — backend sandbox

`/services/` is the Spring Boot Kotlin backend sandbox attached to the DEEP blog. Built incrementally as a mini Coupang. Stack contract, module layout, and Phase roadmap live in `.claude/skills/service-builder/references/project-architecture.md`.

## Current phase

**Phase 2 Step 8a**: Observability 스택 — Prometheus + Grafana 도입. 서비스는 `/actuator/prometheus`를 노출하고 Prometheus가 15초마다 scrape.

누적 구성:
- Postgres 16 (`seller_db`, `product_db`)
- seller-service (8081) + product-service (8082)
- **Prometheus 2.55** (9090) — scrape: 자신 + seller-service + product-service
- **Grafana 11.3** (3000) — Prometheus datasource 자동 프로비저닝, 익명 Viewer 허용

## Quick start

```bash
cd services

# 인프라 전체 기동
docker compose up -d postgres prometheus grafana

# 서비스는 각 디렉토리에서
(cd seller-service  && ./gradlew bootRun) &
(cd product-service && ./gradlew bootRun) &

# 상태 확인
docker compose ps

# Postgres DB 리스트
docker compose exec postgres psql -U deep -c '\l'

# Prometheus target (모두 "health":"up"이어야 함)
curl -s http://localhost:9090/api/v1/targets | \
  jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Grafana UI (익명 접근)
open http://localhost:3000

# 메트릭 쿼리 예시
curl -s 'http://localhost:9090/api/v1/query?query=up' | jq '.data.result'
```

## Stop / reset

```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop + drop anonymous volumes
rm -rf .volumes/postgres     # wipe persistent data on host
```

## Credentials (local only)

| Target | Host | Port | 인증 |
|---|---|---|---|
| Postgres | `localhost` | 5432 | user `deep` / pw `deep_local` / DBs: `deep`, `seller_db`, `product_db` |
| seller-service | `localhost` | 8081 | 없음 (MVP) |
| product-service | `localhost` | 8082 | 없음 (MVP) |
| Prometheus | `localhost` | 9090 | 없음 |
| Grafana | `localhost` | 3000 | 익명 Viewer / admin `admin`·`deep_local` |

## Layout

```
services/
├── docker-compose.yml                  # 공용 인프라: postgres + prometheus + grafana
├── init/
│   └── 01-create-databases.sh          # Postgres 첫 기동 시 DB 생성
├── observability/
│   ├── prometheus/prometheus.yml       # scrape 대상: seller/product/self
│   └── grafana/provisioning/
│       └── datasources/prometheus.yml  # Prometheus 자동 등록
├── seller-service/                     # Spring Boot · Kotlin · 8081
├── product-service/                    # Spring Boot · Kotlin · 8082
├── .volumes/                           # postgres/prometheus/grafana 영속 볼륨 (gitignore)
└── README.md
```

## Notes

- **스키마 격리: DB로, 인스턴스로 X**: 단일 Postgres에 서비스별 DB. 버전/재시작 주기가 분기하면 그때 인스턴스 분리.
- **DB init은 1회**: `init/*.sh`는 데이터 디렉토리가 비어 있을 때만 실행. 새 DB는 서비스 쪽 마이그레이션으로 추가(Phase 2 후반 Flyway 도입 예정) 또는 `.volumes/postgres/` 삭제 후 재기동.
- **Prometheus scrape**: 호스트에서 동작하는 서비스를 컨테이너가 긁기 위해 `host.docker.internal` 사용. macOS Docker Desktop에서 기본 동작. Linux는 `extra_hosts`로 매핑 필요.
- **관측 다음 단계**: OpenTelemetry Collector + Tempo(분산 trace), k6 부하 시나리오는 후속 step에서.
