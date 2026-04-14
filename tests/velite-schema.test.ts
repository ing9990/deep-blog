import { describe, it, expect } from 'vitest'
import { postFrontmatterSchema } from '../velite.config'

const validFrontmatter = {
  title: 'Test Post',
  slug: 'test-post',
  date: '2026-04-14',
  tags: ['Database'],
  keywords: ['Index'],
  summary: 'A short summary for testing the frontmatter schema.',
}

describe('postFrontmatterSchema', () => {
  it('accepts a valid frontmatter object', () => {
    expect(() => postFrontmatterSchema.parse(validFrontmatter)).not.toThrow()
  })

  it('rejects an uppercase slug', () => {
    expect(() =>
      postFrontmatterSchema.parse({ ...validFrontmatter, slug: 'Test-Post' }),
    ).toThrow()
  })

  it('rejects an empty tags array', () => {
    expect(() =>
      postFrontmatterSchema.parse({ ...validFrontmatter, tags: [] }),
    ).toThrow()
  })

  it('rejects summary shorter than 10 characters', () => {
    expect(() =>
      postFrontmatterSchema.parse({ ...validFrontmatter, summary: 'too short' }),
    ).toThrow()
  })

  it('rejects tags arrays longer than 5', () => {
    expect(() =>
      postFrontmatterSchema.parse({
        ...validFrontmatter,
        tags: ['a', 'b', 'c', 'd', 'e', 'f'],
      }),
    ).toThrow()
  })

  it('defaults draft to false when omitted', () => {
    const parsed = postFrontmatterSchema.parse(validFrontmatter)
    expect(parsed.draft).toBe(false)
  })
})
