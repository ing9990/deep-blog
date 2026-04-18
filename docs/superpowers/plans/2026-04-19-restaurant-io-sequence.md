# RestaurantIOSequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `RestaurantIOModel` (actor state grid) with `RestaurantIOSequence`, a sequence-diagram-style interactive visualization for the 4 I/O combinations in the post `content/posts/sync-async-blocking-nonblocking.mdx`.

**Architecture:** Single React client component using the existing `common/` framework (`VisualContainer`, `useStepController`, `StepController`, `vizStateClasses`). Rendering core is one inline SVG per scenario tab — 5 lifelines (3 customers + staff + kitchen), state-colored activity rectangles overlaid on lifelines, message arrows between lifelines, all driven by the current step. Scenario data lives in a separate sibling file (`RestaurantIOSequence.scenarios.ts`) so pure data and pure helpers can be unit-tested without React.

**Tech Stack:** React 19 + Next.js 15 App Router (client component), TypeScript strict, Lucide React icons (`User`, `ClipboardList`, `ChefHat`, `Bell`), Vitest for pure-function tests, Tailwind v4 with project token system (no hardcoded sizes/colors per CLAUDE.md §9).

**Reference spec:** `docs/superpowers/specs/2026-04-19-restaurant-io-sequence-design.md`

---

## File Structure

| File | Purpose | Action |
|---|---|---|
| `components/visualizations/RestaurantIOSequence.tsx` | React client component (rendering + state wiring) | Create |
| `components/visualizations/RestaurantIOSequence.scenarios.ts` | 4 scenario data + types + pure filter helpers | Create |
| `tests/restaurant-io-sequence-scenarios.test.ts` | Unit tests for scenario data shape + filter helpers | Create |
| `components/visualizations/RestaurantIOModel.tsx` | Old actor-grid component | Delete |
| `components/mdx/components.tsx` | mdxComponents registry | Modify (add new, remove old) |
| `content/posts/sync-async-blocking-nonblocking.mdx` | Post that uses the viz | Modify (one-line tag swap) |

**Why split scenarios into a separate file:** Each scenario contains 5–8 steps × multiple activities × multiple arrows. Inlining all 4 scenarios in one component file would push it past 600 lines and mix data concerns with rendering. Splitting also lets the data + filter helpers be unit-tested with plain `vitest` (node environment, no jsdom needed).

**No new files in `common/`.** The existing framework covers everything.

---

## Test Conventions (from existing codebase)

- Tests live in `/tests/` directory (not co-located with components).
- Default env is `node`. Use `// @vitest-environment jsdom` pragma only if jsdom is needed (we will not need it — only pure data and filter functions are tested).
- React component visual behavior is **not** unit-tested in this codebase. Verification is `pnpm type-check` + `pnpm lint` + `pnpm build` + manual dev preview at `http://blog.localhost:3010/posts/sync-async-blocking-nonblocking`. The plan therefore mixes TDD (for pure logic) with build-then-visual-verify (for SVG rendering).

---

## Task 1: Create scenarios file with types and sync-blocking data

**Files:**
- Create: `components/visualizations/RestaurantIOSequence.scenarios.ts`
- Create: `tests/restaurant-io-sequence-scenarios.test.ts`

- [ ] **Step 1: Write the failing test for the sync-blocking scenario shape**

Create `tests/restaurant-io-sequence-scenarios.test.ts`:

```ts
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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/restaurant-io-sequence-scenarios.test.ts`
Expected: FAIL with module-not-found error for `RestaurantIOSequence.scenarios`.

- [ ] **Step 3: Write the minimal scenarios file with sync-blocking data only**

Create `components/visualizations/RestaurantIOSequence.scenarios.ts`:

```ts
import type { VizState } from './common/colors'

export type ScenarioKey =
  | 'sync-blocking'
  | 'sync-nonblocking'
  | 'async-blocking'
  | 'async-nonblocking'

export type ActorRole = 'customer-a' | 'customer-b' | 'customer-c' | 'staff' | 'kitchen'

export type ArrowKind = 'request' | 'response' | 'eagain' | 'bell' | 'free'

export interface Activity {
  fromStep: number
  toStep: number
  state: VizState
}

export interface Arrow {
  atStep: number
  from: ActorRole
  to: ActorRole
  kind: ArrowKind
  label: string
}

export interface Step {
  note: string
  activeCustomer: 'customer-a' | 'customer-b' | 'customer-c'
}

export interface Scenario {
  key: ScenarioKey
  axis: string
  title: string
  subtitle: string
  realWorld: string
  steps: Step[]
  activities: Record<ActorRole, Activity[]>
  arrows: Arrow[]
}

const EMPTY_ACTIVITIES: Record<ActorRole, Activity[]> = {
  'customer-a': [],
  'customer-b': [],
  'customer-c': [],
  staff: [],
  kitchen: [],
}

const SYNC_BLOCKING: Scenario = {
  key: 'sync-blocking',
  axis: 'Sync · Blocking',
  title: '카운터 앞에서 직접 기다리기',
  subtitle: '손님이 카운터로 가서 주문하고 음식이 나올 때까지 그 자리에서 멈춰 기다린다.',
  realWorld: '전통 Tomcat read(), JDBC, 옛날 HTTP 클라이언트',
  steps: [
    { note: '손님이 카운터로 가서 주문하려는 순간.', activeCustomer: 'customer-a' },
    { note: '주문이 카운터 도착. 손님은 그 자리에 멈춘다.', activeCustomer: 'customer-a' },
    { note: '주방이 요리를 시작. 손님은 여전히 멈춰 있다.', activeCustomer: 'customer-a' },
    { note: '음식 완성. 직원이 카운터에서 받는다.', activeCustomer: 'customer-a' },
    { note: '손님이 음식을 받고 자리로 돌아간다.', activeCustomer: 'customer-a' },
  ],
  activities: {
    ...EMPTY_ACTIVITIES,
    'customer-a': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 3, state: 'blocked' },
      { fromStep: 4, toStep: 4, state: 'confirmed' },
    ],
    staff: [
      { fromStep: 1, toStep: 2, state: 'comparing' },
      { fromStep: 3, toStep: 3, state: 'highlight' },
    ],
    kitchen: [
      { fromStep: 2, toStep: 2, state: 'pivot' },
      { fromStep: 3, toStep: 3, state: 'confirmed' },
    ],
  },
  arrows: [
    { atStep: 1, from: 'customer-a', to: 'staff', kind: 'request', label: '주문' },
    { atStep: 2, from: 'staff', to: 'kitchen', kind: 'request', label: '주문 전달' },
    { atStep: 3, from: 'kitchen', to: 'staff', kind: 'response', label: '음식' },
    { atStep: 4, from: 'staff', to: 'customer-a', kind: 'response', label: '음식' },
  ],
}

export const SCENARIOS: Scenario[] = [
  SYNC_BLOCKING,
  // Other scenarios filled in later tasks
]

export function getActivitiesActiveAt(
  activities: Activity[],
  step: number,
): Activity[] {
  return activities.filter((a) => step >= a.fromStep && step <= a.toStep)
}

export function getArrowsAt(arrows: Arrow[], step: number): Arrow[] {
  return arrows.filter((a) => a.atStep === step)
}
```

