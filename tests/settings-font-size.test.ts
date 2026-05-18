import { describe, expect, it } from 'vitest'
import { normalizeFontSize } from '@/components/providers/SettingsProvider'

describe('normalizeFontSize', () => {
  it('accepts the two valid values', () => {
    expect(normalizeFontSize('small')).toBe('small')
    expect(normalizeFontSize('large')).toBe('large')
  })

  it('defaults to "small" for invalid inputs', () => {
    expect(normalizeFontSize(undefined)).toBe('small')
    expect(normalizeFontSize(null)).toBe('small')
    // 'normal' is a retired value — legacy localStorage entries collapse
    // to the current default.
    expect(normalizeFontSize('normal')).toBe('small')
    expect(normalizeFontSize('xlarge')).toBe('small')
    expect(normalizeFontSize(42)).toBe('small')
    expect(normalizeFontSize({})).toBe('small')
  })
})
