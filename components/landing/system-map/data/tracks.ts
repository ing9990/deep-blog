import type { Track } from '../types'

/**
 * Tracks data uses relative blog paths. Consumers (SystemMap) prepend the
 * resolved blog host so that LAN/IP access stays on the current host.
 */
export const tracks: Track[] = [
  {
    id: 'order-concurrency',
    topic: '분산 환경에서 재고 서비스의 정합성을 보장',
    trace:
      '락 없는 환경에서 시작해 모놀리스, MSA까지 단계적으로 옮겨가며 상품 주문 도메인의 재고 서비스가 정합성을 어떻게 보장하는지 정리한다. Redis Lua 원자 선점, Choreography Saga 보상, Outbox/Inbox 패턴으로 발행 신뢰성을 닫는다.',
    status: 'in-progress',
    ctas: [
      {
        kind: 'blog',
        label: '분산 환경에서 재고 서비스의 정합성을 보장',
        href: '/posts/mini-coupang-distributed-stock-consistency',
        postSlug: 'mini-coupang-distributed-stock-consistency',
      },
    ],
  },
  {
    id: 'search-quality',
    topic: '검색 품질 (Lexical + Semantic)',
    trace:
      'bge-m3 임베딩 + Qdrant 벡터 검색을 MySQL 키워드 검색과 RRF(Reciprocal Rank Fusion)로 융합. 12,000건 시드(카테고리 10종)에서 키워드만/임베딩만 대비 어떻게 보완되는지 단계별로 검증 중. 개념 정리 글을 먼저 공개했고, 미니쿠팡 적용 글은 작성 중.',
    status: 'in-progress',
    ctas: [
      {
        kind: 'concept',
        label: '개념 글: Lexical vs Semantic',
        href: '/posts/lexical-vs-semantic-search',
        postSlug: 'lexical-vs-semantic-search',
      },
    ],
  },
]
