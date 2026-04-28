import type { Track } from '../types'
import { BLOG_URL } from '@/lib/cross-host-url'

export const tracks: Track[] = [
  {
    id: 'order-concurrency',
    topic: '분산 환경에서 재고 서비스의 원자성 보장',
    trace:
      '락 없는 환경에서 시작해 모놀리스, MSA까지 단계적으로 옮겨가며 상품 주문 도메인의 재고 서비스가 원자성을 어떻게 보장하는지 정리한다.',
    status: 'in-progress',
    ctas: [
      {
        kind: 'blog',
        label: '분산 환경에서 재고 서비스의 원자성 보장',
        href: `${BLOG_URL}/posts/mini-coupang-order-concurrency-locks`,
        postSlug: 'mini-coupang-order-concurrency-locks',
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
        href: `${BLOG_URL}/posts/lexical-vs-semantic-search`,
        postSlug: 'lexical-vs-semantic-search',
      },
    ],
  },
]