- [ ] **Step 4: Run test to verify the 4-scenario shape test fails (only 1 scenario defined)**

Run: `pnpm test tests/restaurant-io-sequence-scenarios.test.ts`
Expected: First test FAILS (`SCENARIOS.map((s) => s.key)` returns 1 element, not 4). Other 3 PASS (sync-blocking-specific assertions).

This is intentional — we add the rest of the scenarios in later tasks. The "exactly 4 scenarios" test acts as a tracker.

- [ ] **Step 5: Add filter helper tests and re-run**

Append to `tests/restaurant-io-sequence-scenarios.test.ts`:

```ts
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
```

Run: `pnpm test tests/restaurant-io-sequence-scenarios.test.ts`
Expected: All filter helper tests PASS. The "exactly 4 scenarios" test still FAILS (tracker).

- [ ] **Step 6: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.scenarios.ts tests/restaurant-io-sequence-scenarios.test.ts
git commit -m "feat(viz): add RestaurantIOSequence scenario types + sync-blocking data"
```

---

## Task 2: Create the component skeleton with VisualContainer

**Files:**
- Create: `components/visualizations/RestaurantIOSequence.tsx`
- Modify: `components/mdx/components.tsx` (register new component)

- [ ] **Step 1: Create the skeleton component**

Create `components/visualizations/RestaurantIOSequence.tsx`:

```tsx
'use client'

import { useMemo, useState } from 'react'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { SCENARIOS, type ScenarioKey } from './RestaurantIOSequence.scenarios'

export interface RestaurantIOSequenceProps {
  initial?: ScenarioKey
}

export function RestaurantIOSequence({
  initial = 'sync-blocking',
}: RestaurantIOSequenceProps) {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>(initial)
  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.key === scenarioKey) ?? SCENARIOS[0],
    [scenarioKey],
  )
  const controller = useStepController(scenario.steps.length)
  const current = scenario.steps[controller.step]

  return (
    <VisualContainer
      title="요청 → 응답 시퀀스 (음식점 비유)"
      description="손님이 주문을 보내고 음식을 받기까지의 메시지 흐름. 라이프라인 음영 = 멈춘 시간."
    >
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
        <p className="text-[length:var(--text-meta)] text-muted-foreground">
          (skeleton) Active scenario: {scenario.key}, step {controller.step + 1} / {scenario.steps.length}
        </p>
      </div>
      <StepController {...controller} stepDescription={current.note} />
    </VisualContainer>
  )
}
```

- [ ] **Step 2: Register in mdxComponents**

Modify `components/mdx/components.tsx`. Add the import alphabetically grouped with other visualizations:

```tsx
import { RestaurantIOSequence } from '@/components/visualizations/RestaurantIOSequence'
```

Add to the `mdxComponents` object (next to `RestaurantIOModel`, alphabetic):

```tsx
  RestaurantIOSequence,
```

(Leave `RestaurantIOModel` registered for now — Task 12 deletes it after the post is migrated.)

- [ ] **Step 3: Verify type-check passes**

Run: `pnpm type-check`
Expected: PASS, no errors.

- [ ] **Step 4: Verify lint passes**

Run: `pnpm lint`
Expected: `No ESLint warnings or errors`.

- [ ] **Step 5: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.tsx components/mdx/components.tsx
git commit -m "feat(viz): scaffold RestaurantIOSequence component + register in mdx"
```

---

## Task 3: Render 5 lifelines with avatars

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.tsx`

This task replaces the placeholder skeleton body with the static layout: 5 columns (customer A/B/C, staff, kitchen), each with a Lucide avatar circle on top and a vertical dashed lifeline below. SVG-based for pixel control.

- [ ] **Step 1: Replace the placeholder body with the lifelines layout**

In `components/visualizations/RestaurantIOSequence.tsx`, replace the `<div className="rounded-[var(--radius-card)] ...">` block with the following layout:

```tsx
import { Bell, ChefHat, ClipboardList, User } from 'lucide-react'
// ...add to existing imports

const ACTORS: Array<{ role: ActorRole; label: string; subtitle: string; Icon: typeof User; tone: VizState }> = [
  { role: 'customer-a', label: '손님 A', subtitle: '호출자', Icon: User, tone: 'comparing' },
  { role: 'customer-b', label: '손님 B', subtitle: '호출자', Icon: User, tone: 'comparing' },
  { role: 'customer-c', label: '손님 C', subtitle: '호출자', Icon: User, tone: 'comparing' },
  { role: 'staff', label: '직원', subtitle: '서버 스레드', Icon: ClipboardList, tone: 'waiting' },
  { role: 'kitchen', label: '주방', subtitle: '커널', Icon: ChefHat, tone: 'pivot' },
]

