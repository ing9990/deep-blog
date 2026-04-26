// Hybrid search scenario. Drives /api/products/search at a fixed QPS so
// http_server_requests_seconds_bucket{uri="/api/products/search"} accumulates
// enough samples to render p50/p95/p99 in the D3 Grafana dashboard.
//
// k6 맛보기 (스크립트를 처음 보는 사람용):
// - k6는 JS로 부하 시나리오를 쓰는 부하 테스트 도구. Node가 아니라 Goja 엔진 위에서 돈다.
// - "VU(Virtual User)"가 동시 사용자 수. open model에서는 VU가 "발사대" 역할만 한다.
// - default 함수를 한 번 실행한 것이 "1 iteration".
// - `thresholds`는 pass/fail SLO. 어기면 k6 exit code가 비-0이 돼 CI에서 실패로 잡힌다.
// - `check`는 assertion 비슷하지만 실패해도 실행은 계속. 성공률만 집계한다.
// - `tags`는 메트릭에 라벨을 붙여 op별로 쪼개 볼 수 있게 해준다.
//
// Closed vs Open model:
// - Closed (vus + sleep): VU 수가 동시성 상한이라 응답이 느려지면 발사 페이스가 자동으로 느려진다.
//   서버를 의도한 QPS로 때리지 못하고 "이 VU 수에서 낼 수 있는 최대 처리량"만 측정된다.
// - Open (constant-arrival-rate): k6가 1초당 RPS회 iteration을 강제로 발사한다.
//   서버가 느려져도 발사 페이스는 유지 → 진짜 "목표 QPS에서의 응답시간 분포"를 본다.
//   대신 VU가 부족해 발사를 못 한 횟수(dropped_iterations)를 반드시 0으로 만들어야 측정이 유효하다.
//
// Usage:
//   docker run --rm -i \
//     -v $(pwd)/mini-coupang:/work \
//     -e BASE_URL=http://host.docker.internal:8080 \
//     -e RPS=100 -e DURATION=1m \
//     grafana/k6 run /work/shared/k6/search_products.js
//
// Tuning via env:
//   RPS                 목표 초당 요청 수 (default 50)
//   DURATION            테스트 길이      (default 30s)
//   PRE_ALLOCATED_VUS   시작 시 띄워둘 VU 풀 (default 50)
//   MAX_VUS             자동 확장 상한       (default 200)

import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL || 'http://host.docker.internal:8080';
const RPS = Number(__ENV.RPS || 50);
const DURATION = __ENV.DURATION || '30s';
const PRE_ALLOCATED_VUS = Number(__ENV.PRE_ALLOCATED_VUS || 50);
const MAX_VUS = Number(__ENV.MAX_VUS || 200);

// 각 iteration마다 이 풀에서 하나를 골라 검색 쿼리로 쓴다. 특정 쿼리 편향을 줄이기 위한 풀.
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
  scenarios: {
    search_load: {
      executor: 'constant-arrival-rate',
      rate: RPS,                              // 초당 발사할 iteration 수 = 목표 QPS
      timeUnit: '1s',                         // rate의 시간 단위
      duration: DURATION,
      preAllocatedVUs: PRE_ALLOCATED_VUS,     // 시작 시 미리 띄워두는 VU 풀
      maxVUs: MAX_VUS,                        // 부족하면 여기까지 자동 확장
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{op:search}': ['p(95)<500', 'p(99)<800'],
    // open model에서는 dropped_iterations를 반드시 본다.
    // VU 풀이 부족해서 발사를 못 한 횟수 → 0이 아니면 그 구간은 목표 QPS가 안 들어간 것이라
    // 측정된 응답시간 분포가 의도한 부하의 결과가 아니게 된다.
    dropped_iterations: ['count<1'],
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
  // sleep() 없음. open model에서는 k6가 직접 발사 페이스를 제어하므로
  // think time을 넣으면 VU 점유 시간만 길어져 maxVUs가 더 필요해질 뿐 QPS는 그대로다.
}
