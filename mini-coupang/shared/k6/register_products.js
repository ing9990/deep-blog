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
// k6 맛보기 (스크립트를 처음 보는 사람용):
// - k6 스크립트는 3개 훅으로 구성된다:
//     setup()    : 부하 시작 전 한 번만 실행. 반환값이 모든 VU의 default(data)에 전달된다.
//     default()  : "한 VU가 한 iteration에서 할 일". VUS × iterations 만큼 반복 호출.
//     teardown() : 부하 종료 후 한 번만 (이 스크립트는 미사용).
// - `__ITER`: k6가 주입하는 "이 VU의 현재 iteration 번호"(0부터). VU별로 독립된 카운터.
// - `__VU`: 현재 VU 번호(1부터). 이 스크립트는 __VU 대신 __ITER % SELLER_COUNT로 seller 배정.
// - `__ENV`: 환경변수 맵. `docker run -e KEY=VAL` 또는 OS env가 여기로 들어온다.
// - `options.iterations`: 전체 iteration 상한. duration과 둘 중 하나만 쓴다(여기선 iterations).
// - `check` vs `fail`: check는 실패 기록만 남기고 계속. fail은 즉시 테스트 중단(assert처럼).
// - `http.cookieJar()`: VU별 쿠키 저장소(브라우저 세션 비슷). setup에선 단일 VU 컨텍스트.
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

import http from 'k6/http';                      // k6 내장 HTTP 클라이언트
import { check, fail } from 'k6';                // check: 응답 검증(실패해도 계속), fail: 즉시 중단

// `__ENV`에서 환경변수 읽기. 기본값은 Docker 내부에서 호스트를 가리키는 host.docker.internal.
// 네이티브 k6로 돌릴 땐 BASE_URL=http://localhost:8080 로 오버라이드.
const BASE = __ENV.BASE_URL || 'http://host.docker.internal:8080';
const NAVER_CLIENT_ID = __ENV.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = __ENV.NAVER_CLIENT_SECRET || '';
const PRODUCT_COUNT = Number(__ENV.PRODUCT_COUNT || 100);
const SELLER_COUNT = Number(__ENV.SELLER_COUNT || 40);
const PASSWORD = __ENV.PASSWORD || 'test1234!';

// (category_id, query). generate_seed.py와 동일한 카테고리 매핑을 유지해
// 부하 테스트가 등록한 상품도 기존 카테고리 분포와 어긋나지 않게 한다.
const QUERIES = [
  [1, '텀블러'], [1, '보온병'], [1, '물병'], [1, '도시락'],
  [2, '노트북'], [2, '랩탑'], [2, '울트라북'], [2, '맥북'],
  [3, '운동화'], [3, '러닝화'], [3, '스니커즈'], [3, '구두'],
  [4, '키보드'], [4, '기계식키보드'], [4, '무선키보드'], [4, '마우스'],
  [5, '백팩'], [5, '등산가방'], [5, '캠핑백팩'], [5, '캐리어'],
  [6, '티셔츠'], [6, '셔츠'], [6, '청바지'], [6, '자켓'],
  [7, '모니터'], [7, '게이밍모니터'], [7, '울트라와이드'], [7, '4K모니터'],
  [8, '립스틱'], [8, '향수'], [8, '선크림'], [8, '마스크팩'],
  [9, '커피원두'], [9, '라면'], [9, '과자'], [9, '김치'],
  [10, '소설'], [10, '자기계발서'], [10, '전공서'], [10, '만화책'],
];
const NAVER_URL = 'https://openapi.naver.com/v1/search/shop.json';

// k6는 `options`로 export한 객체를 테스트 계획으로 읽는다.
export const options = {
  vus: Number(__ENV.VUS || 1),                  // 동시 VU 수
  iterations: PRODUCT_COUNT,                    // 전체 iteration 총량(모든 VU가 나눠서 처리).
                                                // duration과 둘 중 하나만 지정 가능.
  thresholds: {
    // 전체 HTTP 실패율 5% 미만 (네이버 API, login, register 포함한 모든 요청 기준)
    http_req_failed: ['rate<0.05'],
    // op:register 태그 요청만 필터해서 p95 응답시간 2초 이하
    'http_req_duration{op:register}': ['p(95)<2000'],
  },
};