// ...replace placeholder block with:

      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
        <div className="grid grid-cols-5 gap-3 mb-3">
          {ACTORS.map((a) => (
            <div key={a.role} className="flex flex-col items-center text-center">
              <div className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border-2',
                vizStateClasses(a.tone),
              )}>
                <a.Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="mt-1.5 text-[length:var(--text-meta)] font-semibold text-foreground">
                {a.label}
              </div>
              <div className="text-[length:var(--text-caption)] text-muted-foreground">
                {a.subtitle}
              </div>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 500 280" className="w-full" role="img" aria-label="시퀀스 다이어그램">
          {/* time axis on the left */}
          <line x1={20} y1={10} x2={20} y2={270} stroke="var(--muted-foreground)" strokeWidth="1" />
          <polygon points="17,265 23,265 20,272" fill="var(--muted-foreground)" />
          <text x={20} y={6} fontSize="9" fill="var(--muted-foreground)" textAnchor="middle">시간</text>
          {/* lifelines */}
          {ACTORS.map((_, i) => {
            const x = 50 + i * 100
            return (
              <line
                key={i}
                x1={x} y1={0} x2={x} y2={280}
                stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3"
              />
            )
          })}
        </svg>
      </div>
```

Add the missing imports to the top of the file:

```tsx
import { cn } from '@/lib/utils'
import { vizStateClasses, type VizState } from './common/colors'
import type { ActorRole } from './RestaurantIOSequence.scenarios'
```

- [ ] **Step 2: Verify type-check + lint pass**

Run: `pnpm type-check && pnpm lint`
Expected: both PASS.

- [ ] **Step 3: Manual visual verify in dev**

Ensure dev server is running at `:3010` (`PORT=3010 pnpm dev` in background per CLAUDE.md §0). Open `http://blog.localhost:3010/posts/sync-async-blocking-nonblocking` in browser. The new component is not yet placed in the post, so add a temporary `<RestaurantIOSequence />` block right above the existing `<RestaurantIOModel />` in `content/posts/sync-async-blocking-nonblocking.mdx` for visual comparison. Confirm: 5 avatars render in a row with labels, dashed lifelines extend below, no console errors.

After verifying, **revert the temporary MDX add** (this is just for development verification; Task 12 does the real swap).

- [ ] **Step 4: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.tsx
git commit -m "feat(viz): render 5 lifelines + avatars in RestaurantIOSequence"
```

---

## Task 4: Render activity bars on lifelines (state-colored rectangles)

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.tsx`

Activity bars are filled rectangles overlaid on lifelines, indicating state during a step range. Use `vizStateClasses` for color via inline `fill` mapped from CSS vars, or simpler: render `<rect>` with `class` from `vizStateClasses` (Tailwind translates to fill-* / stroke-* utilities won't apply directly to SVG fill — instead use CSS variables directly).

- [ ] **Step 1: Add a CSS-variable-driven color helper for SVG**

Most viz components use `vizStateClasses` for HTML elements. SVG `<rect>` `fill`/`stroke` need actual color values. Use the same CSS variables directly via inline style. Add this helper in `RestaurantIOSequence.tsx`:

```tsx
function vizFillStrokeStyle(state: VizState): React.CSSProperties {
  return {
    fill: `var(--viz-${state}-bg)`,
    stroke: `var(--viz-${state})`,
    strokeWidth: 1.5,
  }
}
```

- [ ] **Step 2: Compute lifeline x-coords once + render activity rects**

Define column positions and step y-mapping near the top of the component body (above the return):

```tsx
const COL_X: Record<ActorRole, number> = {
  'customer-a': 50,
  'customer-b': 150,
  'customer-c': 250,
  staff: 350,
  kitchen: 450,
}
const STEP_HEIGHT = 40 // px per step in the SVG viewBox
const SVG_TOP = 20

function stepY(step: number): number {
  return SVG_TOP + step * STEP_HEIGHT
}
```

Then update the SVG body to render activity rects from the current scenario. Add this inside the `<svg>` after the lifelines loop:

```tsx
{(Object.keys(scenario.activities) as ActorRole[]).flatMap((role) => {
  return getActivitiesActiveAt(scenario.activities[role], controller.step).map((act, i) => {
    const x = COL_X[role]
    const y = stepY(act.fromStep)
    const height = (act.toStep - act.fromStep + 1) * STEP_HEIGHT - 6
    return (
      <rect
        key={`${role}-${act.fromStep}-${i}`}
        x={x - 6}
        y={y - 18}
        width={12}
        height={height}
        rx={2}
        style={vizFillStrokeStyle(act.state)}
      />
    )
  })
})}
```

Update the SVG `viewBox` to `0 0 500 ${SVG_TOP + scenario.steps.length * STEP_HEIGHT}` so it always fits:

```tsx
const svgHeight = SVG_TOP + scenario.steps.length * STEP_HEIGHT + 20
// ...
<svg viewBox={`0 0 500 ${svgHeight}`} className="w-full" role="img" aria-label="시퀀스 다이어그램">
```

Also import the helper:

```tsx
import {
  SCENARIOS,
  getActivitiesActiveAt,
  type ActorRole,
  type ScenarioKey,
} from './RestaurantIOSequence.scenarios'
```

- [ ] **Step 3: Verify type-check + lint pass**

Run: `pnpm type-check && pnpm lint`
Expected: both PASS.

- [ ] **Step 4: Manual visual verify**

In dev, temporarily place `<RestaurantIOSequence />` in the post (as in Task 3). Click the next-step button (when wired) or temporarily set `controller.step` to 2 in code to confirm: at step 2, customer-a shows a red blocked bar from step 1 onward, kitchen shows an orange pivot bar at step 2. After verify, revert any temporary changes.

- [ ] **Step 5: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.tsx
git commit -m "feat(viz): render state-colored activity bars on lifelines"
```

---

## Task 5: Render message arrows between lifelines

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.tsx`

Arrows are horizontal `<line>` elements with arrowhead `<marker>`. One arrow per `Arrow` whose `atStep <= currentStep`. Past arrows render dimmer (opacity 0.5), current arrow at full opacity.

- [ ] **Step 1: Define arrow color map and arrowhead markers**

Add at the top of the component body:

```tsx
const ARROW_COLOR: Record<ArrowKind, string> = {
  request: 'var(--primary)',
  response: 'var(--viz-confirmed)',
  eagain: 'var(--viz-waiting)',
  bell: 'var(--viz-highlight)',
  free: 'var(--muted-foreground)',
}
```

Inside the `<svg>` right after the lifelines loop (before activity rects so arrows render under rects), add `<defs>` for markers (one per kind):

```tsx
<defs>
  {(Object.keys(ARROW_COLOR) as ArrowKind[]).map((kind) => (
    <marker
      key={kind}
      id={`arrow-${kind}`}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={ARROW_COLOR[kind]} />
    </marker>
  ))}
</defs>
```

- [ ] **Step 2: Render arrows up to currentStep with dimming**

Below the activity rects, render arrows:

```tsx
{scenario.arrows
  .filter((arrow) => arrow.atStep <= controller.step)
  .map((arrow, i) => {
    const x1 = COL_X[arrow.from]
    const x2 = COL_X[arrow.to]
    const y = stepY(arrow.atStep)
    const isCurrent = arrow.atStep === controller.step
    const opacity = isCurrent ? 1 : 0.45
    const dashArray = arrow.kind === 'eagain' ? '4,3' : undefined
    return (
      <g key={`arrow-${arrow.atStep}-${i}`} opacity={opacity}>
        <line
          x1={x1 + (x2 > x1 ? 6 : -6)}
          y1={y}
          x2={x2 - (x2 > x1 ? 6 : -6)}
          y2={y}
          stroke={ARROW_COLOR[arrow.kind]}
          strokeWidth={isCurrent ? 2 : 1.25}
          strokeDasharray={dashArray}
          markerEnd={`url(#arrow-${arrow.kind})`}
        />
        <text
          x={(x1 + x2) / 2}
          y={y - 5}
          fontSize="10"
          fill={ARROW_COLOR[arrow.kind]}
          textAnchor="middle"
          fontWeight={isCurrent ? 600 : 400}
        >
          {arrow.label}
        </text>
      </g>
    )
  })}
