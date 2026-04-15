# Phase 4.1 Visualization Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract visualization boilerplate from `QuickSort.tsx` into a reusable framework (`VisualContainer` + `StepController` + `SpeedSlider` + `useStepController` hook), backed by 18 `--viz-*` CSS tokens (6 states × 3 slots), with QuickSort refactored as the first consumer in two commits (pure refactor → feature add).

**Architecture:** Custom hook (`useStepController`) encapsulates state management; dumb components (`<StepController />`, `<SpeedSlider />`) receive the hook's return value via prop spreading. Colors are defined as CSS custom properties in `app/globals.css` and exposed as Tailwind utilities through `@theme inline` mapping — the same pattern Phase 2 used for Callout and code block tokens. The framework lives in `components/visualizations/common/` so domain visualizations and shared primitives stay cleanly separated.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4 (`@theme inline`), Vitest 2 + `@testing-library/react` 16 (jsdom per-file pragma), `lucide-react` icons, `next-themes` (`data-theme` attribute).

**Related spec:** `docs/superpowers/specs/2026-04-15-phase-4-visualization-framework.md`

---

## File Structure

**New files:**
- `components/visualizations/common/colors.ts` — `VIZ_STATES` tuple + `vizStateClasses()` helper. Pure constants + helper, no React.
- `components/visualizations/common/useStepController.ts` — state management hook (useState × 4, useEffect × 3, useCallback actions).
- `components/visualizations/common/VisualContainer.tsx` — server component wrapper (figure + figcaption + optional reset button).
- `components/visualizations/common/SpeedSlider.tsx` — client component (battery-gauge style 5-segment control).
- `components/visualizations/common/StepController.tsx` — client component (controls row + progress bar + step description). Consumes `StepControllerState` via prop spread.
- `tests/use-step-controller.test.ts` — Vitest unit tests with `// @vitest-environment jsdom` pragma.

**Modified files:**
- `app/globals.css` — add 18 `--viz-*` variables to `:root` and `[data-theme="dark"]`, plus 18 `--color-viz-*` mappings in `@theme inline`.
- `components/visualizations/QuickSort.tsx` — refactor in two commits.
- `package.json` — add `@testing-library/react`, `@testing-library/dom`, `jsdom` as devDependencies.
- `CLAUDE.md` §6 (Phase 4 update) + §12 priority table + add §16 Phase 4 현황.
- `.claude/skills/blog-writer/references/visualization-rules.md` — new Step-by-step template using the framework.

---

## Task 1: Add `--viz-*` color tokens to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add 18 light-mode `--viz-*` variables inside `:root`**

Insert the block below at the end of the `:root` block (after `--code-traffic-green: #28C840;` on line ~91, before the closing `}` on line 92):

```css
  /* Visualization state tokens — 6 states × 3 slots = 18 variables.
     Consumed by components in components/visualizations/common/. New states
     must be added here AND in the [data-theme="dark"] block AND in
     @theme inline mapping AND in VIZ_STATES in common/colors.ts. */
  --viz-pivot-border:     #F59E0B;
  --viz-pivot-bg:         #FEF3C7;
  --viz-pivot-fg:         #78350F;

  --viz-comparing-border: #3B82F6;
  --viz-comparing-bg:     #DBEAFE;
  --viz-comparing-fg:     #1E3A8A;

  --viz-confirmed-border: #10B981;
  --viz-confirmed-bg:     #D1FAE5;
  --viz-confirmed-fg:     #064E3B;

  --viz-blocked-border:   #EF4444;
  --viz-blocked-bg:       #FEE2E2;
  --viz-blocked-fg:       #7F1D1D;

  --viz-waiting-border:   #9CA3AF;
  --viz-waiting-bg:       #F3F4F6;
  --viz-waiting-fg:       #374151;

  --viz-highlight-border: #8B5CF6;
  --viz-highlight-bg:     #EDE9FE;
  --viz-highlight-fg:     #4C1D95;
```

- [ ] **Step 2: Add 18 dark-mode `--viz-*` variables inside `[data-theme="dark"]`**

Insert at the end of the `[data-theme="dark"]` block (after `--code-traffic-green: #28C840;` on line ~149, before the closing `}` on line 150):

```css
  /* Visualization state tokens — dark mode. Muted backgrounds with pale
     foregrounds for contrast on #09090B. See :root for the light variant. */
  --viz-pivot-border:     #FBBF24;
  --viz-pivot-bg:         #3B2D05;
  --viz-pivot-fg:         #FEF3C7;

  --viz-comparing-border: #60A5FA;
  --viz-comparing-bg:     #0F1E3D;
  --viz-comparing-fg:     #DBEAFE;

  --viz-confirmed-border: #34D399;
  --viz-confirmed-bg:     #042F1F;
  --viz-confirmed-fg:     #D1FAE5;

  --viz-blocked-border:   #F87171;
  --viz-blocked-bg:       #2B0A0A;
  --viz-blocked-fg:       #FECACA;

  --viz-waiting-border:   #4B5563;
  --viz-waiting-bg:       #18181B;
  --viz-waiting-fg:       #D1D5DB;

  --viz-highlight-border: #A78BFA;
  --viz-highlight-bg:     #1E1147;
  --viz-highlight-fg:     #E9D5FF;
```

- [ ] **Step 3: Add 18 `--color-viz-*` mappings inside `@theme inline`**

Insert at the end of the `@theme inline` block (after `--color-destructive-foreground: var(--destructive-foreground);` on line 24, before the `--font-sans` line on line 26):

