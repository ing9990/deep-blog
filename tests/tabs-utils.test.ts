import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { toValue, extractTabs } from '@/components/mdx/tabs-utils'

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

// Stand-in for the real <Tab> component. Since extractTabs identifies tabs by
// duck-typing on a string `label` prop (see tabs-utils.ts), any component will
// do — its identity is not consulted.
const FakeTab = (_props: { label: string; children?: unknown }) => null
const OtherComponent = () => null

describe('extractTabs', () => {
  it('returns empty array for no children', () => {
    expect(extractTabs(undefined)).toEqual([])
    expect(extractTabs(null)).toEqual([])
    expect(extractTabs([])).toEqual([])
  })

  it('picks out Tab elements and normalizes value', () => {
    const tabs = extractTabs([
      createElement(FakeTab, { label: 'macOS', children: 'mac body' }),
      createElement(FakeTab, { label: 'Linux', children: 'linux body' }),
    ])
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toMatchObject({ label: 'macOS', value: 'macos', children: 'mac body' })
    expect(tabs[1]).toMatchObject({ label: 'Linux', value: 'linux', children: 'linux body' })
  })

  it('ignores children without a string label prop', () => {
    const tabs = extractTabs([
      createElement(FakeTab, { label: 'A' }),
      createElement(OtherComponent, {}),
      'loose text',
    ])
    expect(tabs).toHaveLength(1)
    expect(tabs[0].label).toBe('A')
  })

  it('deduplicates by normalized value, first wins', () => {
    const tabs = extractTabs([
      createElement(FakeTab, { label: 'macOS', children: 'first' }),
      createElement(FakeTab, { label: '  macos ', children: 'second' }),
    ])
    expect(tabs).toHaveLength(1)
    expect(tabs[0].children).toBe('first')
  })

  it('falls back to "unlabeled" when label is empty or whitespace', () => {
    const tabs = extractTabs([
      createElement(FakeTab, { label: '' as string }),
      createElement(FakeTab, { label: '   ' as string }),
    ])
    // both empty-ish labels normalize to "" via toValue -> dedup -> length 1
    expect(tabs).toHaveLength(1)
    expect(tabs[0].label).toBe('unlabeled')
    expect(tabs[0].value).toBe('unlabeled')
  })

  it('accepts a single (non-array) child', () => {
    const tabs = extractTabs(createElement(FakeTab, { label: 'Only' }))
    expect(tabs).toHaveLength(1)
  })
})
