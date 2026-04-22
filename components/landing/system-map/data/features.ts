import type { Feature } from '../types'

export const features: Feature[] = [
  // ───────── 주문 ─────────
  {
    id: 'order.cart-add',
    domain: 'order',
    requirement: '사용자는 장바구니에 상품을 추가할 수 있다.',
    architecture:
      'Client → cart-service → Redis(Hash). 로그인/비로그인 상관없이 Redis에만 쓴다.',
    status: 'planned',
    tags: ['redis', 'session'],
    choices: [
      {
        text: '장바구니는 Postgres가 아닌 Redis에 저장한다.',
        reason:
          '장바구니는 "상태가 아니라 의도"에 가깝고 수정 빈도가 높다. 영속 DB에 올리면 쓰기 부하가 도메인 본연의 트래픽을 압도한다.',
      },
      {
        text: '비로그인 사용자는 디바이스 ID 기반 게스트 카트를 갖고, 로그인 시 서버가 병합한다.',
        reason:
          '구매 전 이탈을 막는 UX 가치가 크고, 병합 로직을 서버에 두면 클라이언트 종류가 늘어도 재구현이 없다.',
      },
    ],
    challenges: [
      {
        problem: '로그인 전후 장바구니 내용이 사라짐.',
        solution:
          '게스트 카트 키(guest:{deviceId})를 login 이벤트 수신 시 user:{userId}로 머지, 둘 다 TTL 30일.',
      },
    ],
  },
  {
    id: 'order.cart-checkout',
    domain: 'order',
    requirement: '사용자는 장바구니에 담긴 상품을 주문할 수 있다.',
    architecture:
      'Client → order-service가 Saga 오케스트레이터. 재고 예약(product-service, sync) → 결제(payment-service, sync) → 주문 commit + outbox → Kafka fan-out(알림/적립/배송/분석).',
    status: 'planned',
    tags: ['saga', 'idempotency', 'redis-lua', 'outbox', 'kafka'],
    choices: [
      {
        text: '장바구니 상품 중 일부만 품절일 때 주문 전체를 실패시키고, 어떤 상품이 부족한지 응답에 담는다.',
        reason:
          '부분 성공은 UX도 모호하고 환불·보상이 복잡해진다. "뭐가 빠졌는지"를 명시하면 사용자는 장바구니에서 해당 항목만 빼고 재시도할 수 있다.',
      },
      {
        text: '재고 예약 · 결제는 REST(동기), 알림 · 적립 · 배송 · 분석은 Kafka(비동기)로 분리한다.',
        reason:
          '사용자 대기 구간을 최소화하는 게 곧 가용성이다. 동기 체인이 길어지면 가용성이 곱셈으로 떨어지고(0.999³≈99.7%), 주문 본질과 무관한 실패가 사용자에게 전가된다.',
      },
      {
        text: '주문 INSERT와 outbox INSERT를 같은 트랜잭션에 묶고, CDC가 Kafka로 publish한다.',
        reason:
          '"DB commit 성공 + Kafka publish 실패"의 정합성 구멍을 제거한다. 서비스 코드는 오직 DB만 만지면 된다.',
      },
    ],
    challenges: [
      {
        problem: '결제는 성공했는데 재고가 없어서 주문이 깨짐 (race condition).',
        solution:
          '재고 차감을 Redis + Lua script로 원자화. GET → DECR → reservation SETEX를 단일 round-trip으로 처리하고, 실패 시 즉시 409 반환.',
      },
      {
        problem:
          '클라이언트 재시도로 같은 주문이 두 번 들어옴. 네트워크 타임아웃 상황에서 특히 잦다.',
        solution:
          'Idempotency-Key 헤더를 Redis에 24h 캐시. 같은 키 재요청은 이전 응답을 그대로 돌려준다.',
      },
      {
        problem: '결제 실패 시 이미 차감된 재고가 영원히 잠김 (좀비 예약).',
        solution:
          'reservation 키에 10분 TTL. 결제 실패 시 즉시 보상(INCR + DEL), TTL 만료 시 스캐너가 자동 회수.',
      },
      {
        problem: '한 사용자가 같은 장바구니를 동시에 두 번 제출하는 레이스.',
        solution:
          'Redisson 분산락 lock:order:{userId}를 SET NX EX 30s로 잡고, 해제는 lua 스크립트로 토큰 매칭.',
      },
    ],
  },

  // ───────── 판매자 ─────────
  {
    id: 'seller.create-store',
    domain: 'seller',
    requirement: '판매자는 상점을 만들 수 있다.',
    architecture:
      'Client → seller-service → seller-db. 판매자 인증 후 stores 테이블에 INSERT.',
    status: 'planned',
    tags: ['validation'],
    choices: [
      {
        text: '판매자 계정과 상점을 1:N으로 두되, 상품은 상점에만 귀속한다.',
        reason:
          '같은 판매자가 브랜드별로 분리된 스토어를 운영하는 경우가 실제로 흔하다. 상점을 1차 스코프로 만들면 정산·공지·쿠폰을 상점 단위로 정의할 수 있다.',
      },
    ],
    challenges: [],
  },
  {
    id: 'seller.register-product',
    domain: 'seller',
    requirement: '판매자는 상점에 상품을 등록할 수 있다.',
    architecture:
      'seller-service가 DB에 제품 메타를 쓰고 product-created 이벤트를 Kafka에 발행. 이미지 리사이즈·검색 인덱싱은 각 서비스가 구독해 비동기 처리.',
    status: 'planned',
    tags: ['kafka', 'fan-out', 'outbox'],
    choices: [
      {
        text: '상점·판매자 유효성은 REST(동기), 이미지 리사이즈 · 검색 인덱싱은 Kafka(비동기)로 나눈다.',
        reason:
          '유효성은 사용자에게 "등록이 됐다"를 돌려주기 위한 동기 판단이지만, 썸네일 3-way 리사이즈와 ES 인덱싱은 5–10초 규모 작업이다. 사용자 대기 구간에 끼우면 UX가 무너진다.',
      },
      {
        text: '이미지 원본은 S3에 직접 업로드(Presigned URL), 메타만 API로 받는다.',
        reason:
          '서버 비용·대역폭 · 메모리 부담 모두 원본 업로드에서 나온다. 서버를 중계로 두지 않으면 수평 확장이 자연스러워진다.',
      },
    ],
    challenges: [
      {
        problem:
          '상품 등록은 성공했는데 검색 결과에는 안 잡힘 (인덱싱 컨슈머 지연).',
        solution:
          '등록 직후 UI에 "검색 반영 중" 표시. product-created 이벤트에 search-index-updated 완료 이벤트를 후행시켜 front가 상태를 조회 가능하게 함.',
      },
      {
        problem: '리사이즈 실패 시 상품이 썸네일 없이 노출될 위험.',
        solution:
          'product_images에 status(pending/ready/failed) 컬럼. ready가 아닌 이미지는 노출 목록에서 제외, 실패는 재시도 DLQ로 보냄.',
      },
    ],
  },

  // ───────── 상품 ─────────
  {
    id: 'product.detail',
    domain: 'product',
    requirement: '사용자는 상점 페이지에서 상품 상세를 볼 수 있다.',
    architecture:
      'product-service가 Redis(product:{id})를 먼저 조회, 캐시 미스일 때만 Postgres로 내려간다. 응답 후 캐시에 써넣음.',
    status: 'planned',
    tags: ['cache-aside', 'stampede', 'redis'],
    choices: [
      {
        text: 'Cache-Aside 패턴을 쓰되, 미스 시 싱글플라이트로 DB 동시 조회를 제한한다.',
        reason:
          '핫 상품 캐시가 만료되는 순간 DB에 동일 쿼리가 폭주한다(thundering herd). 싱글플라이트는 1개 쿼리만 실제로 나가고 나머지는 대기 후 같은 결과를 공유한다.',
      },
      {
        text: '캐시 TTL은 1시간, 쓰기는 CDC로 무효화한다.',
        reason:
          'TTL만 있으면 최악의 경우 1시간 동안 stale. CDC로 쓰기 시 즉시 DEL하면 정합성 창을 밀리초 단위로 좁힐 수 있다.',
      },
    ],
    challenges: [
      {
        problem: '캐시 스탬피드: 핫 상품 TTL 만료 순간 DB 쿼리가 수백 배로 튀는 현상.',
        solution:
          '요청 레벨에서 싱글플라이트로 합치고, 만료 직전에 백그라운드 재계산(stale-while-revalidate).',
        postSlug: 'cache-aside-pattern',
      },
    ],
  },
]