```

Import the type:

```tsx
import {
  SCENARIOS,
  getActivitiesActiveAt,
  type ActorRole,
  type ArrowKind,
  type ScenarioKey,
} from './RestaurantIOSequence.scenarios'
```

- [ ] **Step 3: Verify type-check + lint pass**

Run: `pnpm type-check && pnpm lint`
Expected: both PASS.

- [ ] **Step 4: Manual visual verify**

In dev, step through 0 → 4 in sync-blocking. Confirm arrows appear progressively: step 1 shows "주문" arrow (customer→staff), step 2 adds "주문 전달" (staff→kitchen), step 3 adds "음식" (kitchen→staff), step 4 adds "음식" (staff→customer). Past arrows dim, current arrow bold.

- [ ] **Step 5: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.tsx
git commit -m "feat(viz): render message arrows with arrowheads + dimming for past steps"
```

---

## Task 6: Add scenario header (title + subtitle + realWorld)

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.tsx`

The mid-section between the figcaption and the SVG should show the active scenario's title (bold), subtitle (one line), and a footer "현실에서는 X" line below the SVG.

- [ ] **Step 1: Add the scenario header above the SVG container**

Insert this block after the `<VisualContainer>` opening, before the SVG container:

```tsx
<div className="mb-3 rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
  <p className="text-[length:var(--text-meta)] font-semibold text-foreground">
    {scenario.title}
  </p>
  <p className="mt-1 text-[length:var(--text-caption)] leading-relaxed text-muted-foreground">
    {scenario.subtitle}
  </p>
</div>
```

- [ ] **Step 2: Add the realWorld footer below StepController**

After the `<StepController {...controller} stepDescription={current.note} />`:

```tsx
<div className="mt-3 rounded-[var(--radius-card)] border border-border bg-background p-3">
  <p className="text-[length:var(--text-caption)] text-muted-foreground">
    <span className="font-semibold text-foreground">현실에서는</span>{' '}
    {scenario.realWorld}
  </p>
</div>
```

- [ ] **Step 3: Verify type-check + lint pass**

Run: `pnpm type-check && pnpm lint`
Expected: both PASS.

- [ ] **Step 4: Manual visual verify**

In dev, see the scenario title/subtitle above the SVG and the "현실에서는 전통 Tomcat read()..." footer below.

- [ ] **Step 5: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.tsx
git commit -m "feat(viz): add scenario header + realWorld footer"
```

---

## Task 7: Add scenario tabs

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.tsx`

4 tab buttons at the top let the user switch scenarios. Currently only sync-blocking has data; the other 3 will be defined in Tasks 8–9. Tab still renders all 4 buttons (other 3 will show empty state until their data is added — handled gracefully because `scenario.steps.length` will be 0 and StepController shows step 0/0).

To avoid the "0 steps" pitfall, this task only renders tabs and clicking other tabs is allowed but they fall back to sync-blocking. After Tasks 8–9, all 4 work fully.

- [ ] **Step 1: Add tab buttons**

Insert this block right after `<VisualContainer>` opening, before the scenario header:

```tsx
<div className="mb-3 flex flex-wrap gap-1">
  {SCENARIOS.map((s) => (
    <button
      key={s.key}
      type="button"
      onClick={() => {
        setScenarioKey(s.key)
        controller.reset()
      }}
      className={cn(
        'rounded-[var(--radius-chip)] border px-3 py-1.5 text-[length:var(--text-meta)] font-medium transition-colors',
        scenarioKey === s.key
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted',
      )}
      aria-pressed={scenarioKey === s.key}
    >
      {s.axis}
    </button>
  ))}
</div>
```

- [ ] **Step 2: Verify type-check + lint pass**

Run: `pnpm type-check && pnpm lint`
Expected: both PASS.

- [ ] **Step 3: Manual visual verify**

In dev, see 1 tab (axis label "Sync · Blocking") active. (Other 3 tab labels appear once Tasks 8–9 add scenarios — for now `SCENARIOS` only has 1 entry.)

- [ ] **Step 4: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.tsx
git commit -m "feat(viz): add scenario tab switcher"
```

---

## Task 8: Add Sync + Non-Blocking and Async + Non-Blocking scenarios

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.scenarios.ts`
- Modify: `tests/restaurant-io-sequence-scenarios.test.ts`

Both are single-customer (active customer always = 'customer-a'). Sync+NB shows polling pattern (multiple eagain arrows). Async+NB shows kitchen-direct-to-customer arrow.

- [ ] **Step 1: Update test to assert these scenarios exist**

Add to `tests/restaurant-io-sequence-scenarios.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify failures**

