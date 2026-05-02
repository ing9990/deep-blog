import type { Track } from '../types'

/**
 * Tracks data uses relative blog paths. Consumers (SystemMap) prepend the
 * resolved blog host so that LAN/IP access stays on the current host.
 */
export const tracks: Track[] = [
  {
    id: 'order-concurrency-saga',
    topic: '분산 환경에서도 상품 재고 정합성은 깨지지 않아야 한다: Choreography Saga',
    status: 'in-progress',
    ctas: [
      {
        kind: 'blog',
        label: '분산 트랜잭션과 Choreography Saga',
        href: '/posts/mini-coupang-choreography-saga',
        postSlug: 'mini-coupang-choreography-saga',
      },
    ],
  },
  {
    id: 'multi-instance-stock-reserve',
    topic: '멀티 인스턴스 환경에서 재고 선점은 한 명령으로 묶여야 한다',
    status: 'in-progress',
    ctas: [
      {
        kind: 'blog',
        label: '멀티 인스턴스 재고 선점과 Luascript',
        href: '/posts/mini-coupang-redis-lua-stock-reserve',
        postSlug: 'mini-coupang-redis-lua-stock-reserve',
      },
    ],
  },
  {
    id: 'tsid-distributed-id',
    topic: '분산 환경에서 정렬 가능한 ID 만들기: TSID',
    status: 'in-progress',
    ctas: [
      {
        kind: 'blog',
        label: '분산 환경에서 정렬 가능한 ID 만들기: TSID',
        href: '/posts/mini-coupang-tsid-distributed-id',
        postSlug: 'mini-coupang-tsid-distributed-id',
      },
    ],
  },
]
