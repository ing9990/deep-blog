// Hybrid search scenario. Drives /api/products/search with concurrent VUs so
// http_server_requests_seconds_bucket{uri="/api/products/search"} accumulates
// enough samples to render p50/p95/p99 in the D3 Grafana dashboard.
//
// Usage:
//   docker run --rm -i \
//     -v $(pwd)/mini-coupang:/work \
//     -e BASE_URL=http://host.docker.internal:8080 \
//     grafana/k6 run /work/shared/k6/search_products.js
//
// Tuning via env:
//   VUS        concurrent users (default 10)
//   DURATION   test duration   (default 30s)

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://host.docker.internal:8080';
const VUS = Number(__ENV.VUS || 10);
const DURATION = __ENV.DURATION || '30s';

const QUERIES = [
  'bag',
  'leather',
  'shoes',
  'laptop',
  'phone',
  'jacket',
  'watch',
  'book',
  'keyboard',
  'headphones',
];

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{op:search}': ['p(95)<500'],
  },
};

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const res = http.get(
    `${BASE}/api/products/search?q=${encodeURIComponent(q)}&limit=20`,
    { tags: { op: 'search' } }
  );
  check(res, {
    'search 200': (r) => r.status === 200,
  });
  sleep(0.1);
}