function truncateBytes(text, maxBytes) {
  // products.name varchar(200)은 byte 단위. 한글 3byte를 넘으면 MySQL이
  // Data too long으로 reject한다. k6 goja에는 TextEncoder/Decoder가 없어서
  // encodeURIComponent로 UTF-8 이스케이프한 뒤 unescape로 "한 char = 1 byte"인
  // byte-string을 얻고, decodeURIComponent가 성공하는 경계까지 뒤로 물려 잘라낸다.
  const s = text || '';
  const encoded = unescape(encodeURIComponent(s));
  if (encoded.length <= maxBytes) return s;
  for (let end = maxBytes; end > 0; end--) {
    try {
      return decodeURIComponent(escape(encoded.slice(0, end)));
    } catch (e) {
      // 경계 깨짐, 한 byte 줄여 재시도.
    }
  }
  return '';
}

function cleanTitle(text) {
  return (text || '').replace(/<\/?b>/gi, '').trim();
}

// setup에서만 호출. 네이버 쇼핑 API로 상품 데이터를 PRODUCT_COUNT개 긁어온다.
// 부하 테스트 런타임 중에는 네이버를 치지 않도록 사전 수집해 놓는 것이 핵심.
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
          tags: { op: 'naver' },                // 네이버 호출 메트릭을 따로 볼 수 있게 op 태그 분리
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

// setup은 k6 런의 맨 앞에 딱 한 번 실행된다. 반환값 { cookies, products }는
// 모든 VU의 default(data) 첫 인자로 전달된다. VU는 이 데이터를 읽기 전용으로 공유한다.
export function setup() {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    // fail은 테스트를 즉시 중단시킨다. check가 "실패 기록"인 것과 달리 fail은 "정지".
    fail('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET env vars are required');
  }

  // 1) Seller 세션 확보. 각 로그인 직전에 cookie jar를 비워야 Spring이
  //    새 로그인 요청에 Set-Cookie를 다시 내려준다.
  //    `http.cookieJar()`는 현재 VU의 쿠키 저장소(setup에선 단일 VU 컨텍스트).
  //    Spring은 기존 JSESSIONID가 붙어있으면 "이미 로그인된 세션"으로 판단해
  //    새 Set-Cookie를 안 보낸다. 로그인마다 jar.clear()로 새 세션을 받는다.
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
    // `res.cookies`는 이 응답의 Set-Cookie에서 파싱된 쿠키 맵. 구조: { 이름: [배열] }
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
  // 이 반환값이 default(data)의 data 인자로 전달된다.
  return { cookies, products };
}

// default export = "한 VU가 한 iteration에서 할 일". k6가 iterations 횟수만큼 호출한다.
// `data`는 setup()의 반환값. 모든 VU가 같은 data 객체를 공유한다(읽기 전용).
export default function (data) {
  // `__ITER`는 이 VU의 iteration 카운터(0부터). VU별로 독립이라 VUS>1이면
  // 같은 번호를 여러 VU가 동시에 볼 수 있음에 주의.
  const p = data.products[__ITER];
  if (!p) return;                               // 수집된 상품보다 iteration이 많으면 no-op

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
      // 세션 쿠키를 직접 헤더로 실어보낸다. k6의 cookie jar 자동 첨부 대신 명시적 방식.
      // 이유: VU가 여러 개일 때 jar 간 쿠키가 섞이는 사고를 근본 차단.
      Cookie: `JSESSIONID=${cookie}`,
    },
    tags: { op: 'register' },                   // thresholds 및 Grafana에서 이 요청만 필터링
  });
  check(res, {
    'register 201': (r) => r.status === 201,
  });
}
