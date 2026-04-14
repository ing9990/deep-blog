import { describe, it, expect, vi } from 'vitest'

vi.mock('#site/content', () => ({
  posts: [
    {
      slug: 'a',
      title: 'Post A',
      date: '2026-04-14',
      tags: ['T'],
      keywords: ['K'],
      summary: 'summary a',
      draft: false,
      body: 'body',
      toc: [],
      url: '/posts/a',
    },
    {
      slug: 'b',
      title: 'Post B',
      date: '2026-04-10',
      tags: ['T'],
      keywords: ['K'],
      summary: 'summary b',
      draft: false,
      body: 'body',
      toc: [],
      url: '/posts/b',
    },
    {
      slug: 'c',
      title: 'Draft C',
      date: '2026-04-12',
      tags: ['T'],
      keywords: ['K'],
      summary: 'summary c',
      draft: true,
      body: 'body',
      toc: [],
      url: '/posts/c',
    },
  ],
}))

import { getAllPosts, getPostBySlug, getAllSlugs } from '@/lib/posts'

describe('posts helpers', () => {
  it('getAllPosts excludes drafts', () => {
    const slugs = getAllPosts().map((p) => p.slug)
    expect(slugs).toEqual(['a', 'b'])
  })

  it('getAllPosts sorts by date descending', () => {
    const [first, second] = getAllPosts()
    expect(first.date > second.date).toBe(true)
  })

  it('getPostBySlug returns undefined for a draft slug', () => {
    expect(getPostBySlug('c')).toBeUndefined()
  })

  it('getPostBySlug returns the published post for a valid slug', () => {
    expect(getPostBySlug('a')?.title).toBe('Post A')
  })

  it('getPostBySlug returns undefined for an unknown slug', () => {
    expect(getPostBySlug('does-not-exist')).toBeUndefined()
  })

  it('getAllSlugs returns only published slugs', () => {
    expect(getAllSlugs()).toEqual(['a', 'b'])
  })
})