```css

  /* Visualization state tokens — maps --viz-* variables to Tailwind utilities.
     Generates bg-viz-pivot, border-viz-pivot, text-viz-pivot-fg, etc. */
  --color-viz-pivot:         var(--viz-pivot-border);
  --color-viz-pivot-bg:      var(--viz-pivot-bg);
  --color-viz-pivot-fg:      var(--viz-pivot-fg);

  --color-viz-comparing:     var(--viz-comparing-border);
  --color-viz-comparing-bg:  var(--viz-comparing-bg);
  --color-viz-comparing-fg:  var(--viz-comparing-fg);

  --color-viz-confirmed:     var(--viz-confirmed-border);
  --color-viz-confirmed-bg:  var(--viz-confirmed-bg);
  --color-viz-confirmed-fg:  var(--viz-confirmed-fg);

  --color-viz-blocked:       var(--viz-blocked-border);
  --color-viz-blocked-bg:    var(--viz-blocked-bg);
  --color-viz-blocked-fg:    var(--viz-blocked-fg);

  --color-viz-waiting:       var(--viz-waiting-border);
  --color-viz-waiting-bg:    var(--viz-waiting-bg);
  --color-viz-waiting-fg:    var(--viz-waiting-fg);

  --color-viz-highlight:     var(--viz-highlight-border);
  --color-viz-highlight-bg:  var(--viz-highlight-bg);
  --color-viz-highlight-fg:  var(--viz-highlight-fg);
```

- [ ] **Step 4: Verify build still passes**

Run: `pnpm build`
Expected: Build succeeds. Tailwind picks up the new mapping without complaint (no generated utility is actually consumed yet, but the @theme inline block must parse).

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "$(cat <<'EOF'
feat(styles): add --viz-* tokens for visualization framework

18 CSS variables (6 states × 3 slots: border/bg/fg) in both :root and
[data-theme="dark"], plus @theme inline mapping to generate Tailwind
utilities (bg-viz-pivot, border-viz-pivot, text-viz-pivot-fg, …).

Phase 4.1 preparation — consumed by components/visualizations/common/
in the next commits.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Install test dependencies

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (automatic)

`useStepController` needs a jsdom test environment and `@testing-library/react` for `renderHook`. The global `vitest.config.ts` keeps `environment: 'node'` for everything else — jsdom is opted-in per-file via pragma.

- [ ] **Step 1: Install the three packages**

Run: `pnpm add -D @testing-library/react@^16.1.0 @testing-library/dom@^10.4.0 jsdom@^25.0.1`
Expected: pnpm adds them to `devDependencies` and updates the lockfile. No breaking output.

- [ ] **Step 2: Verify package.json has the new entries**

Read `package.json` and confirm `@testing-library/react`, `@testing-library/dom`, and `jsdom` are in `devDependencies`.

- [ ] **Step 3: Verify existing tests still pass**

Run: `pnpm test`
Expected: All existing tests (~87) still green. New dependencies don't affect them.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore(deps): add @testing-library/react + jsdom for hook tests

Required by the upcoming useStepController unit tests. Opt-in per-file
via // @vitest-environment jsdom pragma — global vitest.config stays
on environment: 'node'.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `colors.ts` (VIZ_STATES + helper)

**Files:**
- Create: `components/visualizations/common/colors.ts`

- [ ] **Step 1: Create the file with the const tuple and helper**

```typescript
// components/visualizations/common/colors.ts

/**
 * Single source of truth for visualization state names.
 *
 * Adding a new state requires 4 coordinated edits:
 *   1. app/globals.css :root — add --viz-<state>-{border,bg,fg}
 *   2. app/globals.css [data-theme="dark"] — add the same 3 variables
 *   3. app/globals.css @theme inline — add --color-viz-<state>{,-bg,-fg}
 *   4. This file — append to VIZ_STATES below
 *
 * Extension guide:
 *   docs/superpowers/specs/2026-04-15-phase-4-visualization-framework.md §6.6
 */
export const VIZ_STATES = [
  'pivot',
  'comparing',
  'confirmed',
  'blocked',
  'waiting',
  'highlight',
] as const

export type VizState = (typeof VIZ_STATES)[number]

/**
 * Returns the Tailwind utility class triple (border + bg + fg) for a state.
 * Uses literal template strings so Tailwind's content scanner picks them up.
 */
export function vizStateClasses(state: VizState): string {
  switch (state) {
    case 'pivot':
      return 'border-viz-pivot bg-viz-pivot-bg text-viz-pivot-fg'
    case 'comparing':
      return 'border-viz-comparing bg-viz-comparing-bg text-viz-comparing-fg'
    case 'confirmed':
      return 'border-viz-confirmed bg-viz-confirmed-bg text-viz-confirmed-fg'
    case 'blocked':
      return 'border-viz-blocked bg-viz-blocked-bg text-viz-blocked-fg'
    case 'waiting':
      return 'border-viz-waiting bg-viz-waiting-bg text-viz-waiting-fg'
    case 'highlight':
      return 'border-viz-highlight bg-viz-highlight-bg text-viz-highlight-fg'
  }
}
```

**Why a switch and not `` `border-viz-${state}` ``**: Tailwind v4's content scanner reads class *literals* from source files. A template-string class name never appears as a literal and gets tree-shaken out of the generated CSS. Each case returns static literals, which is the safe pattern.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/visualizations/common/colors.ts
git commit -m "$(cat <<'EOF'
feat(viz): add colors.ts with VIZ_STATES and vizStateClasses helper

Single source of truth for the 6-state visualization vocabulary.
vizStateClasses() returns Tailwind utility literals (not template
strings) so the content scanner picks them up correctly.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Write `useStepController` tests (RED phase)

**Files:**
- Create: `tests/use-step-controller.test.ts`

The hook doesn't exist yet — these tests will fail to import. That's the RED phase. Task 5 implements the hook and makes them pass.

- [ ] **Step 1: Create the test file with 14 cases**

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail (RED)**

Run: `pnpm test:unit tests/use-step-controller.test.ts`
Expected: FAIL with "Cannot find module '@/components/visualizations/common/useStepController'" or similar import error. The test file must at least parse — if the parse itself fails, fix the test file before proceeding.

- [ ] **Step 3: Commit**

