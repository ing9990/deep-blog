import { describe, it, expect } from 'vitest'
import { applyFilters } from '@/lib/filters'

type TestPost = {
  slug: string
  title: string
  summary: string
  tags: string[]
  keywords: string[]
  date: string
}

const POSTS: TestPost[] = [
  { slug: 'a', title: 'Alpha', summary: 'first', tags: ['Backend'], keywords: ['k1'], date: '2026-04-10' },
  { slug: 'b', title: 'Beta', summary: 'second', tags: ['Backend'], keywords: ['k2'], date: '2026-04-11' },
  { slug: 'c', title: 'Gamma', summary: 'third', tags: ['Database'], keywords: ['k3'], date: '2026-04-12' },
  { slug: 'd', title: 'Delta', summary: 'fourth', tags: ['Database'], keywords: ['k4'], date: '2026-04-13' },
]

describe('applyFilters — matched intersect', () => {
  it('returns all posts when matched is undefined', () => {
    const out = applyFilters(POSTS, {})
    expect(out.map((p) => p.slug).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('returns only posts whose slug is in the matched list', () => {
    const out = applyFilters(POSTS, { matched: ['a', 'c'] })
    expect(out.map((p) => p.slug).sort()).toEqual(['a', 'c'])
  })

  it('returns empty when matched is an empty array', () => {
    const out = applyFilters(POSTS, { matched: [] })
    expect(out).toEqual([])
  })

  it('ignores matched entries that are not in the post set', () => {
    const out = applyFilters(POSTS, { matched: ['a', 'nonexistent'] })
    expect(out.map((p) => p.slug)).toEqual(['a'])
  })

  it('intersects matched with tag filter', () => {
    const out = applyFilters(POSTS, { matched: ['a', 'c'], tag: 'Backend' })
    expect(out.map((p) => p.slug)).toEqual(['a'])
  })

  it('sorts the matched-filtered set by the sort key', () => {
    const out = applyFilters(POSTS, { matched: ['a', 'd', 'c'], sort: 'latest' })
    expect(out.map((p) => p.slug)).toEqual(['d', 'c', 'a'])
  })
})