Run: `pnpm test tests/restaurant-io-sequence-scenarios.test.ts`
Expected: 2 new tests FAIL (scenarios not defined). Existing tests still PASS.

- [ ] **Step 3: Add the two scenarios to scenarios.ts**

In `components/visualizations/RestaurantIOSequence.scenarios.ts`, add these constants after `SYNC_BLOCKING`:

```ts
const SYNC_NONBLOCKING: Scenario = {
  key: 'sync-nonblocking',
  axis: 'Sync · Non-Blocking',
  title: '자꾸 와서 묻기',
  subtitle: '손님이 자리로 돌아가서 다른 일을 하지만, 결과는 자기가 가서 확인한다.',
  realWorld: 'O_NONBLOCK + 폴링 (단독으로는 거의 안 쓰이는 패턴)',
  steps: [
    { note: '손님 주문 직전.', activeCustomer: 'customer-a' },
    { note: '주문 후 손님은 자리로 (멈추지 않음).', activeCustomer: 'customer-a' },
    { note: '"다 됐어요?" "아직요." 즉시 답을 받고 자리로.', activeCustomer: 'customer-a' },
    { note: '다시 묻기, 여전히 아직.', activeCustomer: 'customer-a' },
    { note: '마침 음식이 완성, 받음.', activeCustomer: 'customer-a' },
    { note: '손님이 다른 일은 했지만 폴링에 시간을 계속 썼다.', activeCustomer: 'customer-a' },
  ],
  activities: {
    ...EMPTY_ACTIVITIES,
    'customer-a': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 4, state: 'highlight' },
      { fromStep: 5, toStep: 5, state: 'confirmed' },
    ],
    staff: [{ fromStep: 1, toStep: 4, state: 'comparing' }],
    kitchen: [
      { fromStep: 1, toStep: 3, state: 'pivot' },
      { fromStep: 4, toStep: 4, state: 'confirmed' },
    ],
  },
  arrows: [
    { atStep: 1, from: 'customer-a', to: 'staff', kind: 'request', label: '주문' },
    { atStep: 2, from: 'customer-a', to: 'staff', kind: 'request', label: '확인' },
    { atStep: 2, from: 'staff', to: 'customer-a', kind: 'eagain', label: '아직' },
    { atStep: 3, from: 'customer-a', to: 'staff', kind: 'request', label: '확인' },
    { atStep: 3, from: 'staff', to: 'customer-a', kind: 'eagain', label: '아직' },
    { atStep: 4, from: 'customer-a', to: 'staff', kind: 'request', label: '확인' },
    { atStep: 4, from: 'staff', to: 'customer-a', kind: 'response', label: '음식' },
  ],
}

const ASYNC_NONBLOCKING: Scenario = {
  key: 'async-nonblocking',
  axis: 'Async · Non-Blocking',
  title: '직원이 자리까지 자동 배달',
  subtitle: '손님은 주문만 하고, 음식이 나오면 주방이 알아서 자리로 가져다준다.',
  realWorld: '진짜 비동기 (Linux io_uring, Windows IOCP)',
  steps: [
    { note: '주문 직전.', activeCustomer: 'customer-a' },
    { note: '주문은 주방 큐로 직접 등록. 직원도 다른 일.', activeCustomer: 'customer-a' },
    { note: '손님도 직원도 모두 자유. 주방만 일한다.', activeCustomer: 'customer-a' },
    { note: '음식 완성 → 주방이 직접 손님 자리로 (커널이 유저 버퍼로 직접 복사).', activeCustomer: 'customer-a' },
    { note: '손님 0초 멈춤. 직원 0초 대기.', activeCustomer: 'customer-a' },
  ],
  activities: {
    ...EMPTY_ACTIVITIES,
    'customer-a': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 2, state: 'confirmed' },
      { fromStep: 3, toStep: 3, state: 'highlight' },
      { fromStep: 4, toStep: 4, state: 'confirmed' },
    ],
    staff: [{ fromStep: 1, toStep: 3, state: 'confirmed' }],
    kitchen: [
      { fromStep: 1, toStep: 2, state: 'pivot' },
      { fromStep: 3, toStep: 3, state: 'highlight' },
    ],
  },
  arrows: [
    { atStep: 1, from: 'customer-a', to: 'kitchen', kind: 'request', label: '주문 → 큐' },
    { atStep: 3, from: 'kitchen', to: 'customer-a', kind: 'response', label: '음식 (직접 배달)' },
    { atStep: 3, from: 'kitchen', to: 'staff', kind: 'bell', label: '완료 알림' },
  ],
}

export const SCENARIOS: Scenario[] = [
  SYNC_BLOCKING,
  SYNC_NONBLOCKING,
  // Async + Blocking added in Task 9
  ASYNC_NONBLOCKING,
]
```

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/restaurant-io-sequence-scenarios.test.ts`
Expected: sync-nonblocking and async-nonblocking tests PASS. The "exactly 4 scenarios in fixed order" test still FAILS (expects 4, currently 3, and order is `[sync-blocking, sync-nonblocking, async-nonblocking]` instead of the spec order with `async-blocking` in position 3). This is intentional — Task 9 fixes both.

- [ ] **Step 5: Manual visual verify**

In dev, click the "Sync · Non-Blocking" tab and step through. Confirm 6 steps, eagain arrows render with dashed style and "아직" label. Click "Async · Non-Blocking" — see kitchen→customer arrow at step 3.

- [ ] **Step 6: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.scenarios.ts tests/restaurant-io-sequence-scenarios.test.ts
git commit -m "feat(viz): add Sync+Non-Blocking and Async+Non-Blocking scenarios"
```

---

