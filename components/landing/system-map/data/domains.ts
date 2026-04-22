import type { DomainMeta } from '../types'

export const domains: DomainMeta[] = [
  {
    id: 'seller',
    label: '판매자',
    summary:
      '판매자 · 상점 · 상품 등록. 쓰기 커맨드가 Outbox + Debezium으로 빠져 나가 Kafka로 흐른다.',
  },
  {
    id: 'product',
    label: '상품',
    summary:
      '상품 조회 전용 읽기 모델. 판매자 서비스의 쓰기와 물리적으로 분리된 카탈로그 테이블이 이벤트로 채워진다.',
  },
]
