// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStepController } from '@/components/visualizations/common/useStepController'

// matchMedia is not implemented by jsdom; provide a stub so the hook's
// useEffect doesn't crash. Individual tests override .matches when needed.
type MatchMediaList = {
  matches: boolean
  media: string
  onchange: null
  addListener: (l: (e: MediaQueryListEvent) => void) => void
  removeListener: (l: (e: MediaQueryListEvent) => void) => void
  addEventListener: (t: string, l: (e: MediaQueryListEvent) => void) => void
  removeEventListener: (t: string, l: (e: MediaQueryListEvent) => void) => void
  dispatchEvent: (e: Event) => boolean
}

function installMatchMedia(matches: boolean): void {
  const list: MatchMediaList = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: () => list,
  })
}

beforeEach(() => {
  installMatchMedia(false)
})

describe('useStepController — initial state', () => {
  it('starts at step 0 with isPlaying=false, speed=3', () => {
    const { result } = renderHook(() => useStepController(5))
    expect(result.current.step).toBe(0)
    expect(result.current.totalSteps).toBe(5)
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.speed).toBe(3)
    expect(result.current.canPrev).toBe(false)
    expect(result.current.canNext).toBe(true)
    expect(result.current.progress).toBe(0)
    expect(result.current.reducedMotion).toBe(false)
  })

  it('respects initialSpeed option', () => {
    const { result } = renderHook(() => useStepController(5, { initialSpeed: 5 }))
    expect(result.current.speed).toBe(5)
  })

  it('totalSteps=1 yields canNext=false and progress=0', () => {
    const { result } = renderHook(() => useStepController(1))
    expect(result.current.canNext).toBe(false)
    expect(result.current.canPrev).toBe(false)
    expect(result.current.progress).toBe(0)
  })
})

describe('useStepController — step navigation', () => {
  it('next() advances step and flips canPrev', () => {
    const { result } = renderHook(() => useStepController(5))
    act(() => result.current.next())
    expect(result.current.step).toBe(1)
    expect(result.current.canPrev).toBe(true)
    expect(result.current.progress).toBeCloseTo(0.25, 5)
  })

  it('next() at last step is a no-op', () => {
    const { result } = renderHook(() => useStepController(3))
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.step).toBe(2)
    expect(result.current.canNext).toBe(false)
    act(() => result.current.next())
    expect(result.current.step).toBe(2)
  })

  it('prev() at step 0 is a no-op', () => {
    const { result } = renderHook(() => useStepController(3))
    act(() => result.current.prev())
    expect(result.current.step).toBe(0)
  })

  it('reset() returns to step 0 and pauses', () => {
    const { result } = renderHook(() => useStepController(5))
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.play())
    act(() => result.current.reset())
    expect(result.current.step).toBe(0)
    expect(result.current.isPlaying).toBe(false)
  })
})

describe('useStepController — goTo clamping and pause', () => {
  it('goTo(n) jumps to n and pauses', () => {
    const { result } = renderHook(() => useStepController(5))
    act(() => result.current.play())
    act(() => result.current.goTo(3))
    expect(result.current.step).toBe(3)
    expect(result.current.isPlaying).toBe(false)
  })

  it('goTo(-1) clamps to 0', () => {
    const { result } = renderHook(() => useStepController(5))
    act(() => result.current.goTo(-1))
    expect(result.current.step).toBe(0)
  })

  it('goTo(100) clamps to totalSteps-1', () => {
    const { result } = renderHook(() => useStepController(5))
    act(() => result.current.goTo(100))
    expect(result.current.step).toBe(4)
  })
})

describe('useStepController — setSpeed clamping', () => {
  it('setSpeed(5) sets speed=5', () => {
    const { result } = renderHook(() => useStepController(5))
    act(() => result.current.setSpeed(5))
    expect(result.current.speed).toBe(5)
  })

  it('setSpeed(0) clamps to 1', () => {
    const { result } = renderHook(() => useStepController(5))
    act(() => result.current.setSpeed(0))
    expect(result.current.speed).toBe(1)
  })

  it('setSpeed(10) clamps to 5', () => {
    const { result } = renderHook(() => useStepController(5))
    act(() => result.current.setSpeed(10))
    expect(result.current.speed).toBe(5)
  })
})

describe('useStepController — totalSteps rerender', () => {
  it('resets step and isPlaying when totalSteps changes', () => {
    const { result, rerender } = renderHook(
      ({ total }: { total: number }) => useStepController(total),
      { initialProps: { total: 5 } },
    )
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.play())
    rerender({ total: 10 })
    expect(result.current.step).toBe(0)
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.totalSteps).toBe(10)
  })
})

describe('useStepController — auto-play', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('auto-play stops when reaching the last step', () => {
    const { result } = renderHook(() => useStepController(3, { initialSpeed: 5 }))
    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(true)
    // speed 5 = 400ms per step; 3 steps = 2 advances needed
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current.step).toBe(1)
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current.step).toBe(2)
    expect(result.current.isPlaying).toBe(false)
  })
})

describe('useStepController — prefers-reduced-motion', () => {
  it('play() is a no-op when reducedMotion is true', () => {
    installMatchMedia(true)
    const { result } = renderHook(() => useStepController(5))
    expect(result.current.reducedMotion).toBe(true)
    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(false)
  })
})
