import type { Track } from '../types'

/**
 * Tracks data uses relative blog paths. Consumers (SystemMap) prepend the
 * resolved blog host so that LAN/IP access stays on the current host.
 */
export const tracks: Track[] = [
  {
    id: 'order-concurrency',
    topic: '분산 환경에서도 상품 재고 정합성은 깨지지 않아야 한다: Choreography Saga',
    status: 'in-progress',
    ctas: [
      {
        kind: 'blog',
        label: '분산 환경에서도 상품 재고 정합성은 깨지지 않아야 한다',
        href: '/posts/mini-coupang-distributed-stock-consistency',
        postSlug: 'mini-coupang-distributed-stock-consistency',
      },
    ],
  },
]