```bash
git add tests/use-step-controller.test.ts
git commit -m "$(cat <<'EOF'
test(viz): add useStepController hook tests (RED phase)

14 cases covering initial state, step navigation, goTo clamping,
setSpeed clamping, totalSteps rerender reset, auto-play boundary,
and prefers-reduced-motion. Uses // @vitest-environment jsdom pragma
so the global vitest environment stays on node.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Implement `useStepController` hook (GREEN phase)

**Files:**
- Create: `components/visualizations/common/useStepController.ts`

- [ ] **Step 1: Create the hook file**

```typescript
// components/visualizations/common/useStepController.ts
import { useCallback, useEffect, useState } from 'react'

export interface UseStepControllerOptions {
  /** Initial playback speed level, 1 (slowest) to 5 (fastest). Default 3. */
  initialSpeed?: number
  /** Whether auto-play should start immediately. Default false. Ignored if reducedMotion is true. */
  initialPlaying?: boolean
}

export interface StepControllerState {
  readonly step: number
  readonly totalSteps: number
  readonly isPlaying: boolean
  readonly speed: number
  readonly canPrev: boolean
  readonly canNext: boolean
  readonly progress: number
  readonly reducedMotion: boolean

  prev: () => void
  next: () => void
  play: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  setSpeed: (speed: number) => void
  goTo: (step: number) => void
}

const SPEED_MAP: Record<number, number> = {
  1: 1600,
  2: 1200,
  3: 800,
  4: 600,
  5: 400,
}

function clampSpeed(speed: number): number {
  return Math.max(1, Math.min(5, Math.round(speed)))
}

function speedToMs(speed: number): number {
  return SPEED_MAP[clampSpeed(speed)]
}

export function useStepController(
  totalSteps: number,
  options: UseStepControllerOptions = {},
): StepControllerState {
  const { initialSpeed = 3, initialPlaying = false } = options

  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(initialPlaying)
  const [speed, setSpeedState] = useState(() => clampSpeed(initialSpeed))
  const [reducedMotion, setReducedMotion] = useState(false)

  // Reset step/play when totalSteps changes (e.g., parent passed new data).
  useEffect(() => {
    setStep(0)
    setIsPlaying(false)
  }, [totalSteps])

  // Detect prefers-reduced-motion and subscribe to changes.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = (): void => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // If reducedMotion becomes true while playing, force-pause.
  useEffect(() => {
    if (reducedMotion && isPlaying) {
      setIsPlaying(false)
    }
  }, [reducedMotion, isPlaying])

  // Auto-play timer.
  useEffect(() => {
    if (!isPlaying) return
    if (reducedMotion) return
    if (step >= totalSteps - 1) {
      setIsPlaying(false)
      return
    }
    const handle = setTimeout(() => {
      setStep((s) => Math.min(totalSteps - 1, s + 1))
    }, speedToMs(speed))
    return () => clearTimeout(handle)
  }, [isPlaying, step, speed, totalSteps, reducedMotion])

  const prev = useCallback((): void => {
    setStep((s) => (s > 0 ? s - 1 : s))
  }, [])

  const next = useCallback((): void => {
    setStep((s) => (s < totalSteps - 1 ? s + 1 : s))
  }, [totalSteps])

  const play = useCallback((): void => {
    if (reducedMotion) return
    setStep((s) => {
      if (s >= totalSteps - 1) return s
      setIsPlaying(true)
      return s
    })
  }, [reducedMotion, totalSteps])

  const pause = useCallback((): void => {
    setIsPlaying(false)
  }, [])

  const toggle = useCallback((): void => {
    setIsPlaying((p) => {
      if (p) return false
      if (reducedMotion) return false
      return true
    })
  }, [reducedMotion])

  const reset = useCallback((): void => {
    setStep(0)
    setIsPlaying(false)
  }, [])

  const setSpeed = useCallback((s: number): void => {
    setSpeedState(clampSpeed(s))
  }, [])

  const goTo = useCallback(
    (n: number): void => {
      const clamped = Math.max(0, Math.min(totalSteps - 1, Math.round(n)))
      setStep(clamped)
      setIsPlaying(false)
    },
    [totalSteps],
  )

  const canPrev = step > 0
  const canNext = step < totalSteps - 1
  const progress = totalSteps > 1 ? step / (totalSteps - 1) : 0

  return {
    step,
    totalSteps,
    isPlaying,
    speed,
    canPrev,
    canNext,
    progress,
    reducedMotion,
    prev,
    next,
    play,
    pause,
    toggle,
    reset,
    setSpeed,
    goTo,
  }
}
```

- [ ] **Step 2: Run tests to verify they pass (GREEN)**

Run: `pnpm test:unit tests/use-step-controller.test.ts`
Expected: All 14 cases PASS.

- [ ] **Step 3: Run the full test suite to verify nothing regressed**

Run: `pnpm test`
Expected: All existing tests + 14 new ones green. Approximately 87 + 14 = 101 total.

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add components/visualizations/common/useStepController.ts
git commit -m "$(cat <<'EOF'
feat(viz): implement useStepController hook (GREEN phase)

State management for step-by-step visualizations — step/isPlaying/speed
with auto-play timer, prefers-reduced-motion detection, and goTo-clamp-
and-pause semantics. All 14 unit tests green.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Create `VisualContainer` component

**Files:**
- Create: `components/visualizations/common/VisualContainer.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/visualizations/common/VisualContainer.tsx
import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VisualContainerProps {
  /** Visualization title shown in the figcaption. */
  title: string
  /** Optional single-line description under the title. */
  description?: string
  /** Visualization body (array/tree/timeline/…) + controller. */
  children: ReactNode
  /** Optional reset handler. When provided, renders a top-right reset button. */
  onReset?: () => void
  /** Extra class names for the outer figure. */
  className?: string
}

