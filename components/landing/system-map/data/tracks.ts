import type { Track } from '../types'

/**
 * Tracks data uses relative blog paths. Consumers (SystemMap) prepend the
 * resolved blog host so that LAN/IP access stays on the current host.
 */
export const tracks: Track[] = [
  {
    id: 'order-concurrency',
    topic: '분산 환경에서 재고 서비스의 정합성을 보장',
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
