import { describe, expect, it } from 'vitest'
import { normalizeFontSize } from '@/components/providers/SettingsProvider'

describe('normalizeFontSize', () => {
  it('accepts valid values', () => {
    expect(normalizeFontSize('small')).toBe('small')
    expect(normalizeFontSize('normal')).toBe('normal')
    expect(normalizeFontSize('large')).toBe('large')
  })

  it('defaults to "normal" for invalid inputs', () => {
    expect(normalizeFontSize(undefined)).toBe('normal')
    expect(normalizeFontSize(null)).toBe('normal')
    expect(normalizeFontSize('xlarge')).toBe('normal')
    expect(normalizeFontSize(42)).toBe('normal')
    expect(normalizeFontSize({})).toBe('normal')
  })
})
