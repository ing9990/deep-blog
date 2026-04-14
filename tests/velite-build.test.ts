import { describe, it, expect } from 'vitest'
import { posts } from '#site/content'

describe('velite build output', () => {
  it('produces at least one post', () => {
    expect(posts.length).toBeGreaterThan(0)
  })

  it('first post has all required frontmatter fields', () => {
    const post = posts[0]
    expect(post).toMatchObject({
      title: expect.any(String),
      slug: expect.any(String),
      date: expect.any(String),
      tags: expect.any(Array),
      keywords: expect.any(Array),
      summary: expect.any(String),
    })
    expect(post.tags.length).toBeGreaterThan(0)
    expect(post.keywords.length).toBeGreaterThan(0)
  })

  it('first post has a derived url starting with /posts/', () => {
    expect(posts[0].url).toMatch(/^\/posts\//)
  })

  it('first post has a non-empty compiled body', () => {
    expect(typeof posts[0].body).toBe('string')
    expect(posts[0].body.length).toBeGreaterThan(0)
  })
})
