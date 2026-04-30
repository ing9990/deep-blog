import type { Language } from '@/components/providers/SettingsProvider'

export const CATEGORY_IDS = [
  'books',
  'mini-coupang',
  'spring-boot',
  'database',
  'redis',
  'kafka',
  'infrastructure',
  'knowledge',
  'computer-science',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export interface CategoryMeta {
  id: CategoryId
  label:       { ko: string; en: string }
  description: { ko: string; en: string }
}

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    id: 'books',
    label:       { en: 'Books', ko: '책' },
    description: { en: 'Notes from books at books.ing9990.com', ko: 'books.ing9990.com 책 정리' },
  },
  {
    id: 'mini-coupang',
    label:       { en: 'Mini Coupang', ko: '미니 쿠팡' },
    description: { en: 'Articles from the mini-coupang sandbox project', ko: '미니 쿠팡 샌드박스 프로젝트 아티클' },
  },
  {
    id: 'spring-boot',
    label:       { en: 'Spring Boot', ko: '스프링 부트' },
    description: { en: 'Spring, Spring Boot, JPA and surrounding ecosystem', ko: 'Spring, Spring Boot, JPA 및 주변 생태계' },
  },
  {
    id: 'database',
    label:       { en: 'Database', ko: '데이터 베이스' },
    description: { en: 'InnoDB, indexes, full scan and DB internals', ko: 'InnoDB, 인덱스, 풀스캔 등 데이터베이스 전반' },
  },
  {
    id: 'redis',
    label:       { en: 'REDIS', ko: 'REDIS' },
    description: { en: 'Redis fundamentals, clients, patterns', ko: 'Redis 기초, 클라이언트, 패턴' },
  },
  {
    id: 'kafka',
    label:       { en: 'KAFKA', ko: 'KAFKA' },
    description: { en: 'Kafka fundamentals and operations', ko: 'Kafka 기초와 운영' },
  },
  {
    id: 'infrastructure',
    label:       { en: 'Infrastructure', ko: '인프라' },
    description: { en: 'Middleware and infra products', ko: '미들웨어·인프라 제품' },
  },
  {
    id: 'knowledge',
    label:       { en: 'Knowledge', ko: '지식' },
    description: { en: 'Terms, concepts, fundamentals (Two Generals etc.)', ko: 'Two Generals 문제 등 용어·개념·기초 지식' },
  },
  {
    id: 'computer-science',
    label:       { en: 'Computer Science', ko: '컴퓨터 과학' },
    description: { en: 'OS, algorithms, data structures', ko: 'OS, 알고리즘, 자료구조' },
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
