import { describe, it, expect } from 'vitest'
import { hasBoundary, findMatches } from '@/lib/keyword-matcher'

describe('hasBoundary', () => {
  it('Latin keyword: passes when prev/next are non-word', () => {
    expect(hasBoundary('use B-Tree here', 'B-Tree', 4)).toBe(true)
  })

  it('Latin keyword: fails when prev is alphanumeric', () => {
    expect(hasBoundary('AB-Tree here', 'B-Tree', 1)).toBe(false)
  })

  it('Latin keyword: fails when next is alphanumeric', () => {
    expect(hasBoundary('B-Trees here', 'B-Tree', 0)).toBe(false)
  })

  it('Latin keyword: passes when next is Hangul (treated as non-word for Latin boundary)', () => {
    expect(hasBoundary('B-Tree를 사용', 'B-Tree', 0)).toBe(true)
  })

  it('Hangul keyword: passes when prev is non-Hangul', () => {
    expect(hasBoundary('the 인덱스를', '인덱스', 4)).toBe(true)
  })

  it('Hangul keyword: fails when prev is Hangul', () => {
    expect(hasBoundary('재인덱싱', '인덱스', 1)).toBe(false)
  })

  it('Hangul keyword: passes when next is Hangul (relaxed for Korean particles)', () => {
    expect(hasBoundary('인덱스를 사용', '인덱스', 0)).toBe(true)
  })

  it('Mixed keyword: independent boundary check for each end', () => {
    // "Kafka 컨슈머" — first char K (Latin), last char 머 (Hangul)
    expect(hasBoundary('그 Kafka 컨슈머가', 'Kafka 컨슈머', 2)).toBe(true)
    expect(hasBoundary('SuperKafka 컨슈머', 'Kafka 컨슈머', 5)).toBe(false)
  })
})

describe('findMatches', () => {
  const keywordToSlug = new Map<string, string>([
    ['B-Tree', 'b-tree-structure'],
    ['Kafka', 'kafka-basics'],
    ['Kafka Consumer Group', 'kafka-consumer-group'],
    ['인덱스', 'database-index'],
  ])
  const keywordsByLength = [
    'Kafka Consumer Group',
    'B-Tree',
    'Kafka',
    '인덱스',
  ]

  it('returns empty for no matches', () => {
    expect(findMatches('hello world', keywordsByLength, keywordToSlug, '')).toEqual([])
  })

  it('finds a single Latin keyword match', () => {
    const result = findMatches('use B-Tree', keywordsByLength, keywordToSlug, '')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ keyword: 'B-Tree', slug: 'b-tree-structure' })
  })

  it('finds Hangul keyword with particle', () => {
    const result = findMatches('인덱스를 사용', keywordsByLength, keywordToSlug, '')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ keyword: '인덱스', slug: 'database-index' })
  })

  it('prefers longer keyword (greedy)', () => {
    const result = findMatches(
      'Kafka Consumer Group 리밸런싱',
      keywordsByLength,
      keywordToSlug,
      '',
    )
    expect(result).toHaveLength(1)
    expect(result[0].keyword).toBe('Kafka Consumer Group')
  })

  it('preserves original case in matched keyword', () => {
    const result = findMatches('use kafka here', keywordsByLength, keywordToSlug, '')
    expect(result).toHaveLength(1)
    expect(result[0].keyword).toBe('kafka')  // original case, not "Kafka"
    expect(result[0].slug).toBe('kafka-basics')
  })

  it('excludes matches whose slug equals excludeSlug', () => {
    const result = findMatches('use B-Tree', keywordsByLength, keywordToSlug, 'b-tree-structure')
    expect(result).toEqual([])
  })

  it('skips boundary-failing occurrences', () => {
    const result = findMatches('재인덱싱 설명', keywordsByLength, keywordToSlug, '')
    expect(result).toEqual([])
  })

  it('finds multiple distinct matches sorted by position', () => {
    const result = findMatches(
      '인덱스를 설명하고 B-Tree도 설명',
      keywordsByLength,
      keywordToSlug,
      '',
    )
    expect(result.map((m) => m.keyword)).toEqual(['인덱스', 'B-Tree'])
    expect(result[0].start).toBeLessThan(result[1].start)
  })

  it('handles empty text', () => {
    expect(findMatches('', keywordsByLength, keywordToSlug, '')).toEqual([])
  })

  it('skips overlap when shorter keyword falls inside claimed range', () => {
    // Kafka Consumer Group is already claimed — Kafka inside it should not re-match
    const result = findMatches(
      'Kafka Consumer Group을 사용',
      keywordsByLength,
      keywordToSlug,
      '',
    )
    expect(result).toHaveLength(1)
    expect(result[0].keyword).toBe('Kafka Consumer Group')
  })

  it('skips empty keywords without hanging', () => {
    const kwMap = new Map<string, string>([['', 'empty-slug'], ['B-Tree', 'b-tree-structure']])
    const byLen = ['B-Tree', '']
    const result = findMatches('use B-Tree here', byLen, kwMap, '')
    expect(result).toHaveLength(1)
    expect(result[0].keyword).toBe('B-Tree')
  })
})
