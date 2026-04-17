import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n/messages'

describe('translate()', () => {
  it('returns the Korean string when lang=ko', () => {
    expect(translate('settings.title', 'ko')).toBe('설정')
  })

  it('returns the English string when lang=en', () => {
    expect(translate('settings.title', 'en')).toBe('Settings')
  })

  it('interpolates {n} param', () => {
    expect(translate('post.reading.time', 'ko', { n: 3 })).toBe('읽기 3분')
    expect(translate('post.reading.time', 'en', { n: 3 })).toBe('3 min read')
  })

  it('supports multi-param interpolation', () => {
    expect(translate('index.total.count', 'ko', { n: 12 })).toBe('전체 12개 글')
    expect(translate('index.total.count', 'en', { n: 12 })).toBe('12 posts total')
  })

  it('returns the raw template unchanged when no params provided for a parameterized key', () => {
    expect(translate('post.reading.time', 'ko')).toBe('읽기 {n}분')
  })
})
