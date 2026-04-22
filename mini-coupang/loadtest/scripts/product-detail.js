import http from 'k6/http';
import { check, sleep } from 'k6';

// 전시 상세 조회 경로의 베이스라인. product-service가 떠 있고
// catalog_products 에 id=9001 행이 있다고 가정 (integration test seed 또는 수동 투입).
// 환경 변수로 productId 를 바꿔가며 돌릴 수 있다.
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8083';
const PRODUCT_ID = __ENV.PRODUCT_ID || '9001';

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{expected_response:true}': ['p(95)<200', 'p(99)<400'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/products/${PRODUCT_ID}`, {
    tags: { endpoint: 'catalog_product_detail' },
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has data.id': (r) => r.json('data.id') !== undefined,
  });
  sleep(1);
}
