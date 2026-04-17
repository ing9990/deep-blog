import { describe, it, expect } from 'vitest'
import { toValue } from '@/components/mdx/tabs-utils'

describe('toValue', () => {
  it('lowercases', () => {
    expect(toValue('macOS')).toBe('macos')
  })

  it('trims whitespace', () => {
    expect(toValue('  Linux ')).toBe('linux')
  })

  it('preserves internal spaces and punctuation', () => {
    expect(toValue('Native Install (Recommended)')).toBe('native install (recommended)')
  })

  it('handles empty string', () => {
    expect(toValue('')).toBe('')
  })

  it('handles all-whitespace string', () => {
    expect(toValue('   ')).toBe('')
  })
})
