import type { Track } from '../types'

const BLOG_URL = 'https://deep.ing9990.com'
const GITHUB_MINI_COUPANG_URL =
  'https://github.com/ing9990/deep-blog/tree/main/mini-coupang'

export const tracks: Track[] = [
  {
    id: 'order-concurrency',
    topic: '주문 동시성과 락',
    trace:
      'Redis + Luascript로 재고를 원자적으로 선점하고, 결제 실패 시 이벤트를 발행해 재고를 롤백한다.',
    status: 'in-progress',
    ctas: [
      {
        kind: 'blog',
        label: '[미니쿠팡] 주문 동시성과 락',
        href: `${BLOG_URL}/posts/mini-coupang-order-concurrency-locks`,
        postSlug: 'mini-coupang-order-concurrency-locks',
      },
      {
        kind: 'github',
        label: 'GitHub 코드',
        href: GITHUB_MINI_COUPANG_URL,
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
      {
        kind: 'github',
        label: 'GitHub 코드',
        href: GITHUB_MINI_COUPANG_URL,
      },
    ],
  },
]
