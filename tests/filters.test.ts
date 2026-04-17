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
  title: { ko: string; en: string }
  summary: { ko: string; en: string }
  tags: string[]
  keywords: string[]
  date: string
  plainBody?: string
}

function makePost(partial: Partial<TestPost> & { slug: string }): TestPost {
  return {
    slug: partial.slug,
    title: partial.title ?? { ko: `제목 ${partial.slug}`, en: `Title ${partial.slug}` },
    summary: partial.summary ?? { ko: `요약 ${partial.slug}`, en: `Summary ${partial.slug}` },
    tags: partial.tags ?? [],
    keywords: partial.keywords ?? [],
    date: partial.date ?? '2026-01-01',
    plainBody: partial.plainBody,
  }
}

const sample: TestPost[] = [
  makePost({
    slug: 'p1',
    title: { ko: '데이터베이스 인덱스의 동작 원리', en: 'How Database Index Works' },
    summary: { ko: 'DB 인덱스가 빠른 이유', en: 'Why DB indexes are fast' },
    tags: ['Database', 'Index'],
    keywords: ['B-Tree', '인덱스'],
    date: '2026-04-10',
  }),
  makePost({
    slug: 'p2',
    title: { ko: 'Kafka Consumer Group 리밸런싱', en: 'Kafka Consumer Group Rebalancing' },
    summary: { ko: '컨슈머 그룹 리밸런싱 전략', en: 'Consumer group rebalancing strategies' },
    tags: ['Kafka', 'Backend'],
    keywords: ['Consumer Group'],
    date: '2026-04-08',
  }),
  makePost({
    slug: 'p3',
    title: { ko: 'JVM GC 소개', en: 'JVM GC Intro' },
    summary: { ko: 'Garbage Collection 기초', en: 'Garbage Collection basics' },
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
    expect(filterByTag(sample, 'Database').map((p) => p.slug)).toEqual(['p1'])
  })
  it('is case-insensitive', () => {
    expect(filterByTag(sample, 'database').map((p) => p.slug)).toEqual(['p1'])
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
  it('matches Korean title', () => {
    expect(searchPosts(sample, '인덱스').map((p) => p.slug)).toEqual(['p1'])
  })
  it('matches English title', () => {
    expect(searchPosts(sample, 'Database Index').map((p) => p.slug)).toEqual(['p1'])
  })
  it('matches Korean summary', () => {
    expect(searchPosts(sample, '리밸런싱 전략').map((p) => p.slug)).toEqual(['p2'])
  })
  it('matches English summary', () => {
    expect(searchPosts(sample, 'rebalancing strategies').map((p) => p.slug)).toEqual(['p2'])
  })
  it('matches tag', () => {
    expect(searchPosts(sample, 'JVM').map((p) => p.slug)).toEqual(['p3'])
  })
  it('matches keyword', () => {
    expect(searchPosts(sample, 'b-tree').map((p) => p.slug)).toEqual(['p1'])
  })
  it('is case-insensitive for Latin', () => {
    expect(searchPosts(sample, 'KAFKA').map((p) => p.slug)).toEqual(['p2'])
  })
  it('matches plainBody content when the field is present', () => {
    const withBody: TestPost[] = [
      makePost({
        slug: 'bodymatch',
        title: { ko: '다른 제목', en: 'Other Title' },
        summary: { ko: '본문 검색', en: 'Body-only match' },
        plainBody: '실제 본문 어딘가에 쿼리 토큰이 등장합니다.',
      }),
      makePost({ slug: 'nomatch', plainBody: '전혀 관련 없는 본문' }),
    ]
    expect(searchPosts(withBody, '쿼리 토큰').map((p) => p.slug)).toEqual(['bodymatch'])
  })
})

describe('sortPosts', () => {
  it('defaults to latest (date descending) under any lang', () => {
    expect(sortPosts(sample, undefined, 'ko').map((p) => p.slug)).toEqual(['p1', 'p2', 'p3'])
  })
  it('sorts oldest first', () => {
    expect(sortPosts(sample, 'oldest', 'ko').map((p) => p.slug)).toEqual(['p3', 'p2', 'p1'])
  })
  it('sorts by title using ko collator when lang=ko', () => {
    expect(sortPosts(sample, 'title', 'ko').map((p) => p.slug)).toEqual(['p1', 'p3', 'p2'])
  })
  it('sorts by title using en collator when lang=en', () => {
    expect(sortPosts(sample, 'title', 'en').map((p) => p.slug)).toEqual(['p1', 'p3', 'p2'])
  })
  it('does not mutate input', () => {
    const copy = sample.slice()
    sortPosts(sample, 'oldest', 'ko')
    expect(sample).toEqual(copy)
  })
})

describe('applyFilters', () => {
  it('applies tag then search then sort', () => {
    const result = applyFilters(sample, { tag: 'Backend', query: 'Consumer', sort: 'latest' }, 'ko')
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
