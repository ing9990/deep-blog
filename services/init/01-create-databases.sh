#!/usr/bin/env bash
# Runs ONCE on first container start (when the data directory is empty).
# The Postgres official image executes any *.sh / *.sql in
# /docker-entrypoint-initdb.d/ in lexical order.
#
# We use one Postgres instance with per-service databases instead of one
# instance per service. That's fine for Phase 1 MVP; if services later
# need isolated instances (different versions, extensions, restart
# schedules), split at that point.

set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE seller_db;
  CREATE DATABASE product_db;
EOSQL

echo "Created databases: seller_db, product_db"
