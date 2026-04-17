import { describe, it, expect } from 'vitest'
import { posts } from '#site/content'

describe('velite build output', () => {
  it('produces at least one post', () => {
    expect(posts.length).toBeGreaterThan(0)
  })

  it('first post has all required frontmatter fields', () => {
    const post = posts[0]
    expect(post).toMatchObject({
      title: {
        ko: expect.any(String),
        en: expect.any(String),
      },
      slug: expect.any(String),
      date: expect.any(String),
      tags: expect.any(Array),
      keywords: expect.any(Array),
      summary: {
        ko: expect.any(String),
        en: expect.any(String),
      },
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

  it('first post has a numeric readingTime >= 1', () => {
    expect(typeof posts[0].readingTime).toBe('number')
    expect(posts[0].readingTime).toBeGreaterThanOrEqual(1)
  })

  it('first post has toc entries with anchor urls (#slug format)', () => {
    const toc = posts[0].toc as Array<{ title: string; url: string; items: unknown[] }>
    expect(toc.length).toBeGreaterThan(0)
    for (const entry of toc) {
      expect(entry.url).toMatch(/^#/)
    }
  })

  it('no post contains an auto-link to itself (self-link prevention)', () => {
    // Velite compiles MDX to a JS function that emits JSX prop objects,
    // so an auto-link in `post.body` is serialized as JSX props like
    // {href:"/posts/<slug>",...,"data-keyword-link":"true"}. Match the
    // href+marker co-occurrence within the same prop object (bounded by
    // a closing brace).
    for (const post of posts) {
      const selfSlugJson = `"/posts/${post.slug}"`
      const autoLinkToSelfRegex = new RegExp(
        `href:${selfSlugJson}[^}]*"data-keyword-link":"true"|"data-keyword-link":"true"[^}]*href:${selfSlugJson}`,
      )
      expect(
        autoLinkToSelfRegex.test(post.body),
        `post ${post.slug} contains an auto-link to itself`,
      ).toBe(false)
    }
  })

  it('at least one keyword auto-link marker exists in compiled output', () => {
    const totalLinks = posts.reduce(
      (n, p) => n + (p.body.match(/"data-keyword-link":"true"/g)?.length ?? 0),
      0,
    )
    expect(totalLinks).toBeGreaterThanOrEqual(1)
  })
})
