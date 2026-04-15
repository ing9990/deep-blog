import { describe, it, expect } from 'vitest'
import { calculateReadingTime } from '@/lib/reading-time'

describe('calculateReadingTime', () => {
  it('returns 1 for very short content', () => {
    expect(calculateReadingTime('짧은 글')).toBe(1)
  })

  it('returns 1 for exactly 500 chars', () => {
    const content = '가'.repeat(500)
    expect(calculateReadingTime(content)).toBe(1)
  })

  it('returns 2 for 501 chars', () => {
    const content = '가'.repeat(501)
    expect(calculateReadingTime(content)).toBe(2)
  })

  it('strips code blocks before counting', () => {
    const content = '짧은 문장\n\n```\n' + 'x'.repeat(10000) + '\n```\n\n끝'
    expect(calculateReadingTime(content)).toBe(1)
  })

  it('strips inline code and markdown syntax', () => {
    const content = '**강조** *이탤릭* `code` [link](url) # heading'
    expect(calculateReadingTime(content)).toBe(1)
  })
})