## Task 9: Add Async + Blocking (multiplexing) scenario with multi-customer activities

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.scenarios.ts`
- Modify: `tests/restaurant-io-sequence-scenarios.test.ts`

This is the complex one — 8 steps, 3 customers all active, activeCustomer transitions A → B → C as bells ring out of order (B first, then A, then C in the spec).

- [ ] **Step 1: Add tests for multiplexing-specific behavior**

Append to `tests/restaurant-io-sequence-scenarios.test.ts`:

```ts
it('async-blocking has 8 steps and uses all 3 customers as activeCustomer', () => {
  const ab = SCENARIOS.find((s) => s.key === 'async-blocking')!
  expect(ab.steps).toHaveLength(8)
  const customers = new Set(ab.steps.map((s) => s.activeCustomer))
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
```

- [ ] **Step 2: Run tests, see them fail**

Run: `pnpm test tests/restaurant-io-sequence-scenarios.test.ts`
Expected: 3 new tests FAIL.

- [ ] **Step 3: Add ASYNC_BLOCKING scenario**

Insert before `ASYNC_NONBLOCKING`:

```ts
const ASYNC_BLOCKING: Scenario = {
  key: 'async-blocking',
  axis: 'Async · Blocking',
  title: '진동벨 한 명이 N명 챙기기',
  subtitle: '직원 한 명이 진동벨 N개를 들고 어느 게 울리는지만 본다.',
  realWorld: 'I/O Multiplexing 계열 (Nginx, Node.js, Redis가 쓰는 select / epoll)',
  steps: [
    { note: '손님 3명 모두 주문 직전. 모두 활성.', activeCustomer: 'customer-a' },
    { note: '3명 모두 진동벨 받고 자리로. 직원 한 명이 벨 N개 감시.', activeCustomer: 'customer-a' },
    { note: 'B의 벨 울림 → 시청자 시선이 B로. A·C 흐려짐.', activeCustomer: 'customer-b' },
    { note: '직원이 B에게 음식 전달 → 다시 벨 감시.', activeCustomer: 'customer-b' },
    { note: '다음으로 A의 벨이 울림. 시선이 A로.', activeCustomer: 'customer-a' },
    { note: 'A 음식 받음.', activeCustomer: 'customer-a' },
    { note: '마지막 C의 벨, 시선 C로.', activeCustomer: 'customer-c' },
    { note: '3명 모두 음식 받음. 직원 1명이 N=3 처리. C10K 해결 원리.', activeCustomer: 'customer-c' },
  ],
  activities: {
    'customer-a': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 4, state: 'confirmed' },
      { fromStep: 5, toStep: 7, state: 'confirmed' },
    ],
    'customer-b': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 2, state: 'confirmed' },
      { fromStep: 3, toStep: 7, state: 'confirmed' },
    ],
    'customer-c': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 6, state: 'confirmed' },
      { fromStep: 7, toStep: 7, state: 'confirmed' },
    ],
    staff: [
      { fromStep: 1, toStep: 1, state: 'blocked' },
      { fromStep: 2, toStep: 2, state: 'highlight' },
      { fromStep: 3, toStep: 3, state: 'waiting' },
      { fromStep: 4, toStep: 4, state: 'highlight' },
      { fromStep: 5, toStep: 5, state: 'waiting' },
      { fromStep: 6, toStep: 6, state: 'highlight' },
    ],
    kitchen: [
      { fromStep: 1, toStep: 1, state: 'pivot' },
      { fromStep: 2, toStep: 2, state: 'confirmed' },
      { fromStep: 3, toStep: 3, state: 'pivot' },
      { fromStep: 4, toStep: 4, state: 'confirmed' },
      { fromStep: 5, toStep: 5, state: 'pivot' },
      { fromStep: 6, toStep: 6, state: 'confirmed' },
    ],
  },
  arrows: [
    { atStep: 1, from: 'customer-a', to: 'staff', kind: 'request', label: 'A 주문' },
    { atStep: 1, from: 'customer-b', to: 'staff', kind: 'request', label: 'B 주문' },
    { atStep: 1, from: 'customer-c', to: 'staff', kind: 'request', label: 'C 주문' },
    { atStep: 2, from: 'kitchen', to: 'staff', kind: 'bell', label: '벨 B' },
    { atStep: 3, from: 'staff', to: 'customer-b', kind: 'response', label: '음식 → B' },
    { atStep: 4, from: 'kitchen', to: 'staff', kind: 'bell', label: '벨 A' },
    { atStep: 5, from: 'staff', to: 'customer-a', kind: 'response', label: '음식 → A' },
    { atStep: 6, from: 'kitchen', to: 'staff', kind: 'bell', label: '벨 C' },
    { atStep: 7, from: 'staff', to: 'customer-c', kind: 'response', label: '음식 → C' },
  ],
}
```

Reorder `SCENARIOS` to match the spec:

```ts
export const SCENARIOS: Scenario[] = [
  SYNC_BLOCKING,
  SYNC_NONBLOCKING,
  ASYNC_BLOCKING,
  ASYNC_NONBLOCKING,
]
```

- [ ] **Step 4: Run all scenario tests**

Run: `pnpm test tests/restaurant-io-sequence-scenarios.test.ts`
Expected: all tests PASS, including the "exactly 4 scenarios in fixed order" tracker.

- [ ] **Step 5: Manual visual verify**

In dev, click "Async · Blocking" tab. Step through 0–7. Confirm:
- All 3 customer lifelines have activity bars from step 1 onward (they're all "at the table")
- 3 request arrows fire at step 1
- Bell B → customer-b food → bell A → customer-a food → bell C → customer-c food sequence
- Step note matches what the SVG shows

(Focus shift dim/highlight comes in Task 10. For now, all 3 customers stay at full opacity.)

- [ ] **Step 6: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.scenarios.ts tests/restaurant-io-sequence-scenarios.test.ts
git commit -m "feat(viz): add Async+Blocking multiplexing scenario (8 steps, 3 customers)"
```

---

