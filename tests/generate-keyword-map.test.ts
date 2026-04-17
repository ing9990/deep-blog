// tests/generate-keyword-map.test.ts
import { describe, it, expect } from 'vitest'
import {
  buildMap,
  formatConflictError,
  serializeMap,
  type ScannedPost,
} from '@/scripts/generate-keyword-map'

function post(partial: Partial<ScannedPost> & { slug: string; keywords: string[] }): ScannedPost {
  return {
    file: `content/posts/${partial.slug}.mdx`,
    slug: partial.slug,
    title: partial.title ?? { ko: `제목 ${partial.slug}`, en: `Title ${partial.slug}` },
    summary: partial.summary ?? { ko: `요약 ${partial.slug}`, en: `Summary ${partial.slug}` },
    keywords: partial.keywords,
  }
}

describe('buildMap', () => {
  it('returns empty map for empty posts', () => {
    const { map, conflicts } = buildMap([])
    expect(map.size).toBe(0)
    expect(conflicts).toEqual([])
  })

  it('maps each keyword to its declaring post', () => {
    const { map, conflicts } = buildMap([
      post({ slug: 'p1', keywords: ['B-Tree'] }),
      post({ slug: 'p2', keywords: ['Kafka'] }),
    ])
    expect(map.size).toBe(2)
    expect(map.get('b-tree')?.slug).toBe('p1')
    expect(map.get('kafka')?.slug).toBe('p2')
    expect(conflicts).toEqual([])
  })

  it('supports multiple keywords per post', () => {
    const { map } = buildMap([
      post({ slug: 'p1', keywords: ['B-Tree', 'B+Tree', '인덱스'] }),
    ])
    expect(map.size).toBe(3)
    expect(map.get('인덱스')?.slug).toBe('p1')
  })

  it('detects a conflict between two posts', () => {
    const { conflicts } = buildMap([
      post({ slug: 'p1', keywords: ['B-Tree'] }),
      post({ slug: 'p2', keywords: ['B-Tree'] }),
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].keyword).toBe('b-tree')
    expect(conflicts[0].files).toHaveLength(2)
    expect(conflicts[0].files.map((f) => f.slug)).toEqual(['p1', 'p2'])
  })

  it('detects a conflict across three posts', () => {
    const { conflicts } = buildMap([
      post({ slug: 'p1', keywords: ['인덱스'] }),
      post({ slug: 'p2', keywords: ['인덱스'] }),
      post({ slug: 'p3', keywords: ['인덱스'] }),
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].files).toHaveLength(3)
  })

  it('preserves bilingual title and summary on entries', () => {
    const { map } = buildMap([
      post({
        slug: 'p1',
        keywords: ['B-Tree'],
        title: { ko: 'B-Tree 구조', en: 'B-Tree Structure' },
        summary: { ko: '자료구조 설명', en: 'Data structure explanation' },
      }),
    ])
    expect(map.get('b-tree')).toEqual({
      slug: 'p1',
      title: { ko: 'B-Tree 구조', en: 'B-Tree Structure' },
      summary: { ko: '자료구조 설명', en: 'Data structure explanation' },
    })
  })

  it('treats case-variant keywords as conflicts', () => {
    const { conflicts } = buildMap([
      post({ slug: 'p1', keywords: ['B-Tree'] }),
      post({ slug: 'p2', keywords: ['b-tree'] }),
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].files).toHaveLength(2)
  })
})

describe('formatConflictError', () => {
  it('formats one conflict with files and slugs', () => {
    const msg = formatConflictError([
      {
        keyword: 'B-Tree',
        files: [
          { file: 'content/posts/a.mdx', slug: 'a' },
          { file: 'content/posts/b.mdx', slug: 'b' },
        ],
      },
    ])
    expect(msg).toContain('B-Tree')
    expect(msg).toContain('content/posts/a.mdx')
    expect(msg).toContain('content/posts/b.mdx')
    expect(msg).toContain('slug: a')
    expect(msg).toContain('slug: b')
  })
})

describe('serializeMap', () => {
  it('emits KEYWORD_MAP, KEYWORDS_BY_LENGTH, SLUG_TO_ENTRY, BilingualText', () => {
    const map = new Map([
      ['B-Tree', { slug: 'b-tree', title: { ko: 'T1', en: 'T1e' }, summary: { ko: 'S1', en: 'S1e' } }],
      ['Kafka Consumer Group', { slug: 'kcg', title: { ko: 'T2', en: 'T2e' }, summary: { ko: 'S2', en: 'S2e' } }],
    ])
    const out = serializeMap(map)
    expect(out).toContain('export const KEYWORD_MAP')
    expect(out).toContain('export const KEYWORDS_BY_LENGTH')
    expect(out).toContain('export const SLUG_TO_ENTRY')
    expect(out).toContain('export interface BilingualText')
  })

  it('emits ko and en fields in each entry', () => {
    const map = new Map([
      ['B-Tree', { slug: 'b-tree', title: { ko: 'T1', en: 'T1e' }, summary: { ko: 'S1', en: 'S1e' } }],
    ])
    const out = serializeMap(map)
    expect(out).toMatch(/title: \{ ko: "T1", en: "T1e" \}/)
    expect(out).toMatch(/summary: \{ ko: "S1", en: "S1e" \}/)
  })

  it('sorts KEYWORDS_BY_LENGTH longest first', () => {
    const map = new Map([
      ['B-Tree', { slug: 'b-tree', title: { ko: 'T1', en: 'T1' }, summary: { ko: 'S1', en: 'S1' } }],
      ['Kafka Consumer Group', { slug: 'kcg', title: { ko: 'T2', en: 'T2' }, summary: { ko: 'S2', en: 'S2' } }],
      ['Kafka', { slug: 'kafka', title: { ko: 'T3', en: 'T3' }, summary: { ko: 'S3', en: 'S3' } }],
    ])
    const out = serializeMap(map)
    const byLengthBlock = out.slice(out.indexOf('KEYWORDS_BY_LENGTH'))
    expect(byLengthBlock.indexOf('"Kafka Consumer Group"')).toBeLessThan(
      byLengthBlock.indexOf('"B-Tree"'),
    )
    expect(byLengthBlock.indexOf('"B-Tree"')).toBeLessThan(
      byLengthBlock.indexOf('"Kafka"'),
    )
  })
})
