export const CATEGORY_IDS = [
  'computer-science',
  'data-structure',
  'language',
  'database',
  'frameworks',
  'library',
  'ai',
  'knowledge',
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
    description: { en: 'OS, algorithms', ko: 'OS, 알고리즘' },
  },
  {
    id: 'data-structure',
    label:       { en: 'Data Structure', ko: '자료구조' },
    description: { en: 'B-Tree, hash maps, arrays, linked lists', ko: 'B-Tree, 해시맵, 배열, 연결 리스트' },
  },
  {
    id: 'language',
    label:       { en: 'Language', ko: '언어' },
    description: { en: 'Kotlin, TypeScript, Java, JVM', ko: 'Kotlin, TypeScript, Java, JVM' },
  },
  {
    id: 'database',
    label:       { en: 'Database', ko: '데이터베이스' },
    description: { en: 'MySQL, PostgreSQL, indexes', ko: 'MySQL, PostgreSQL, 인덱스' },
  },
  {
    id: 'frameworks',
    label:       { en: 'Frameworks', ko: '프레임워크' },
    description: { en: 'Spring Boot, Next.js', ko: 'Spring Boot, Next.js' },
  },
  {
    id: 'library',
    label:       { en: 'Library', ko: '라이브러리' },
    description: { en: 'Querydsl, JPA', ko: 'Querydsl, JPA' },
  },
  {
    id: 'ai',
    label:       { en: 'AI', ko: 'AI' },
    description: { en: 'LLM, machine learning, AI engineering', ko: 'LLM, 머신러닝, AI 엔지니어링' },
  },
  {
    id: 'knowledge',
    label:       { en: 'Knowledge', ko: '지식' },
    description: { en: 'Terms, concepts, fundamentals', ko: '용어, 개념, 기초 지식' },
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

export function groupPostsByCategory<T extends { category: CategoryId; date: string; title: string }>(
  posts: readonly T[],
): CategoryGroup<T>[] {
  const buckets = new Map<CategoryId, T[]>()
  for (const post of posts) {
    const list = buckets.get(post.category) ?? []
    list.push(post)
    buckets.set(post.category, list)
  }

  return CATEGORIES.flatMap((category) => {
    const list = buckets.get(category.id)
    if (!list || list.length === 0) return []
    const sorted = list.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return a.title.localeCompare(b.title, 'ko')
    })
    return [{ category, posts: sorted }]
  })
}