export function VisualContainer({
  title,
  description,
  children,
  onReset,
  className,
}: VisualContainerProps) {
  return (
    <figure
      className={cn(
        'not-prose my-8 rounded-[14px] border border-border bg-background p-5',
        className,
      )}
    >
      <figcaption className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="초기 상태로 리셋"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </figcaption>
      {children}
    </figure>
  )
}
```

**Why this is a server component** (no `'use client'`): `VisualContainer` has no state, no event handlers that touch state it owns, and no effects. `onReset` is invoked from a button, but when this component is rendered inside a client component (which it will be, since `QuickSort.tsx` has `'use client'`), the button handler reference flows through normally. If you try to use this in a pure server tree, Next.js will surface the expected "event handlers cannot be passed" error — the caller then wraps it.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/visualizations/common/VisualContainer.tsx
git commit -m "$(cat <<'EOF'
feat(viz): add VisualContainer component

Figure wrapper with title, optional description, and optional reset
button. Matches the current QuickSort figure structure pixel-for-pixel
so the refactor stays visual-identical.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create `SpeedSlider` component

**Files:**
- Create: `components/visualizations/common/SpeedSlider.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/visualizations/common/SpeedSlider.tsx
'use client'

import { cn } from '@/lib/utils'

export interface SpeedSliderProps {
  /** Current speed level, 1 (slowest) to 5 (fastest). */
  speed: number
  /** Callback fired when the user clicks a segment. */
  onChange: (speed: number) => void
  className?: string
}

const LEVELS = [1, 2, 3, 4, 5] as const

