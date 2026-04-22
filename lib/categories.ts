import type { Language } from '@/components/providers/SettingsProvider'

export const CATEGORY_IDS = [
  'computer-science',
  'language-backend',
  'database',
  'infrastructure',
  'knowledge',
  'mini-coupang-backend',
  'etc',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export interface CategoryMeta {
  id: CategoryId
  label:       { ko: string; en: string }
  description: { ko: string; en: string }
}

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    id: 'computer-science',
    label:       { en: 'Computer Science', ko: '컴퓨터 과학' },
    description: { en: 'OS, algorithms, data structures', ko: 'OS, 알고리즘, 자료구조' },
  },
  {
    id: 'language-backend',
    label:       { en: 'Language & Backend', ko: '언어 & 백엔드' },
    description: { en: 'Languages, runtimes, backend frameworks and libraries (JVM, Kotlin, Spring Boot, JPA, QueryDSL, WebFlux)', ko: '언어, 런타임, 백엔드 프레임워크·라이브러리 (JVM, Kotlin, Spring Boot, JPA, QueryDSL, WebFlux)' },
  },
  {
    id: 'database',
    label:       { en: 'Database', ko: '데이터베이스' },
    description: { en: 'MySQL, PostgreSQL, indexes', ko: 'MySQL, PostgreSQL, 인덱스' },
  },
  {
    id: 'infrastructure',
    label:       { en: 'Infrastructure', ko: '인프라' },
    description: { en: 'Middleware and infra products (Redis, Kafka, RabbitMQ)', ko: '미들웨어·인프라 제품 (Redis, Kafka, RabbitMQ)' },
  },
  {
    id: 'knowledge',
    label:       { en: 'Knowledge', ko: '지식' },
    description: { en: 'Terms, concepts, fundamentals', ko: '용어, 개념, 기초 지식' },
  },
  {
    id: 'mini-coupang-backend',
    label:       { en: 'Mini Coupang Backend', ko: '미니쿠팡 백엔드' },
    description: { en: 'Implementation-origin posts from the mini-coupang sandbox (design decisions with measurements)', ko: '미니쿠팡 샌드박스 구현에서 나온 설계 결정과 측정 기반 기록' },
  },
  {
    id: 'etc',
    label:       { en: 'ETC', ko: '그 외' },
    description: { en: 'Other topics', ko: '그 외 주제' },
  },
]

const CATEGORY_MAP = new Map<CategoryId, CategoryMeta>(
  CATEGORIES.map((c) => [c.id, c]),
)

export function getCategory(id: CategoryId): CategoryMeta {
  const meta = CATEGORY_MAP.get(id)
  if (!meta) throw new Error(`Unknown category id: ${id}`)
  return meta
}

export interface CategoryGroup<T> {
  category: CategoryMeta
  posts: T[]
}

export function groupPostsByCategory<T extends { category: CategoryId; date: string; title: { ko: string; en: string } }>(
  posts: readonly T[],
  lang: Language,
): CategoryGroup<T>[] {
  const buckets = new Map<CategoryId, T[]>()
  for (const post of posts) {
    const list = buckets.get(post.category) ?? []
    list.push(post)
    buckets.set(post.category, list)
  }

  const collator = new Intl.Collator(lang, { sensitivity: 'base' })

  return CATEGORIES.flatMap((category) => {
    const list = buckets.get(category.id)
    if (!list || list.length === 0) return []
    const sorted = list.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return collator.compare(a.title[lang], b.title[lang])
    })
    return [{ category, posts: sorted }]
  })
}
