import type { Feature } from '../types'

export const features: Feature[] = [
  // ───────── 판매자 ─────────
  {
    id: 'seller.create-store',
    domain: 'seller',
    requirement: '판매자는 상점을 만들 수 있다.',
    architecture:
      'seller-service가 인증된 판매자로부터 요청을 받아 seller-db의 stores에 INSERT. 한 판매자는 N개의 상점을 소유할 수 있고, 상품은 상점에만 귀속한다.',
    status: 'in-progress',
    tags: ['validation'],
    choices: [
      {
        text: '판매자 계정과 상점은 1:N, 상품은 상점에만 귀속한다.',
        reason:
          '같은 판매자가 브랜드별로 분리된 스토어를 운영하는 경우가 실제로 흔하다. 상점을 1차 스코프로 두면 정산 · 공지 · 쿠폰을 상점 단위로 정의할 수 있다. (ADR 0001)',
      },
      {
        text: '상점 소유권 검증은 매 쓰기 요청마다 서비스 계층에서 한다.',
        reason:
          '판매자 A가 판매자 B의 상점 · 상품을 건드리는 사고를 컨트롤러 앞에서 거르지 않고, 엔티티 로드 직후 `isOwnedBy(sellerId)`로 차단한다. 권한 규칙이 한 곳에 모여 있어 누락 가능성이 줄어든다.',
      },
    ],
    challenges: [],
  },
  {
    id: 'seller.register-product',
    domain: 'seller',
    requirement: '판매자는 상점에 상품을 등록할 수 있다.',
    architecture:
      'seller-service가 seller_products INSERT와 같은 트랜잭션으로 outbox_events INSERT. Debezium이 Postgres logical replication을 읽어 Kafka(`seller.product` 토픽)로 발행하고, product-service 컨슈머가 읽기 전용 catalog_products에 반영한다. 로컬 · 테스트는 `OutboxRelay` 폴러가 같은 역할.',
    status: 'in-progress',
    tags: ['outbox', 'kafka', 'debezium', 'idempotency'],
    choices: [
      {
        text: '즉시 응답에 필요한 데이터는 동기 REST · FeignClient, 다른 서비스로의 확산은 Kafka로 나눈다.',
        reason:
          '판매자 대기 구간은 "유효성 · 소유권 확인 + DB commit"만으로 짧게 끝나야 한다. 검색 인덱싱이나 하위 도메인 반영 같은 5–10초급 작업을 동기 체인에 끼우면 가용성이 곱셈으로 떨어진다.',
      },
      {
        text: 'DB 커밋과 Kafka 발행을 Transactional Outbox로 묶는다.',
        reason:
          '"DB 성공 + Kafka publish 실패"의 정합성 구멍을 없애기 위해, 서비스 코드는 outbox_events 한 테이블만 건드린다. 실제 발행은 Debezium CDC가 책임지므로 분산 트랜잭션 없이도 at-least-once 보장이 성립한다.',
      },
      {
        text: '`outbox_events.aggregate_type` 값을 그대로 Kafka 토픽명으로 쓴다.',
        reason:
          '토픽 라우팅을 코드 매핑 테이블로 들고 있으면 진화할 때마다 두 곳을 바꿔야 한다. 테이블 자체가 계약서가 되도록 하면 schema evolution 규칙도 한 벽에만 붙일 수 있다 (필드 추가만 허용, 파괴적 변경 시 `.v2` 토픽 신설).',
      },
      {
        text: '쓰기 엔드포인트에 Idempotency-Key 헤더를 강제한다.',
        reason:
          '클라이언트 재시도 · 네트워크 타임아웃 상황에서 같은 상품이 두 번 등록되는 사고를 HTTP 레이어에서 차단한다. AOP Aspect가 Redis(24h)로 첫 응답을 캐싱해 같은 키 재요청에는 그대로 돌려준다.',
      },
    ],
    challenges: [
      {
        problem: 'DB는 커밋됐는데 Kafka 발행이 실패해 하위 도메인이 상품을 못 본다.',
        solution:
          '쓰기 커맨드와 같은 트랜잭션에서 outbox_events INSERT, 실제 발행은 Debezium이 담당. 서비스 코드에서 Kafka producer를 직접 부르지 않는다.',
      },
      {
        problem:
          '판매자가 등록 버튼을 두 번 누르거나 클라이언트가 타임아웃 후 재시도해 같은 상품이 중복 등록된다.',
        solution:
          'Idempotency-Key 헤더를 검사하는 AOP Aspect가 Redis에 24h 캐시. 같은 키 재요청은 이전 응답을 그대로 반환.',
      },
      {
        problem:
          'SKU가 유일해야 한다. 두 요청이 동시에 같은 SKU를 INSERT하면 race condition.',
        solution:
          'seller_id + sku 유니크 제약과 DataIntegrityViolationException 캐치를 함께 둬, 선체크 이후의 동시성 삽입도 `SKU_ALREADY_EXISTS`로 정리한다.',
      },
    ],
  },

  // ───────── 상품 ─────────
  {
    id: 'product.detail',
    domain: 'product',
    requirement: '사용자는 상품 상세를 조회할 수 있다.',
    architecture:
      'product-service가 catalog_products (읽기 전용 테이블)에서 조회. 이 테이블은 seller-service의 Kafka 이벤트(PRODUCT_REGISTERED / PRODUCT_UPDATED / PRODUCT_DELETED)를 컨슈머가 반영해 채운다. visible 상태가 아닌 상품은 404로 응답.',
    status: 'in-progress',
    tags: ['cqrs', 'kafka-consumer', 'idempotency'],
    choices: [
      {
        text: '쓰기 모델(seller_products)과 읽기 모델(catalog_products)을 서비스 · DB · 테이블 수준으로 전부 분리한다.',
        reason:
          '판매자 쓰기 트래픽과 고객 조회 트래픽은 크기 · 패턴이 다르다. 물리 DB까지 분리해 두면 조회 측만 캐시 · 인덱스 · 리더 레플리카를 자유롭게 더할 수 있고, 쓰기 스키마를 바꿔도 읽기 경로가 즉시 영향받지 않는다.',
      },
      {
        text: '컨슈머 멱등성은 processed_events 테이블 PK로 처리한다.',
        reason:
          'Kafka는 at-least-once 배달이라 같은 이벤트가 두 번 들어올 수 있다. (event_id, event_type) 복합 PK가 중복을 DB 레이어에서 차단하므로, 컨슈머 코드가 멱등 여부를 스스로 판단할 필요가 없다.',
      },
      {
        text: '상품 라이프사이클은 상태 플래그(visible / deleted)로 다룬다.',
        reason:
          '행을 물리 삭제하면 진행 중이던 주문 · 리뷰 · 장바구니가 FK 오류로 깨진다. 상태값만 바꾸면 조회 측은 `isVisible()` 한 곳에서 표시 여부를 판단할 수 있고 복구도 가능하다.',
      },
    ],
    challenges: [
      {
        problem:
          'at-least-once 배달 때문에 같은 PRODUCT_REGISTERED 이벤트가 두 번 들어와 catalog에 중복 반영된다.',
        solution:
          'processed_events의 (event_id, event_type) 복합 PK로 차단. 두 번째 트랜잭션은 PK 제약에 걸려 no-op.',
      },
      {
        problem:
          '판매자가 상품을 삭제했는데 컨슈머 지연으로 고객에게 잠시 노출된다.',
        solution:
          'catalog_products.status를 컨슈머가 업데이트하고, 조회 서비스는 `isVisible()` 아니면 `PRODUCT_NOT_FOUND`로 반환. 지연 구간이 시각적으로 "없는 상품"이 되도록 정렬.',
      },
    ],
  },
]