## Task 10: Implement focus shift (dim non-active customers)

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.tsx`

The activeCustomer in each step determines which customer lifeline is at full opacity; the others dim to 0.3. Single-customer scenarios always have customer-a active and B/C dimmed throughout. Multiplexing transitions A → B → C as steps advance.

- [ ] **Step 1: Compute opacity per actor**

Add a helper inside the component (above the return):

```tsx
function actorOpacity(role: ActorRole, activeCustomer: Step['activeCustomer']): number {
  if (role === 'staff' || role === 'kitchen') return 1
  return role === activeCustomer ? 1 : 0.3
}
```

Import the `Step` type:

```tsx
import {
  SCENARIOS,
  getActivitiesActiveAt,
  type ActorRole,
  type ArrowKind,
  type ScenarioKey,
  type Step,
} from './RestaurantIOSequence.scenarios'
```

- [ ] **Step 2: Wrap each actor's avatar header in an opacity transition**

Update the avatar grid to apply opacity:

```tsx
<div className="grid grid-cols-5 gap-3 mb-3">
  {ACTORS.map((a) => {
    const op = actorOpacity(a.role, current.activeCustomer)
    return (
      <div
        key={a.role}
        className="flex flex-col items-center text-center transition-opacity duration-300 motion-reduce:transition-none"
        style={{ opacity: op }}
      >
        ...
      </div>
    )
  })}
</div>
```

- [ ] **Step 3: Apply opacity to lifelines and activity rects per actor**

Wrap each lifeline `<line>` in a `<g>` with the per-actor opacity. Replace the lifelines map:

```tsx
{ACTORS.map((a, i) => {
  const x = COL_X[a.role]
  const op = actorOpacity(a.role, current.activeCustomer)
  return (
    <g key={a.role} opacity={op} className="transition-opacity duration-300 motion-reduce:transition-none">
      <line
        x1={x} y1={0} x2={x} y2={svgHeight}
        stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3"
      />
      {getActivitiesActiveAt(scenario.activities[a.role], controller.step).map((act, j) => {
        const y = stepY(act.fromStep)
        const height = (act.toStep - act.fromStep + 1) * STEP_HEIGHT - 6
        return (
          <rect
            key={`${a.role}-${j}`}
            x={x - 6}
            y={y - 18}
            width={12}
            height={height}
            rx={2}
            style={vizFillStrokeStyle(act.state)}
          />
        )
      })}
    </g>
  )
})}
```

(Removes the previous separate lifeline-loop and activity-flatMap blocks; consolidates per-actor.)

- [ ] **Step 4: Verify type-check + lint pass**

Run: `pnpm type-check && pnpm lint`
Expected: both PASS.

- [ ] **Step 5: Manual visual verify**

In dev:
1. Sync · Blocking: customers B and C are dim throughout all 5 steps.
2. Async · Blocking step 0: all 3 customers full opacity. Step 2: only B is full, A and C dim. Step 4: only A is full, B and C dim. Step 6: only C is full. Smooth opacity transition between steps.
3. Async · Non-Blocking: B and C dim throughout.

- [ ] **Step 6: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.tsx
git commit -m "feat(viz): focus shift — dim non-active customers, transition on step change"
```

---

## Task 11: Add legend at the bottom

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.tsx`

Legend explains state colors and arrow types so colorblind / new readers can decode the visualization without external context.

- [ ] **Step 1: Add the legend below the realWorld footer**

Replace the realWorld footer with this combined block:

```tsx
<div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[length:var(--text-caption)] text-muted-foreground">
  <LegendDot state="blocked" label="호출자 멈춤" />
  <LegendDot state="comparing" label="처리 중" />
  <LegendDot state="pivot" label="요리 중" />
  <LegendDot state="confirmed" label="완료" />
  <LegendDot state="highlight" label="강조" />
  <span className="inline-flex items-center gap-1.5">
    <span className="inline-block h-0.5 w-4" style={{ background: 'var(--primary)' }} aria-hidden="true" />
    요청
  </span>
  <span className="inline-flex items-center gap-1.5">
    <span className="inline-block h-0.5 w-4" style={{ background: 'var(--viz-confirmed)' }} aria-hidden="true" />
    응답
  </span>
  <span className="inline-flex items-center gap-1.5">
    <span className="inline-block h-0.5 w-4 border-t border-dashed" style={{ borderColor: 'var(--viz-waiting)' }} aria-hidden="true" />
    EAGAIN
  </span>
  <span className="inline-flex items-center gap-1.5">
    <span className="inline-block h-0.5 w-4" style={{ background: 'var(--viz-highlight)' }} aria-hidden="true" />
    벨 알림
  </span>
</div>

<div className="mt-3 rounded-[var(--radius-card)] border border-border bg-background p-3">
  <p className="text-[length:var(--text-caption)] text-muted-foreground">
    <span className="font-semibold text-foreground">현실에서는</span>{' '}
    {scenario.realWorld}
  </p>
