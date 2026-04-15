import { describe, it, expect, vi } from 'vitest'

// Mock the Velite content module like tests/posts.test.ts does.
vi.mock('#site/content', () => ({
  posts: [
    {
      slug: 'a',
      title: 'A',
      date: '2026-04-10',
      draft: false,
      tags: [],
      keywords: [],
      summary: '',
      body: '',
      toc: [],
      readingTime: 1,
      url: '/posts/a',
    },
    {
      slug: 'b',
      title: 'B',
      date: '2026-04-11',
      draft: false,
      tags: [],
      keywords: [],
      summary: '',
      body: '',
      toc: [],
      readingTime: 1,
      url: '/posts/b',
    },
    {
      slug: 'c',
      title: 'C',
      date: '2026-04-12',
      draft: false,
      tags: [],
      keywords: [],
      summary: '',
      body: '',
      toc: [],
      readingTime: 1,
      url: '/posts/c',
    },
    {
      slug: 'd',
      title: 'D',
      date: '2026-04-13',
      draft: false,
      tags: [],
      keywords: [],
      summary: '',
      body: '',
      toc: [],
      readingTime: 1,
      url: '/posts/d',
    },
    {
      slug: 'e',
      title: 'E',
      date: '2026-04-14',
      draft: false,
      tags: [],
      keywords: [],
      summary: '',
      body: '',
      toc: [],
      readingTime: 1,
      url: '/posts/e',
    },
  ],
}))

import { getRecentPosts } from '@/lib/related-posts'

describe('getRecentPosts', () => {
  it('returns the 4 most recent posts excluding the current slug', () => {
    const result = getRecentPosts('c', 4)
    expect(result.map((p) => p.slug)).toEqual(['e', 'd', 'b', 'a'])
  })

  it('defaults to n=4 when not specified', () => {
    const result = getRecentPosts('a')
    expect(result).toHaveLength(4)
    expect(result.map((p) => p.slug)).toEqual(['e', 'd', 'c', 'b'])
  })

  it('returns fewer than N when the corpus is small', () => {
    const result = getRecentPosts('a', 10)
    expect(result).toHaveLength(4)
    expect(result.map((p) => p.slug)).toEqual(['e', 'd', 'c', 'b'])
  })

  it('preserves date-descending order', () => {
    const result = getRecentPosts('e', 4)
    const dates = result.map((p) => p.date)
    const sorted = [...dates].sort().reverse()
    expect(dates).toEqual(sorted)
  })

  it('always excludes the given slug from results', () => {
    const result = getRecentPosts('a', 4)
    expect(result.every((p) => p.slug !== 'a')).toBe(true)
  })
})
