// Product registration load test.
//
// 1) setup(): 40명 seller 로그인(seed_data.sql.gz 기준), cookie jar는 로그인
//    사이에 비운다(메모리 feedback-k6-session-cookie-jar). 그리고 네이버 쇼핑
//    API에서 PRODUCT_COUNT건을 수집한다.
// 2) default(): 각 iteration마다 판매자의 등록 API를 친다. 이 경로가
//    AFTER_COMMIT -> @Async productIndexingExecutor -> gRPC -> ML -> Qdrant
//    까지 통과하므로 D1(인덱싱 큐) / D2(E2E 지연) / D3(응답 지연) 대시보드가
//    모두 동시에 채워진다.
//
// 특징:
// - 시드 DB(40 sellers / 11,922 products)는 레코드를 삭제하지 않는다.
//   본 테스트가 추가로 N건을 등록하는 구조.
// - 네이버 API 호출은 setup에서만. 테스트 런타임 중에는 외부 네트워크에 나가지
//   않으므로 측정 지표가 오염되지 않는다.
//
// Usage:
//   set -a; source mini-coupang/shared/data/.env; set +a
//   docker run --rm -i \
//     -v $(pwd)/mini-coupang:/work \
//     -e BASE_URL=http://host.docker.internal:8080 \
//     -e NAVER_CLIENT_ID -e NAVER_CLIENT_SECRET \
//     -e PRODUCT_COUNT=200 -e VUS=4 \
//     grafana/k6 run /work/shared/k6/register_products.js

import http from 'k6/http';
import { check, fail } from 'k6';

const BASE = __ENV.BASE_URL || 'http://host.docker.internal:8080';
const NAVER_CLIENT_ID = __ENV.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = __ENV.NAVER_CLIENT_SECRET || '';
const PRODUCT_COUNT = Number(__ENV.PRODUCT_COUNT || 100);
const SELLER_COUNT = Number(__ENV.SELLER_COUNT || 40);
const PASSWORD = __ENV.PASSWORD || 'test1234!';

// (category_id, query). generate_seed.py와 동일한 카테고리 매핑을 유지해
// 부하 테스트가 등록한 상품도 기존 카테고리 분포와 어긋나지 않게 한다.
const QUERIES = [
  [1, '텀블러'], [1, '보온병'], [1, '물병'],
  [2, '노트북'], [2, '랩탑'], [2, '울트라북'],
  [3, '운동화'], [3, '러닝화'], [3, '스니커즈'],
  [4, '키보드'], [4, '기계식키보드'], [4, '무선키보드'],
  [5, '백팩'], [5, '등산가방'], [5, '캠핑백팩'],
];
const NAVER_URL = 'https://openapi.naver.com/v1/search/shop.json';

export const options = {
  vus: Number(__ENV.VUS || 1),
  iterations: PRODUCT_COUNT,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    'http_req_duration{op:register}': ['p(95)<2000'],
  },
};

function truncateBytes(text, maxBytes) {
  // products.name varchar(200)은 byte 단위. 한글 3byte를 넘어 201byte가 되면
  // MySQL이 Data too long으로 reject한다. UTF-8 byte 기준으로 자르고
  // 경계에서 깨지는 multi-byte는 TextDecoder가 버린다(fatal: false).
  const enc = new TextEncoder();
  const dec = new TextDecoder('utf-8', { fatal: false });
  const bytes = enc.encode(text);
  if (bytes.length <= maxBytes) return text;
  return dec.decode(bytes.slice(0, maxBytes));
}

function cleanTitle(text) {
  return (text || '').replace(/<\/?b>/gi, '').trim();
}

function collectProducts(target) {
  const out = [];
  const seen = new Set();
  for (const [cid, query] of QUERIES) {
    for (let start = 1; start <= 1000; start += 100) {
      const res = http.get(
        `${NAVER_URL}?query=${encodeURIComponent(query)}&display=100&start=${start}&sort=sim`,
        {
          headers: {
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
          },
          tags: { op: 'naver' },
        }
      );
      if (res.status !== 200) break;
      const body = res.json();
      const items = body.items || [];
      if (items.length === 0) break;
      for (const item of items) {
        const name = truncateBytes(cleanTitle(item.title), 200);
        if (name.length < 2 || seen.has(name)) continue;
        seen.add(name);
        const brand = (item.brand || item.maker || '').trim();
        const description = `${brand} ${name}`.trim().slice(0, 500);
        const price = parseInt(item.lprice, 10) || 0;
        out.push({
          categoryId: cid,
          name,
          description,
          basePrice: price,
        });
        if (out.length >= target) return out;
      }
    }
  }
  return out;
}

export function setup() {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    fail('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET env vars are required');
  }

  // 1) Seller 세션 확보. 각 로그인 직전에 cookie jar를 비워야 Spring이
  //    새 로그인 요청에 Set-Cookie를 다시 내려준다.
  const cookies = {};
  const jar = http.cookieJar();
  for (let i = 1; i <= SELLER_COUNT; i++) {
    jar.clear(BASE);
    const res = http.post(
      `${BASE}/auth/login/seller`,
      JSON.stringify({ email: `seller${i}@seed.local`, password: PASSWORD }),
      { headers: { 'Content-Type': 'application/json' }, tags: { op: 'login' } }
    );
    if (res.status !== 200) {
      fail(`seller${i} login failed: ${res.status} ${res.body}`);
    }
    const cookie = res.cookies['JSESSIONID'] && res.cookies['JSESSIONID'][0];
    if (!cookie) fail(`seller${i} JSESSIONID missing`);
    cookies[i] = cookie.value;
  }

  // 2) 네이버 쇼핑에서 PRODUCT_COUNT건 수집. VU 실행 전 1회.
  const products = collectProducts(PRODUCT_COUNT);
  if (products.length < PRODUCT_COUNT) {
    console.warn(
      `collected ${products.length}/${PRODUCT_COUNT} products; ` +
      `excess iterations will no-op`
    );
  }
  console.log(`setup complete: ${SELLER_COUNT} sessions, ${products.length} products`);
  return { cookies, products };
}

export default function (data) {
  const p = data.products[__ITER];
  if (!p) return;
  // seller를 round-robin으로 배정해 한 계정에 부하가 몰리지 않게 한다.
  const sellerIdx = 1 + (__ITER % SELLER_COUNT);
  const cookie = data.cookies[sellerIdx];
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
