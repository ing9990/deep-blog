import { describe, it, expect } from 'vitest'
import { postFrontmatterSchema } from '../velite.config'

const validFrontmatter = {
  title: 'Test Post',
  slug: 'test-post',
  date: '2026-04-14',
  tags: ['Database'],
  keywords: ['Index'],
  summary: 'A short summary for testing the frontmatter schema.',
  category: 'database' as const,
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

  it('rejects tags containing /', () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      tags: ['Bad/Tag'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects tags containing ?', () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      tags: ['What?'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects tags containing #', () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      tags: ['C#'],
    })
    expect(result.success).toBe(false)
  })

  it('accepts tags with dash, space, and Korean characters', () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      tags: ['B-Tree', 'Spring Boot', '백엔드'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown category value', () => {
    const result = postFrontmatterSchema.safeParse({
      ...validFrontmatter,
      category: 'not-a-real-category',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing category', () => {
    const { category: _omit, ...rest } = validFrontmatter
    void _omit
    const result = postFrontmatterSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })
})
