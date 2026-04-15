export const CATEGORY_IDS = [
  'computer-science',
  'language',
  'database',
  'frameworks',
  'library',
  'etc',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export interface CategoryMeta {
  id: CategoryId
  label: string
  description: string
}

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    id: 'computer-science',
    label: 'Computer Science',
    description: 'OS, 자료구조, 알고리즘',
  },
  {
    id: 'language',
    label: 'Language',
    description: 'Kotlin, TypeScript, Java, JVM',
  },
  {
    id: 'database',
    label: 'Database',
    description: 'MySQL, PostgreSQL, 인덱스',
  },
  {
    id: 'frameworks',
    label: 'Frameworks',
    description: 'Spring Boot, Next.js',
  },
  {
    id: 'library',
    label: 'Library',
    description: 'Querydsl, JPA',
  },
  {
    id: 'etc',
    label: 'ETC',
    description: '그 외 주제',
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
