# services — backend sandbox

`/services/` is the Spring Boot Kotlin backend sandbox attached to the DEEP blog. Built incrementally as a mini Coupang. Stack contract, module layout, and Phase roadmap live in `.claude/skills/service-builder/references/project-architecture.md`.

## Current phase

**Phase 1a — Step 1**: Postgres only. No service code yet.

The goal of this step is to make `docker compose up -d postgres` work, and to verify that `psql` can connect and list `seller_db` + `product_db`. Spring Boot services come in the next step.

## Quick start

```bash
cd services

# Start Postgres
docker compose up -d postgres

# Wait for healthcheck to go green (~5s)
docker compose ps

# Verify the per-service databases exist
docker compose exec postgres psql -U deep -c '\l'

# Connect manually
docker compose exec postgres psql -U deep -d seller_db
# \q  to exit
```

## Stop / reset

```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop + drop anonymous volumes
rm -rf .volumes/postgres     # wipe persistent data on host
```

## Credentials (local only)

| | |
|---|---|
| user | `deep` |
| password | `deep_local` |
| host | `localhost` |
| port | `5432` |
| bootstrap DB | `deep` |
| service DBs | `seller_db`, `product_db` |

## Layout

```
services/
├── docker-compose.yml                    # infrastructure (Phase 1a: Postgres)
├── init/
│   └── 01-create-databases.sh            # runs on first Postgres start
├── .volumes/                             # local volumes (gitignored)
└── README.md
```

Service code will be added here in subsequent steps:

```
services/
├── seller-service/      # Step 2-6
└── product-service/     # Step 7
```

## Notes

- **Observability stack** (Prometheus, Grafana, OTel Collector, Tempo) is deferred to later steps. It's intentional: each piece gets introduced with the concept that needs it, not all at once.
- **Schema isolation via database, not instance**: one Postgres, one DB per service. If services later need isolated instances (different versions, restart schedules, etc.), split then.
- **DB init is one-shot**: `init/*.sh` runs only when the data directory is empty. To re-run after adding a new DB, either add a migration in the service itself or wipe `.volumes/postgres/` and bring the container back up.