export function SpeedSlider({ speed, onChange, className }: SpeedSliderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-[11px] text-muted-foreground',
        className,
      )}
      role="group"
      aria-label="재생 속도"
    >
      <span className="hidden sm:inline">속도</span>
      <div className="flex items-center gap-0.5">
        {LEVELS.map((level) => {
          const active = level <= speed
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              aria-label={`속도 ${level}`}
              aria-pressed={speed === level}
              className={cn(
                'h-5 w-2 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-primary' : 'bg-border',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/visualizations/common/SpeedSlider.tsx
git commit -m "$(cat <<'EOF'
feat(viz): add SpeedSlider component

5-segment battery-gauge control. Accessible via role=group + aria-label
+ aria-pressed per segment, keyboard-focusable, primary-tinted fill
for active levels.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Create `StepController` component

**Files:**
- Create: `components/visualizations/common/StepController.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/visualizations/common/StepController.tsx
'use client'

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpeedSlider } from './SpeedSlider'
import type { StepControllerState } from './useStepController'

export interface StepControllerProps extends StepControllerState {
  /** Optional single-line note for the current step (rendered above controls). */
  stepDescription?: string
  /** Whether to render the SpeedSlider. Default true. Auto-hidden when reducedMotion. */
  showSpeedSlider?: boolean
  /** Whether to render the clickable progress bar. Default true. */
  showProgressBar?: boolean
  className?: string
}

export function StepController({
  step,
  totalSteps,
  isPlaying,
  speed,
  canPrev,
  canNext,
  progress,
  reducedMotion,
  prev,
  next,
  toggle,
  reset,
  setSpeed,
  goTo,
  stepDescription,
  showSpeedSlider = true,
  showProgressBar = true,
  className,
}: StepControllerProps) {
  const lastStep = totalSteps - 1
  const showSlider = showSpeedSlider && !reducedMotion
  const showBar = showProgressBar && totalSteps > 1

  return (
    <div className={cn('mt-4 space-y-3', className)}>
      {stepDescription && (
        <div className="rounded-[10px] border border-border bg-muted/30 p-3 text-[13px] leading-relaxed text-foreground">
          <span className="font-semibold">
            Step {step} / {lastStep}:
          </span>{' '}
          {stepDescription}
        </div>
      )}

      {showBar && (
        <ProgressBar
          progress={progress}
          step={step}
          totalSteps={totalSteps}
          onJump={goTo}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <ControlButton
            onClick={reset}
            disabled={step === 0 && !isPlaying}
            ariaLabel="처음으로 리셋"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </ControlButton>
          <ControlButton onClick={prev} disabled={!canPrev} ariaLabel="이전 단계">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </ControlButton>
          <ControlButton
            onClick={toggle}
            disabled={!canNext || reducedMotion}
            ariaLabel={isPlaying ? '일시정지' : '자동 재생'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </ControlButton>
          <ControlButton onClick={next} disabled={!canNext} ariaLabel="다음 단계">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </ControlButton>
        </div>
        {showSlider && <SpeedSlider speed={speed} onChange={setSpeed} />}
      </div>
    </div>
  )
}

interface ControlButtonProps {
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
  children: ReactNode
}

function ControlButton({ onClick, disabled, ariaLabel, children }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

interface ProgressBarProps {
  progress: number
  step: number
  totalSteps: number
  onJump: (step: number) => void
}

function ProgressBar({ progress, step, totalSteps, onJump }: ProgressBarProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    onJump(Math.round(ratio * (totalSteps - 1)))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative block h-2 w-full overflow-hidden rounded-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={0}
      aria-valuemax={totalSteps - 1}
      aria-label="진행 상황 — 클릭해서 점프"
    >
      <span
        className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-300"
        style={{ width: `${progress * 100}%` }}
        aria-hidden="true"
      />
    </button>
  )
}
```

**Why `play` and `pause` aren't destructured**: The component accepts the full `StepControllerState` for prop-spread ergonomics at the caller (`<StepController {...controller} />`), but only needs `toggle()` internally. TypeScript allows destructuring a subset of an interface — the unused `play`/`pause` fields stay in the type but are never bound as locals, so there's nothing to flag.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Build to verify Tailwind picks up all classes**

Run: `pnpm build`
Expected: Build succeeds. No warnings about unused utilities.

- [ ] **Step 4: Commit**

```bash
git add components/visualizations/common/StepController.tsx
git commit -m "$(cat <<'EOF'
feat(viz): add StepController component

Controls row (reset/prev/toggle/next) + clickable progress bar + step
description + SpeedSlider. Consumes StepControllerState via prop spread
so consumers write <StepController {...controller} />.

ProgressBar is a <button role=progressbar> so keyboard focus and click
work together; aria-valuenow/min/max report the current step.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: QuickSort pure refactor (commit 1)

**Files:**
- Modify: `components/visualizations/QuickSort.tsx`

Visual result must be **pixel-identical** to the current version. No SpeedSlider, no progress bar. Only the internals change.

- [ ] **Step 1: Replace QuickSort.tsx with the refactored version**

```tsx
'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

interface QuickSortProps {
  initial?: number[]
  description?: string
}

interface Snapshot {
  array: number[]
  pivotIndex: number | null
  comparing: number[]
  sorted: Set<number>
  note: string
}

function quickSortSnapshots(initial: number[]): Snapshot[] {
  const snapshots: Snapshot[] = []
  const arr = initial.slice()
  const sorted = new Set<number>()

  snapshots.push({
    array: arr.slice(),
    pivotIndex: null,
    comparing: [],
    sorted: new Set(sorted),
    note: '초기 배열입니다.',
  })

  function partition(lo: number, hi: number): number {
    const pivotIndex = hi
    snapshots.push({
      array: arr.slice(),
      pivotIndex,
      comparing: [],
      sorted: new Set(sorted),
      note: `피벗 선택: arr[${pivotIndex}] = ${arr[pivotIndex]}`,
    })

    let i = lo - 1
    for (let j = lo; j < hi; j++) {
      snapshots.push({
        array: arr.slice(),
        pivotIndex,
        comparing: [j],
        sorted: new Set(sorted),
        note: `arr[${j}] = ${arr[j]} 와 피벗 ${arr[pivotIndex]} 비교`,
      })
      if (arr[j] <= arr[pivotIndex]) {
        i++
        if (i !== j) {
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
          snapshots.push({
            array: arr.slice(),
            pivotIndex,
            comparing: [i, j],
            sorted: new Set(sorted),
            note: `arr[${i}] 와 arr[${j}] 를 교환`,
          })
        }
      }
    }
    i++
    ;[arr[i], arr[hi]] = [arr[hi], arr[i]]
    sorted.add(i)
    snapshots.push({
      array: arr.slice(),
      pivotIndex: i,
      comparing: [],
      sorted: new Set(sorted),
      note: `피벗을 최종 위치 ${i} 로 이동. 이 위치는 확정됩니다.`,
    })
    return i
  }

  function sort(lo: number, hi: number): void {
    if (lo >= hi) {
      if (lo === hi) sorted.add(lo)
      return
    }
    const p = partition(lo, hi)
    sort(lo, p - 1)
    sort(p + 1, hi)
  }

  sort(0, arr.length - 1)

  snapshots.push({
    array: arr.slice(),
    pivotIndex: null,
    comparing: [],
    sorted: new Set(Array.from({ length: arr.length }, (_, i) => i)),
    note: '정렬 완료!',
  })

  return snapshots
}

export function QuickSort({
  initial = [38, 27, 43, 3, 9, 82, 10],
  description = '피벗을 기준으로 배열이 분할되는 과정을 단계별로 확인하세요.',
}: QuickSortProps) {
  const snapshots = useMemo(() => quickSortSnapshots(initial), [initial])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]
  const maxValue = Math.max(...initial)

  return (
    <VisualContainer title="Quick Sort 분할 과정" description={description}>
      <div className="flex min-h-[180px] items-end justify-center gap-2 rounded-[10px] bg-muted/40 p-4">
        {current.array.map((value, idx) => {
          const isPivot = idx === current.pivotIndex
          const isComparing = current.comparing.includes(idx)
          const isSorted = current.sorted.has(idx)

          const stateClass = isPivot
            ? vizStateClasses('pivot')
            : isComparing
              ? vizStateClasses('comparing')
              : isSorted
                ? vizStateClasses('confirmed')
                : 'border-border bg-background text-foreground'

          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex w-10 items-end justify-center rounded-[6px] border-2 text-[13px] font-semibold transition-all duration-300',
                  stateClass,
                )}
                style={{ height: `${(value / maxValue) * 100 + 32}px` }}
              >
                <span className="pb-1">{value}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{idx}</span>
            </div>
          )
        })}
      </div>

      <StepController
        {...controller}
        stepDescription={current.note}
        showSpeedSlider={false}
        showProgressBar={false}
      />

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot stateClass="bg-viz-pivot-bg border-viz-pivot" label="피벗" />
        <LegendDot stateClass="bg-viz-comparing-bg border-viz-comparing" label="비교 중" />
        <LegendDot stateClass="bg-viz-confirmed-bg border-viz-confirmed" label="확정" />
      </div>
    </VisualContainer>
  )
}

function LegendDot({ stateClass, label }: { stateClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-sm border-2', stateClass)}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
```

**Key changes from the original 218-line version:**
1. Removes `useState`/`useEffect` state management → `useStepController` hook
2. Removes `figure`/`figcaption`/controls markup → `VisualContainer` + `StepController`
3. Replaces hardcoded `amber/blue/emerald` Tailwind classes → `vizStateClasses('pivot'|'comparing'|'confirmed')`
4. Legend updated to consume `bg-viz-*-bg` / `border-viz-*` utilities directly
5. `showSpeedSlider={false}` + `showProgressBar={false}` preserves the original visual (commit 2 enables them)

**What is intentionally the same:**
- `quickSortSnapshots()` algorithm: unchanged byte-for-byte
- `Snapshot` interface: unchanged
- Public props `initial` and `description`: unchanged — existing MDX keeps working
- Array bar visual: height calc, classes, transition-duration all match

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Run dev server and visually compare**

Run: `pnpm dev`
Open: http://localhost:3000/posts/quick-sort

Expected visual check (compared to Phase 2/3 screenshots):
- Array bars in the same positions with the same colors (amber pivot, blue comparing, emerald confirmed)
- Step description box reads `Step N / M: ...` in the same position
- Four control buttons (reset, prev, play/pause, next) in the same order/size
- Legend row (피벗 / 비교 중 / 확정) with 3 small squares in the same position
- No speed slider, no progress bar
- Dark mode: bars use darkened token backgrounds, legend adapts

If any difference is noticeable, fix inline before committing.

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: All tests pass. QuickSort has no tests, so no new failures.

- [ ] **Step 6: Commit**

```bash
git add components/visualizations/QuickSort.tsx
git commit -m "$(cat <<'EOF'
refactor(viz): migrate QuickSort to the common framework

Pure refactor — visually identical to the previous version.
- State management: useState/useEffect → useStepController hook
- Chrome: handwritten figure → VisualContainer
- Controls: handwritten buttons → StepController (slider/progress
  hidden to preserve the Phase 2 visual)
- Colors: amber/blue/emerald Tailwind literals → vizStateClasses()

218 lines → ~170 lines. Algorithm (quickSortSnapshots) and public API
(initial/description props) unchanged.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: QuickSort feature add — expose SpeedSlider + progress bar (commit 2)

**Files:**
- Modify: `components/visualizations/QuickSort.tsx`

- [ ] **Step 1: Remove the two `show*={false}` props from `<StepController>`**

In `components/visualizations/QuickSort.tsx`, change:

```tsx
      <StepController
        {...controller}
        stepDescription={current.note}
        showSpeedSlider={false}
        showProgressBar={false}
      />
```

to:

```tsx
      <StepController {...controller} stepDescription={current.note} />
```

The defaults (`showSpeedSlider={true}`, `showProgressBar={true}`) take over.

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Dev server manual verification**

Run: `pnpm dev`
Open: http://localhost:3000/posts/quick-sort

Manual checks:
1. **Progress bar**: Visible above the controls row. Filled up to the current step in `primary` color. Click the middle → step jumps to ~½ × totalSteps, auto-play stops if it was running.
2. **Speed slider**: Visible to the right of the controls row as 5 small segments. Click segment 5 → speed increases (if currently auto-playing, steps advance every 400ms).
3. **Auto-play from start**: Click Play → steps advance, progress bar animates. Auto-play stops at the last step and the button returns to Play.
4. **Reduced motion**: In Chrome devtools, open Command Menu (Cmd+Shift+P) → "Show rendering" → "Emulate CSS media feature prefers-reduced-motion" → "reduce". Expect: SpeedSlider disappears, Play button becomes disabled, Prev/Next still work.

If any of these fails, debug and fix inline before committing.

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: All green.

- [ ] **Step 5: Commit**

```bash
git add components/visualizations/QuickSort.tsx
git commit -m "$(cat <<'EOF'
feat(viz): expose SpeedSlider and progress bar in QuickSort

Drops the showSpeedSlider/showProgressBar overrides. Readers can now
scrub the progress bar and adjust playback speed. Reduced-motion users
see neither control but keep manual Prev/Next.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Update CLAUDE.md and blog-writer skill docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.claude/skills/blog-writer/references/visualization-rules.md`

- [ ] **Step 1: Update CLAUDE.md §6.2 (공통 컴포넌트 아키텍처)**

Replace the `// components/visualizations/common/VisualContainer.tsx` interface block and subsequent TypeScript interface blocks in §6.2 with a reference to the actual implementations. Find the block starting with `**공통 컴포넌트:**` and ending just before `### 6.3 시각화 유형별 구현 패턴`. Replace it with:

```markdown
**공통 컴포넌트** (Phase 4.1에서 구현, `components/visualizations/common/`):

- **`useStepController(totalSteps, options?)`** — 상태 관리 훅. `step / isPlaying / speed / canPrev / canNext / progress / reducedMotion` 상태와 `prev / next / play / pause / toggle / reset / setSpeed / goTo` 액션을 반환. `prefers-reduced-motion: reduce` 자동 감지.
- **`<VisualContainer title description onReset?>`** — 시각화 외곽 래퍼(`figure` + `figcaption`). 선택적 리셋 버튼.
- **`<StepController {...controller} stepDescription? showSpeedSlider? showProgressBar?>`** — 컨트롤 UI(리셋/이전/재생/다음 + 진행 바 + 속도 슬라이더). 훅 반환값을 spread로 전달.
- **`<SpeedSlider speed onChange>`** — 5 세그먼트 배터리 게이지 스타일 속도 조절.

**표준 패턴** (새 Step-by-step 시각화 작성 시):

```tsx
'use client'

import { useMemo } from 'react'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

function computeSnapshots(input: Input): Snapshot[] { /* 알고리즘 */ }

export function MyViz({ input }: { input: Input }) {
  const snapshots = useMemo(() => computeSnapshots(input), [input])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="..." description="...">
      {/* 현재 스냅샷 렌더 — 상태에 따라 vizStateClasses(state) 적용 */}
      <StepController {...controller} stepDescription={current.note} />
    </VisualContainer>
  )
}
```
```

- [ ] **Step 2: Update CLAUDE.md §6.4 색상 토큰 섹션**

Find the `// components/visualizations/common/colors.ts` block and the `vizColors` object in §6.4. Replace that entire code block with:

```markdown
**색상 — CSS 변수 + Tailwind 유틸리티:**

시각화 전용 색상은 `app/globals.css`의 `:root` / `[data-theme="dark"]` 에 정의된 `--viz-<state>-{border,bg,fg}` 18개 변수가 단일 진실 소스입니다. `@theme inline` 블록에서 `--color-viz-*` 매핑으로 Tailwind 유틸리티를 자동 생성:

| State | Tailwind 유틸리티 | 용도 |
|---|---|---|
| pivot | `border-viz-pivot` / `bg-viz-pivot-bg` / `text-viz-pivot-fg` | 피벗/기준 요소 (amber) |
| comparing | `border-viz-comparing` / … | 비교 중 요소 (blue) |
| confirmed | `border-viz-confirmed` / … | 확정/완료 요소 (emerald) |
| blocked | `border-viz-blocked` / … | 차단/충돌 요소 (red) |
| waiting | `border-viz-waiting` / … | 대기 중 요소 (gray) |
| highlight | `border-viz-highlight` / … | 특별 강조 요소 (purple) |

`components/visualizations/common/colors.ts`의 `vizStateClasses(state)` 헬퍼는 세 유틸리티를 한 번에 반환합니다:

```tsx
import { vizStateClasses } from './common/colors'

<div className={vizStateClasses('pivot')}>pivot element</div>
// → "border-viz-pivot bg-viz-pivot-bg text-viz-pivot-fg"
```

새 상태 추가 절차는 Phase 4.1 스펙 §6.6 참고 (4곳 동시 편집: `:root` / dark / `@theme inline` / `VIZ_STATES`).
```

- [ ] **Step 3: Update CLAUDE.md §12 (작업 우선순위)**

Find the line starting with `4. **Phase 4 — 시각화 프레임워크**:` and replace it with:

```markdown
4. **Phase 4.1 — 시각화 프레임워크 (Step-by-step)** ✅ **완료** (`phase-4-1-complete` 태그): `VisualContainer`, `StepController`, `SpeedSlider`, `useStepController` 훅, `--viz-*` 색상 토큰 18개, QuickSort 리팩토링. 세부 내역은 §16 참고.
   - Phase 4.2 (Interactive Playground), Phase 4.3 (Timeline/Concurrent)은 해당 유형의 첫 시각화가 등장할 때 서브 페이즈로 도입.
```

- [ ] **Step 4: Add CLAUDE.md §16 (Phase 4.1 구현 현황)**

Append to the end of CLAUDE.md:

```markdown

---

## 16. Phase 4.1 구현 현황

> Phase 4.1 완료 시점(2026-04-15)의 구현 상태. §13–15와 동일 포맷.

### 16.1 존재하는 파일 (Phase 4.1에서 추가·변경)

\`\`\`
components/visualizations/
├── common/                          [신규 디렉토리]
│   ├── colors.ts                    VIZ_STATES + vizStateClasses()
│   ├── useStepController.ts         상태 관리 훅 (4 useState + 3 useEffect)
│   ├── VisualContainer.tsx          figure 래퍼 (server component)
│   ├── SpeedSlider.tsx              5 세그먼트 배터리 게이지
│   └── StepController.tsx           컨트롤 행 + 진행 바 + 스텝 설명
└── QuickSort.tsx                    [수정] 새 프레임워크 사용

app/globals.css                      [수정] --viz-* 18 + @theme inline 매핑 18

tests/
└── use-step-controller.test.ts      [신규] jsdom 파일 pragma, 14 케이스

package.json                         [수정] @testing-library/react, @testing-library/dom, jsdom
\`\`\`

### 16.2 핵심 의사결정 (변경 금지)

| 결정 | 이유 | 영향 |
|---|---|---|
| Step-by-step only | 실제 사례 1개(QuickSort)만 존재 → API 추출 근거 유일 | Playground/Timeline은 Phase 4.2/4.3로 이월 |
| 훅 + dumb 컴포넌트 | 보일러플레이트 제거 + `renderHook` 단위 테스트 가능 | `<StepController {...controller} />` spread 패턴 강제 |
| `@vitest-environment jsdom` 파일 pragma | 전역 `vitest.config.ts`는 `environment: 'node'` 유지 | 새 훅/DOM 테스트 파일마다 상단 pragma 필수 |
| 6 상태 × 3 슬롯 일괄 정의 | 확장성 우선 (사용자 명시적 요구) | 현재 blocked/waiting/highlight는 미사용이지만 CSS 변수만 추가되므로 비용 적음 |
| `vizStateClasses()` switch literal | Tailwind content scanner는 리터럴 클래스만 감지 | `` `border-viz-${state}` `` 같은 동적 문자열 사용 금지 |
| `goTo()` 호출 시 자동 중지 | 수동 점프 = 사용자 의도적 개입 | auto-play 중 스크러빙 시 명시적 재생 요구 |
| QuickSort 2-커밋 refactor | Pure refactor 검증 가능 | 커밋 1은 visual-identical, 커밋 2에서 SpeedSlider/progress 노출 |

### 16.3 명령어 치트시트

\`\`\`bash
pnpm dev                                       # 개발 서버
pnpm build                                     # 프로덕션 빌드
pnpm test                                      # velite build + vitest run (~101 테스트)
pnpm test:unit tests/use-step-controller.test.ts  # 훅 테스트만
pnpm type-check                                # tsc --noEmit
\`\`\`

### 16.4 알려진 미결 사항 (후속 서브 페이즈)

- **Phase 4.2 (Interactive Playground)**: `ControlPanel`, `SegmentedControl` 등. Isolation Level/GC 임계값/Cache TTL 시각화 첫 등장 시 도입.
- **Phase 4.3 (Timeline/Concurrent)**: `TimelineTrack`, `ActorSwimlane` + `--viz-actor-1~4` 토큰. Lock 경합/MVCC/Cache Stampede 시각화 첫 등장 시 도입.
- **시각화 간 state 공유**: 현재 각 시각화는 독립. 한 글에 여러 시각화 연동 필요 시 Context API 도입 검토.

### 16.5 리포지토리

- **Phase 4.1 태그**: `phase-4-1-complete`
- **브랜치 전략**: Phase 2/3과 동일, `main` 직접 또는 feature 브랜치 squash merge.
```

- [ ] **Step 5: Update blog-writer skill's visualization-rules.md**

Open `.claude/skills/blog-writer/references/visualization-rules.md` and find the section that describes how to create Step-by-step visualizations (look for "QuickSort" references or "Step-by-step" headings). Add or replace the template section with:

```markdown

## Step-by-step 시각화 작성 템플릿 (Phase 4.1 프레임워크)

Phase 4.1부터 모든 Step-by-step 시각화는 `components/visualizations/common/` 프레임워크를 사용합니다. 새 시각화 작성 시 아래 템플릿을 복사해 시작합니다.

### 1. 알고리즘 로직 — 스냅샷 배열 사전 계산

```tsx
interface Snapshot {
  // 현재 시점의 시각적 상태 (배열, 인덱스, 포인터, 메모 등)
  note: string  // 이 단계의 한 줄 설명
}

function computeSnapshots(input: MyInput): Snapshot[] {
  const snapshots: Snapshot[] = []
  // 알고리즘 실행, 중요 시점마다 snapshots.push(...)
  return snapshots
}
```

### 2. 컴포넌트 — 프레임워크 조립

```tsx
'use client'

import { useMemo } from 'react'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'
import { cn } from '@/lib/utils'

interface MyVizProps {
  input: MyInput
  description?: string
}

export function MyViz({ input, description }: MyVizProps) {
  const snapshots = useMemo(() => computeSnapshots(input), [input])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="..." description={description}>
      {/* 현재 스냅샷 렌더.
         상태에 따라 vizStateClasses('pivot' | 'comparing' | 'confirmed' |
         'blocked' | 'waiting' | 'highlight')로 시맨틱 색상 적용 */}
      <div className={cn('...', vizStateClasses('confirmed'))}>
        ...
      </div>

      <StepController {...controller} stepDescription={current.note} />
    </VisualContainer>
  )
}
```

### 3. 색상 선택 가이드

- **pivot** (amber): 피벗/기준이 되는 요소
- **comparing** (blue): 현재 비교 중인 요소
- **confirmed** (emerald): 확정/완료된 요소
- **blocked** (red): 차단/충돌이 발생한 요소
- **waiting** (gray): 대기 중인 요소
- **highlight** (purple): 특별 강조가 필요한 요소

기존 6 상태로 표현 안 되는 의미는 **함부로 새 상태 만들지 말고**, 먼저 기존 상태 재사용을 시도합니다. 정말 의미가 다를 때만 CLAUDE.md §16 및 스펙 §6.6의 절차(4곳 동시 편집)를 따라 추가합니다.

### 4. 반드시 동작해야 하는 것

- Prev/Next 버튼으로 단계 이동
- Play 버튼 클릭 시 자동 재생, 마지막 단계에서 정지
- 속도 슬라이더 (기본 속도 3 = 800ms/step)
- 진행 바 클릭 시 해당 단계로 점프
- `prefers-reduced-motion: reduce` 환경에서 auto-play 및 속도 슬라이더 자동 비활성화
- 라이트/다크 모드 모두에서 상태 색상 구분 가능
```

- [ ] **Step 6: Verify no build regression**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md .claude/skills/blog-writer/references/visualization-rules.md
git commit -m "$(cat <<'EOF'
docs: update CLAUDE.md and blog-writer skill for Phase 4.1

- CLAUDE.md §6.2: common components are now actual implementations
- CLAUDE.md §6.4: vizColors object → --viz-* CSS tokens + helper
- CLAUDE.md §12: Phase 4.1 marked complete, 4.2/4.3 deferred
- CLAUDE.md §16: new section documenting Phase 4.1 state
- blog-writer visualization-rules: Step-by-step framework template

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Final verification

**Files:** none modified

- [ ] **Step 1: Full build + type check + lint + test**

Run each and verify all pass:

```bash
pnpm type-check
```
Expected: No errors.

```bash
pnpm lint
```
Expected: No errors or warnings (or the same set as before Phase 4.1).

```bash
pnpm build
```
Expected: Build succeeds.

```bash
pnpm test
```
Expected: All tests pass. Total should be approximately 87 (pre-Phase-4.1) + 14 (new hook tests) = 101.

- [ ] **Step 2: Manual dev server check**

Run: `pnpm dev`

Visit: http://localhost:3000/posts/quick-sort

Checklist:
- [ ] Light mode: pivot bar is amber, comparing bar is blue, confirmed bars are emerald
- [ ] Dark mode (theme toggle in header): same bars use darkened `--viz-*` backgrounds, text remains legible
- [ ] Progress bar is visible and filled in `primary` color
- [ ] Speed slider (5 segments) is visible; clicking changes segment fill
- [ ] Play → auto-advance at ~800ms/step (speed 3)
- [ ] Setting speed to 5 → ~400ms/step
- [ ] Reaches last step → auto-play stops, Play button shows (and is disabled)
- [ ] Click progress bar middle → jumps to ~½, auto-play stops if was running
- [ ] Reset button → returns to step 0
- [ ] DevTools → Rendering → `prefers-reduced-motion: reduce`: speed slider disappears, Play button disables, Prev/Next still work

- [ ] **Step 3: Tag the phase completion**

```bash
git tag phase-4-1-complete
```

- [ ] **Step 4: (Optional) Push to origin**

Only after user approval — do NOT push without confirmation:

```bash
# git push origin main
# git push origin phase-4-1-complete
```

---

## Definition of Done

- [ ] `app/globals.css` has 18 `--viz-*` variables in both `:root` and `[data-theme="dark"]`
- [ ] `app/globals.css` has 18 `--color-viz-*` mappings in `@theme inline`
- [ ] `components/visualizations/common/` contains 5 files: `colors.ts`, `useStepController.ts`, `VisualContainer.tsx`, `SpeedSlider.tsx`, `StepController.tsx`
- [ ] `tests/use-step-controller.test.ts` exists with 14 passing cases
- [ ] `components/visualizations/QuickSort.tsx` uses the new framework
- [ ] Commit 1 (pure refactor) is visually identical to pre-Phase-4.1 QuickSort (manual check)
- [ ] Commit 2 (feature add) exposes SpeedSlider and progress bar
- [ ] `pnpm build` / `pnpm type-check` / `pnpm lint` / `pnpm test` all green
- [ ] Total test count ≈ 101 (87 + 14)
- [ ] CLAUDE.md §6.2, §6.4, §12 updated + new §16 section
- [ ] `.claude/skills/blog-writer/references/visualization-rules.md` has the Step-by-step template
- [ ] Manual `prefers-reduced-motion: reduce` check passes
- [ ] Manual light/dark mode check passes
- [ ] `phase-4-1-complete` git tag created
