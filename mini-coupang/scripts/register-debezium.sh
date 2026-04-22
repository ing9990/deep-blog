#!/usr/bin/env bash
# Kafka Connect에 seller-outbox-connector 등록. compose up 이후 한 번만 실행.
set -euo pipefail

CONNECT_URL="${CONNECT_URL:-http://localhost:8084}"
CONFIG_FILE="$(dirname "$0")/../observability/debezium/seller-outbox-connector.json"

echo "waiting for Kafka Connect at ${CONNECT_URL}..."
until curl -sf "${CONNECT_URL}/connectors" >/dev/null; do
  sleep 2
done

name="seller-outbox-connector"
if curl -sf "${CONNECT_URL}/connectors/${name}" >/dev/null 2>&1; then
  echo "connector ${name} already exists, updating config"
  curl -sf -X PUT \
    -H "Content-Type: application/json" \
    --data "$(jq '.config' "${CONFIG_FILE}")" \
    "${CONNECT_URL}/connectors/${name}/config" | jq .
else
  echo "registering connector ${name}"
  curl -sf -X POST \
    -H "Content-Type: application/json" \
    --data "@${CONFIG_FILE}" \
    "${CONNECT_URL}/connectors" | jq .
fi

echo
echo "status:"
curl -sf "${CONNECT_URL}/connectors/${name}/status" | jq .
