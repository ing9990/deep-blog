# Seed Data

Generates `001_sellers.sql` and `002_products.sql` from the Naver Shopping Open API and loads them into the local MySQL. Both `.sql` files and `.env` are gitignored.

## Prereqs

- `.env` with `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` (apply at https://developers.naver.com).
- `mini-coupang-mysql` container running.
- ML venv has `requests` and `python-dotenv` installed.

## Regenerate SQL

```bash
mini-coupang/ml/.venv/bin/python mini-coupang/shared/data/generate_seed.py
```

5 categories × 200 products each = 1000 rows. Top 15 `mallName` values become sellers; the rest are bucketed into those 15 deterministically (seed 42).

## Load into MySQL (DEV ONLY — truncates commerce tables)

```bash
cd mini-coupang/shared/data
docker exec -i mini-coupang-mysql mysql -h127.0.0.1 -umini -pmini mini_coupang < 001_sellers.sql
docker exec -i mini-coupang-mysql mysql -h127.0.0.1 -umini -pmini mini_coupang < 002_products.sql
```

## Reindex into Qdrant

SQL inserts bypass JPA, so the `ProductRegistered` event never fires and Qdrant stays empty. After loading the SQL, hit the admin reindex endpoint (see backend) to replay every product through `EmbedPort.indexProduct`.
