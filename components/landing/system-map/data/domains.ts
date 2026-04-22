import type { DomainMeta } from '../types'

export const domains: DomainMeta[] = [
  {
    id: 'order',
    label: '주문',
    summary: '장바구니부터 결제까지. 재고·결제 일관성, 멱등성, 보상 트랜잭션이 한 덩어리로 엮이는 도메인.',
  },
  {
    id: 'seller',
    label: '판매자',
    summary: '판매자 · 스토어 · 상품 등록. 업로드 파이프라인이 동기·비동기 경로를 나누는 기점.',
  },
  {
    id: 'product',
    label: '상품',
    summary: '상품 조회와 피드. 트래픽이 가장 뜨거워 캐시·검색 레이어가 성패를 가르는 도메인.',
  },
  {
    id: 'member',
    label: '회원',
    summary: '이메일 로그인과 세션. 작은 표면적이지만 다른 도메인이 전부 딛고 서는 기반.',
  },
  {
    id: 'discovery',
    label: '검색 · 피드',
    summary: 'Elasticsearch와 피드 어그리게이션. 쓰기 도메인에서 비동기로 흘러든 데이터가 실제로 소비되는 곳.',
  },
]
