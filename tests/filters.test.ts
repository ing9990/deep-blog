// tests/filters.test.ts
import { describe, it, expect } from 'vitest'
import {
  filterByTag,
  searchPosts,
  sortPosts,
  applyFilters,
  extractAllTags,
} from '@/lib/filters'

type TestPost = {
  slug: string
  title: string
  summary: string
  tags: string[]
  keywords: string[]
  date: string
  plainBody?: string
}

function makePost(partial: Partial<TestPost> & { slug: string }): TestPost {
  return {
    slug: partial.slug,
    title: partial.title ?? `Title ${partial.slug}`,
    summary: partial.summary ?? `Summary ${partial.slug}`,
    tags: partial.tags ?? [],
    keywords: partial.keywords ?? [],
    date: partial.date ?? '2026-01-01',
    plainBody: partial.plainBody,
  }
}

const sample: TestPost[] = [
  makePost({
    slug: 'p1',
    title: '데이터베이스 인덱스의 동작 원리',
    summary: 'DB 인덱스가 빠른 이유',
    tags: ['Database', 'Index'],
    keywords: ['B-Tree', '인덱스'],
    date: '2026-04-10',
  }),
  makePost({
    slug: 'p2',
    title: 'Kafka Consumer Group 리밸런싱',
    summary: '컨슈머 그룹 리밸런싱 전략',
    tags: ['Kafka', 'Backend'],
    keywords: ['Consumer Group'],
    date: '2026-04-08',
  }),
  makePost({
    slug: 'p3',
    title: 'JVM GC 소개',
    summary: 'Garbage Collection basics',
    tags: ['JVM', 'Backend'],
    keywords: ['G1', 'Mark-Sweep'],
    date: '2026-04-01',
  }),
]

describe('filterByTag', () => {
  it('returns all when tag is undefined', () => {
    expect(filterByTag(sample, undefined)).toHaveLength(3)
  })

  it('filters by exact tag match', () => {
    const result = filterByTag(sample, 'Database')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('is case-insensitive', () => {
    const result = filterByTag(sample, 'database')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('returns empty array when no match', () => {
    expect(filterByTag(sample, 'NoSuchTag')).toEqual([])
  })
})

describe('searchPosts', () => {
  it('returns all when query is undefined or empty', () => {
    expect(searchPosts(sample, undefined)).toHaveLength(3)
    expect(searchPosts(sample, '')).toHaveLength(3)
    expect(searchPosts(sample, '   ')).toHaveLength(3)
  })

  it('matches partial title', () => {
    const result = searchPosts(sample, '인덱스')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('matches partial summary', () => {
    const result = searchPosts(sample, '리밸런싱 전략')
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })

  it('matches tag', () => {
    const result = searchPosts(sample, 'JVM')
    expect(result.map((p) => p.slug)).toEqual(['p3'])
  })

  it('matches keyword', () => {
    const result = searchPosts(sample, 'b-tree')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('is case-insensitive for Latin', () => {
    const result = searchPosts(sample, 'KAFKA')
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })

  it('matches plainBody content when the field is present', () => {
    const withBody: TestPost[] = [
      makePost({
        slug: 'bodymatch',
        title: '아주 다른 제목',
        summary: '본문에만 있는 단어',
        plainBody: '실제 본문 어딘가에 쿼리 토큰이 등장합니다.',
      }),
      makePost({ slug: 'nomatch', plainBody: '전혀 관련 없는 본문' }),
    ]
    const result = searchPosts(withBody, '쿼리 토큰')
    expect(result.map((p) => p.slug)).toEqual(['bodymatch'])
  })

  it('ignores plainBody when the field is absent', () => {
    // Posts without plainBody should still match via frontmatter fields.
    const result = searchPosts(sample, '인덱스')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })
})

describe('sortPosts', () => {
  it('defaults to latest (date descending)', () => {
    const result = sortPosts(sample, undefined)
    expect(result.map((p) => p.slug)).toEqual(['p1', 'p2', 'p3'])
  })

  it('sorts oldest first', () => {
    const result = sortPosts(sample, 'oldest')
    expect(result.map((p) => p.slug)).toEqual(['p3', 'p2', 'p1'])
  })

  it('sorts by title Korean-aware', () => {
    const result = sortPosts(sample, 'title')
    // NOTE: Actual Intl.Collator('ko') order in this Node.js environment:
    // Hangul '데'(데이터베이스) comes BEFORE Latin 'J'(JVM GC) and 'K'(Kafka).
    // Observed order: p1 (데이터베이스…) → p3 (JVM GC…) → p2 (Kafka…)
    expect(result.map((p) => p.slug)).toEqual(['p1', 'p3', 'p2'])
  })

  it('does not mutate input', () => {
    const copy = sample.slice()
    sortPosts(sample, 'oldest')
    expect(sample).toEqual(copy)
  })
})

describe('applyFilters', () => {
  it('applies tag then search then sort', () => {
    const result = applyFilters(sample, {
      tag: 'Backend',
      query: 'Consumer',
      sort: 'latest',
    })
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })
})

describe('extractAllTags', () => {
  it('returns unique tags with counts in descending order', () => {
    const result = extractAllTags(sample)
    expect(result).toContainEqual({ tag: 'Backend', count: 2 })
    expect(result[0].count).toBeGreaterThanOrEqual(result[result.length - 1].count)
  })
})
