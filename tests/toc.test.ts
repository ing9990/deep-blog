import { describe, it, expect } from 'vitest'
import { flattenToc, type VeliteTocEntry } from '@/lib/toc'

describe('flattenToc', () => {
  it('returns empty for empty input', () => {
    expect(flattenToc([])).toEqual([])
  })

  it('flattens a single h2 with no children', () => {
    const input: VeliteTocEntry[] = [
      { title: '개요', url: '#개요', items: [] },
    ]
    expect(flattenToc(input)).toEqual([
      { title: '개요', slug: '개요', depth: 2 },
    ])
  })

  it('flattens h2 with h3 children in order', () => {
    const input: VeliteTocEntry[] = [
      {
        title: '개요',
        url: '#개요',
        items: [
          { title: '배경', url: '#배경', items: [] },
          { title: '목표', url: '#목표', items: [] },
        ],
      },
    ]
    expect(flattenToc(input)).toEqual([
      { title: '개요', slug: '개요', depth: 2 },
      { title: '배경', slug: '배경', depth: 3 },
      { title: '목표', slug: '목표', depth: 3 },
    ])
  })

  it('flattens multiple h2s with mixed children', () => {
    const input: VeliteTocEntry[] = [
      { title: '첫번째', url: '#첫번째', items: [] },
      {
        title: '두번째',
        url: '#두번째',
        items: [{ title: '세부', url: '#세부', items: [] }],
      },
      { title: '세번째', url: '#세번째', items: [] },
    ]
    const result = flattenToc(input)
    expect(result.map((i) => i.title)).toEqual(['첫번째', '두번째', '세부', '세번째'])
    expect(result.map((i) => i.depth)).toEqual([2, 2, 3, 2])
  })

  it('strips leading # from url to produce slug', () => {
    const input: VeliteTocEntry[] = [
      { title: 'B-Tree', url: '#b-tree', items: [] },
    ]
    expect(flattenToc(input)[0].slug).toBe('b-tree')
  })

  it('ignores nested items deeper than h3 (defensive)', () => {
    const input: VeliteTocEntry[] = [
      {
        title: '개요',
        url: '#개요',
        items: [
          {
            title: '배경',
            url: '#배경',
            items: [{ title: '무시됨', url: '#무시됨', items: [] }],
          },
        ],
      },
    ]
    expect(flattenToc(input).map((i) => i.title)).toEqual(['개요', '배경'])
  })
})
