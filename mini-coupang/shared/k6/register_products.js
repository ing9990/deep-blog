// Register seeded products through the public API so the full indexing path
// (Spring Boot -> AFTER_COMMIT -> gRPC -> Python ML -> Qdrant) is exercised.
//
// Usage:
//   docker run --rm -i \
//     -v $(pwd)/mini-coupang:/work \
//     -e BASE_URL=http://host.docker.internal:8080 \
//     grafana/k6 run /work/shared/k6/register_products.js
//
// Expects mini-coupang/shared/data/products.json (produced by generate_seed.py)
// and 15 sellers (seller1..seller15@seed.local, password "test1234!").

import http from 'k6/http';
import { check, fail } from 'k6';
import { SharedArray } from 'k6/data';

const PRODUCTS = new SharedArray('products', () =>
  JSON.parse(open('../data/products.json'))
);

const BASE = __ENV.BASE_URL || 'http://host.docker.internal:8080';
const SELLER_COUNT = 15;
const PASSWORD = __ENV.PASSWORD || 'test1234!';

export const options = {
  vus: 1,
  iterations: PRODUCTS.length,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{op:register}': ['p(95)<1500'],
  },
};

export function setup() {
  const cookies = {};
  const jar = http.cookieJar();
  for (let i = 1; i <= SELLER_COUNT; i++) {
    // Clear the jar before each login so the previous seller's JSESSIONID
    // is not resent (which would make Spring skip Set-Cookie on the new login).
    jar.clear(BASE);
    const res = http.post(
      `${BASE}/auth/login`,
      JSON.stringify({ email: `seller${i}@seed.local`, password: PASSWORD }),
      { headers: { 'Content-Type': 'application/json' }, tags: { op: 'login' } }
    );
    if (res.status !== 200) {
      fail(`seller${i} login failed: ${res.status} ${res.body}`);
    }
    const cookie = res.cookies['JSESSIONID'] && res.cookies['JSESSIONID'][0];
    if (!cookie) fail(`seller${i} JSESSIONID missing (Set-Cookie="${res.headers['Set-Cookie']}")`);
    cookies[i] = cookie.value;
  }
  return { cookies };
}

export default function (data) {
  const p = PRODUCTS[__ITER];
  const cookie = data.cookies[p.sellerIdx];
  const body = JSON.stringify({
    categoryId: p.categoryId,
    name: p.name,
    description: p.description,
    basePrice: p.basePrice,
    options: [],
    images: [],
  });
  const res = http.post(`${BASE}/api/seller/products`, body, {
    headers: {
      'Content-Type': 'application/json',
      Cookie: `JSESSIONID=${cookie}`,
    },
    tags: { op: 'register' },
  });
  check(res, {
    'register 201': (r) => r.status === 201,
  });
}