</div>
```

Add the LegendDot helper at the bottom of the file:

```tsx
function LegendDot({ state, label }: { state: VizState; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-sm border-2', vizStateClasses(state))}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Verify type-check + lint pass**

Run: `pnpm type-check && pnpm lint`
Expected: both PASS.

- [ ] **Step 3: Manual visual verify**

Legend appears at the bottom with state dots and arrow swatches. Light/dark mode both render with proper contrast.

- [ ] **Step 4: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.tsx
git commit -m "feat(viz): add legend for states + arrow types"
```

---

## Task 12: Swap MDX usage and remove old RestaurantIOModel

**Files:**
- Modify: `content/posts/sync-async-blocking-nonblocking.mdx`
- Modify: `components/mdx/components.tsx`
- Delete: `components/visualizations/RestaurantIOModel.tsx`

- [ ] **Step 1: Replace `<RestaurantIOModel />` with `<RestaurantIOSequence />` in the post**

In `content/posts/sync-async-blocking-nonblocking.mdx`, find the line `<RestaurantIOModel />` (under the H2 "음식점으로 보는 4가지 조합") and change it to:

```mdx
<RestaurantIOSequence />
```

- [ ] **Step 2: Remove RestaurantIOModel from mdxComponents**

In `components/mdx/components.tsx`:
1. Remove the import line `import { RestaurantIOModel } from '@/components/visualizations/RestaurantIOModel'`
2. Remove the `RestaurantIOModel,` entry from the `mdxComponents` object literal

- [ ] **Step 3: Delete the old component file**

```bash
git rm components/visualizations/RestaurantIOModel.tsx
```

- [ ] **Step 4: Regenerate keyword map (frontmatter unchanged but safety check)**

Run: `pnpm generate-keyword-map`
Expected: success message like `[keyword-map] generated 42 keywords from 15 posts`.

- [ ] **Step 5: Verify type-check + lint + tests pass**

Run: `pnpm type-check && pnpm lint && pnpm test`
Expected: all PASS.

- [ ] **Step 6: Manual visual verify in dev**

Open `http://blog.localhost:3010/posts/sync-async-blocking-nonblocking`. Confirm:
1. New `<RestaurantIOSequence />` renders at the position of the old viz
2. All 4 tabs work
3. No reference to old `<RestaurantIOModel />` anywhere
4. No console errors

- [ ] **Step 7: Commit**

```bash
git add content/posts/sync-async-blocking-nonblocking.mdx components/mdx/components.tsx components/visualizations/RestaurantIOModel.tsx lib/generated/keyword-map.ts
git commit -m "feat(viz): swap RestaurantIOModel → RestaurantIOSequence in post; delete old component"
```

---

## Task 13: A11y attributes + responsive viewBox

**Files:**
- Modify: `components/visualizations/RestaurantIOSequence.tsx`

Tabs already have `aria-pressed`. SVG needs `<title>` and `<desc>` describing current state. The viewBox is responsive but the column spacing (100 px per actor) means wide content. Test mobile rendering at 375 px.

- [ ] **Step 1: Add SVG title and description tied to current step**

Inside the `<svg>` opening, replace the `aria-label` with explicit children:

```tsx
<svg
  viewBox={`0 0 500 ${svgHeight}`}
  className="w-full"
  role="img"
  aria-labelledby="restaurant-io-svg-title"
  aria-describedby="restaurant-io-svg-desc"
>
  <title id="restaurant-io-svg-title">{scenario.title} — Step {controller.step + 1} / {scenario.steps.length}</title>
  <desc id="restaurant-io-svg-desc">{current.note}</desc>
  {/* defs, lifelines, activities, arrows */}
</svg>
```

- [ ] **Step 2: Verify type-check + lint pass**

Run: `pnpm type-check && pnpm lint`
Expected: both PASS.

- [ ] **Step 3: Mobile responsive check**

In dev with browser at 375 px width, verify:
- Avatar grid stays in 5 columns (no wrap) — `grid-cols-5` is fine since each cell is small
- SVG scales to container width via `w-full` + viewBox
- Tab buttons wrap to multiple rows if needed (already `flex-wrap`)
- Legend wraps gracefully (already `flex-wrap`)

If avatars are too cramped at 375 px, reduce avatar size:
- Change `h-11 w-11` → `h-9 w-9` and `h-5 w-5` (icon) → `h-4 w-4` for the icon

(Apply this only if visibly cramped on a real test, not as defensive change.)

- [ ] **Step 4: Commit**

```bash
git add components/visualizations/RestaurantIOSequence.tsx
git commit -m "a11y(viz): add SVG title/desc tied to current step"
```

---

## Task 14: Final validation — type-check, lint, build, full visual sweep

**Files:** none (validation only)

- [ ] **Step 1: Run full validation suite**

Run sequentially:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

Expected: all PASS. The `build` runs Velite + Next.js production build and surfaces any SSR or MDX errors that dev might mask.

- [ ] **Step 2: Manual full visual sweep in dev**

Open `http://blog.localhost:3010/posts/sync-async-blocking-nonblocking` and exercise:

1. **Sync · Blocking tab**
   - Step through all 5 steps using the next button
   - Auto-play (▶) — completes and stops at step 4
   - Reset → goes back to step 0
   - Customer A's red blocked bar appears at step 1, persists to step 3
   - Step 4: bar turns green confirmed

2. **Sync · Non-Blocking tab**
   - 6 steps. Eagain arrows render with dashed lines and "아직" labels at steps 2 and 3
   - Final step shows confirmed green for customer A

3. **Async · Blocking tab (multiplexing)**
   - 8 steps. At step 0, all 3 customers full opacity
   - Step 2: customer B highlighted, A and C dim — bell B arrow visible
   - Step 4: customer A highlighted — bell A arrow visible
   - Step 6: customer C highlighted — bell C arrow visible
   - Step 7: all 3 customers confirmed (still A/C dim per activeCustomer = C)

4. **Async · Non-Blocking tab**
   - 5 steps. Step 1: kitchen→customer-a request arrow + staff goes confirmed
   - Step 3: kitchen→customer-a response arrow (direct delivery) + bell to staff

5. **Light/Dark theme toggle**: switch theme, all colors remain readable, no white-on-white or black-on-black

6. **Mobile 375 px**: open devtools, set width to 375 px, exercise all 4 tabs

- [ ] **Step 3: Run dev server log check**

Look at the dev server stderr/stdout for any unexpected warnings (key warnings, hydration mismatches, etc.).

- [ ] **Step 4: Final commit (if any small fixes needed during sweep)**

If the visual sweep surfaced any issues, fix them and commit. Otherwise, no commit needed for this task.

---

## Acceptance Criteria

- [ ] All 4 scenario tabs render and step through without errors
- [ ] `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build` all pass
- [ ] Old `RestaurantIOModel` is fully deleted (no file, no import, no MDX reference)
- [ ] `RestaurantIOSequence` is referenced exactly once in `mdxComponents` and exactly once in the post
- [ ] No emojis anywhere in the new component (per memory `feedback-svg-visualization-deprecated` is N/A but per spec §9.4: only Lucide icons + text labels)
- [ ] No hardcoded `text-[Npx]`, `rounded-[Npx]`, hex colors, or other style tokens lint forbids (per CLAUDE.md §9)
- [ ] `prefers-reduced-motion: reduce` disables auto-play and dim transitions
- [ ] Mobile 375 px width renders without horizontal page scroll

---

## Out of Scope (do not do these)

- Changes to `IOModelMatrix` or `IOModelTimeline` (unrelated, kept as-is)
- Adding tests for SVG visual rendering (project convention: visual check only)
- Adding new viz states or new common framework helpers
- Refactoring existing visualizations to share a "sequence diagram" abstract base (premature)
- Adding compare-mode where all 4 scenarios render side-by-side
