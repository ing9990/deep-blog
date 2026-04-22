export type DomainId = 'order' | 'seller' | 'product' | 'member' | 'discovery'

export type FeatureStatus = 'done' | 'in-progress' | 'planned'

export interface FeatureChoice {
  /** 무엇을 선택했는가. */
  text: string
  /** 왜 그렇게 선택했는가. */
  reason: string
}

export interface FeatureChallenge {
  /** 어떤 문제가 있었는가. */
  problem: string
  /** 어떻게 해결했는가 (한 줄 요약). */
  solution: string
  /** 존재하는 content/posts/*.mdx의 slug. 있으면 "자세히 보기" 버튼 노출. */
  postSlug?: string
}

export interface Feature {
  id: string
  domain: DomainId
  /** 사용자 스토리형 요구사항. */
  requirement: string
  /** 1-2줄 아키텍처 흐름 요약. */
  architecture: string
  status?: FeatureStatus
  choices: FeatureChoice[]
  challenges: FeatureChallenge[]
  /** 기능 간 횡단 개념 (멱등성, Redis 분산락 등) 태그. */
  tags?: string[]
}

export interface DomainMeta {
  id: DomainId
  label: string
  summary: string
}
