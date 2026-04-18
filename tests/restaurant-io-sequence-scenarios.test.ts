import { describe, it, expect } from 'vitest'
import {
  SCENARIOS,
  getActivitiesActiveAt,
  getArrowsAt,
} from '@/components/visualizations/RestaurantIOSequence.scenarios'

describe('SCENARIOS', () => {
  it('contains exactly 4 scenarios in fixed order', () => {
    expect(SCENARIOS.map((s) => s.key)).toEqual([
      'sync-blocking',
      'sync-nonblocking',
      'async-blocking',
      'async-nonblocking',
    ])
  })

  it('sync-blocking has 5 steps and customer-a is the active customer in every step', () => {
    const sb = SCENARIOS.find((s) => s.key === 'sync-blocking')!
    expect(sb.steps).toHaveLength(5)
    expect(sb.steps.every((s) => s.activeCustomer === 'customer-a')).toBe(true)
  })

  it('sync-blocking has activities defined for customer-a, staff, and kitchen', () => {
    const sb = SCENARIOS.find((s) => s.key === 'sync-blocking')!
    expect(sb.activities['customer-a'].length).toBeGreaterThan(0)
    expect(sb.activities['staff'].length).toBeGreaterThan(0)
    expect(sb.activities['kitchen'].length).toBeGreaterThan(0)
    expect(sb.activities['customer-b']).toEqual([])
    expect(sb.activities['customer-c']).toEqual([])
  })

  it('sync-blocking has at least one request and one response arrow', () => {
    const sb = SCENARIOS.find((s) => s.key === 'sync-blocking')!
    expect(sb.arrows.some((a) => a.kind === 'request')).toBe(true)
    expect(sb.arrows.some((a) => a.kind === 'response')).toBe(true)
  })

  it('sync-nonblocking has 6 steps with eagain arrows', () => {
    const sn = SCENARIOS.find((s) => s.key === 'sync-nonblocking')!
    expect(sn.steps).toHaveLength(6)
    expect(sn.arrows.filter((a) => a.kind === 'eagain').length).toBeGreaterThanOrEqual(2)
  })

  it('async-nonblocking has 5 steps with a kitchen→customer-a arrow (direct delivery)', () => {
    const an = SCENARIOS.find((s) => s.key === 'async-nonblocking')!
    expect(an.steps).toHaveLength(5)
    expect(an.arrows.some((a) => a.from === 'kitchen' && a.to === 'customer-a')).toBe(true)
  })

  it('async-blocking has 8 steps and uses all 3 customers as activeCustomer', () => {
    const ab = SCENARIOS.find((s) => s.key === 'async-blocking')!
    expect(ab.steps).toHaveLength(8)
    const customers = new Set(ab.steps.map((s) => s.activeCustomer).filter((c) => c !== null))
    expect(customers).toEqual(new Set(['customer-a', 'customer-b', 'customer-c']))
  })

  it('async-blocking has activities for all 3 customers (not just A)', () => {
    const ab = SCENARIOS.find((s) => s.key === 'async-blocking')!
    expect(ab.activities['customer-a'].length).toBeGreaterThan(0)
    expect(ab.activities['customer-b'].length).toBeGreaterThan(0)
    expect(ab.activities['customer-c'].length).toBeGreaterThan(0)
  })

  it('async-blocking has 3 bell arrows (one per customer)', () => {
    const ab = SCENARIOS.find((s) => s.key === 'async-blocking')!
    expect(ab.arrows.filter((a) => a.kind === 'bell')).toHaveLength(3)
  })
})

describe('getActivitiesActiveAt', () => {
  it('returns activity that contains the step (inclusive bounds)', () => {
    const activities = [{ fromStep: 1, toStep: 3, state: 'blocked' as const }]
    expect(getActivitiesActiveAt(activities, 0)).toEqual([])
    expect(getActivitiesActiveAt(activities, 1)).toEqual(activities)
    expect(getActivitiesActiveAt(activities, 3)).toEqual(activities)
    expect(getActivitiesActiveAt(activities, 4)).toEqual([])
  })

  it('returns multiple overlapping activities', () => {
    const activities = [
      { fromStep: 0, toStep: 2, state: 'comparing' as const },
      { fromStep: 1, toStep: 3, state: 'highlight' as const },
    ]
    expect(getActivitiesActiveAt(activities, 1)).toHaveLength(2)
  })
})

describe('getArrowsAt', () => {
  it('returns arrows whose atStep matches', () => {
    const arrows = [
      { atStep: 1, from: 'customer-a' as const, to: 'staff' as const, kind: 'request' as const, label: '주문' },
      { atStep: 2, from: 'staff' as const, to: 'kitchen' as const, kind: 'request' as const, label: '전달' },
    ]
    expect(getArrowsAt(arrows, 1)).toHaveLength(1)
    expect(getArrowsAt(arrows, 1)[0].label).toBe('주문')
    expect(getArrowsAt(arrows, 0)).toEqual([])
  })
})
