# Phase 4.1 — 시각화 프레임워크 (Step-by-step) 디자인 명세

**작성일**: 2026-04-15
**대상 단계**: Phase 4.1 (Step-by-step 프레임워크)
**선행 조건**: Phase 3 완료, Quick Sort 스타일 가이드, blog-writer 스킬
**관련 CLAUDE.md 섹션**: §6 인터랙티브 시각화 시스템

---

## 1. 배경 및 목표

### 1.1 배경

현재 `components/visualizations/QuickSort.tsx`는 218줄의 자립형 컴포넌트로, 상태 관리(useState/useEffect)·컨트롤 버튼·컨테이너 스타일·색상 시맨틱을 모두 직접 구현한다. 이 코드는 Phase 2에서 "Phase 4 preview" 주석과 함께 작성되었고, 후속 시각화(B-Tree 삽입, GC mark-sweep, Consumer Group 리밸런싱 등)가 추가될 때 같은 보일러플레이트를 매번 반복해야 하는 상황이다.

Phase 4는 이 보일러플레이트를 공통 프레임워크로 추출하고, `QuickSort.tsx`를 첫 consumer로 refactor해 검증한다.

### 1.2 Scope — Phase 4.1만

CLAUDE.md §6.1은 3가지 시각화 유형(Step-by-step / Interactive Playground / Timeline-Concurrent)을 정의하지만, Phase 4.1은 **Step-by-step 프레임워크에만 집중**한다. 이유:

- 실제 존재하는 시각화 사례 1개(QuickSort)가 Step-by-step 유형이므로 API 추출의 근거가 유일
- CLAUDE.md §6.5의 "시각화 필수 주제" 중 대부분(정렬 알고리즘, B-Tree, HashMap, LRU, Thread 상태 전이, GC, Consumer Group, 2PC/SAGA)이 Step-by-step 범주
- Playground/Timeline은 실제 구현 사례 없이 API 추상화하면 잘못된 추상화 위험 높음
- Phase 4.2 (Playground), Phase 4.3 (Timeline)은 해당 유형의 첫 시각화가 등장할 때 도입

### 1.3 목표

1. **공통 컴포넌트 3개 + 훅 1개 구축**: `VisualContainer`, `StepController`, `SpeedSlider`, `useStepController`
2. **시맨틱 색상 토큰 시스템**: 6 상태 × 3 슬롯 = 18개 CSS 변수. 라이트/다크 자동 대응
3. **QuickSort 검증**: 새 프레임워크로 refactor해 API가 실제 쓸 만한지 증명
4. **확장성 문서화**: 새 상태 추가 절차, 새 시각화 작성 패턴을 스펙과 blog-writer 스킬에 명시
5. **접근성**: `prefers-reduced-motion: reduce` 자동 대응, 키보드 네비게이션, ARIA 속성

### 1.4 Phase 이후로 이월 (Phase 4.2, 4.3)

- **Phase 4.2 (Interactive Playground)**: Isolation Level, GC 임계값, Cache TTL 같은 파라미터 조절 시각화 + `ControlPanel`, `SegmentedControl` 공통 컴포넌트
- **Phase 4.3 (Timeline/Concurrent)**: Lock 경합, MVCC, Deadlock, Cache Stampede 같은 시간축 시각화 + `TimelineTrack`, `ActorSwimlane` + `--viz-actor-1~4` 토큰

각 서브 페이즈는 "실제 시각화 1개 구현 + 과정에서 추출된 공통 요소를 `common/`에 승격" 순서를 따른다.

---

## 2. 주요 결정 사항

### 2.1 Step-by-step only (Scope 결정)

Phase 4.1은 Step-by-step 시각화만 지원. Playground/Timeline은 미래 서브 페이즈로 이월.

### 2.2 커스텀 훅 + dumb 컴포넌트 패턴

상태 관리는 `useStepController` 훅에 캡슐화, `<StepController>` 는 훅의 반환값을 spread로 받는 dumb 컴포넌트. 이유:
- 보일러플레이트 제거 (현재 QuickSort의 useState/useEffect/경계 처리 ~50줄이 훅 호출 1줄로 교체)
- 훅은 `renderHook`으로 순수 단위 테스트 가능
- Radix UI, shadcn/ui 등 React 생태계 표준 패턴 (훅 + 컴포넌트 이중 제공)

### 2.3 CSS 변수 + Tailwind 유틸리티 (색상 토큰)

`app/globals.css`의 `:root`와 `[data-theme="dark"]`에 `--viz-<state>-{border,bg,fg}` 18개 변수 정의. `@theme inline` 블록에서 `--color-viz-*` 매핑으로 Tailwind 유틸리티 자동 생성. Phase 2 Callout 토큰과 동일 패턴.

이 결정은 CLAUDE.md §6.4의 원본 TypeScript 상수 제안을 **확장**한다 — TypeScript 상수는 상태 이름 유니온 타입만 제공하고, 실제 색상 값은 CSS 변수가 단일 진실 소스.

### 2.4 QuickSort 2-커밋 리팩토링

**커밋 1 (pure refactor)**: 동작과 시각 결과 완전 동일, 내부 코드만 프레임워크 사용.
**커밋 2 (feature add)**: SpeedSlider와 progress bar를 추가 노출.

pure refactor 단계를 분리하면 "refactor가 정확한가"를 픽셀 단위로 검증 가능.

### 2.5 `common/` 서브디렉토리

`components/visualizations/common/` 에 프레임워크 파일을 분리. 도메인 시각화 (`QuickSort.tsx`, 미래의 `BTreeInsert.tsx` 등)와 공통 프레임워크를 명확히 구분.

**순환 금지**: `common/*`는 도메인 시각화를 import하지 않는다.

### 2.6 6 상태 × 3 슬롯 (확장성 우선)

QuickSort가 실제로 쓰는 3 상태(`pivot`, `comparing`, `confirmed`)만 정의하는 YAGNI 대안 대신, 6 상태(`pivot`, `comparing`, `confirmed`, `blocked`, `waiting`, `highlight`) × 3 슬롯(`border`, `bg`, `fg`) = 18개를 **처음부터 정의**한다.

이유: 사용자의 명시적 확장성 요구사항. 새 상태 추가 절차를 스펙에 명시해 미래 확장 경로가 고정된다. Timeline 전용 `--viz-actor-1~4`는 Phase 4.3에서 추가.

### 2.7 접근성 — `prefers-reduced-motion` 자동 대응

`useStepController` 훅이 `window.matchMedia('(prefers-reduced-motion: reduce)')`를 감지하고, 감지 시:
- `play()` 호출 무시 (auto-play 시작 안 함)
- 현재 `isPlaying === true` → `false`로 강제 전환
- `<StepController>` UI: Play 버튼 비활성화 + SpeedSlider 숨김

사용자는 수동으로 Prev/Next를 클릭해 각 스텝을 탐색할 수 있다.

---

## 3. 아키텍처

### 3.1 파일 구조

```
components/visualizations/
├── common/                          [신규 디렉토리]
│   ├── VisualContainer.tsx          시각화 외곽 래퍼
│   ├── StepController.tsx           컨트롤 UI (dumb component)
│   ├── SpeedSlider.tsx              속도 조절 (5단계 세그먼트)
│   ├── useStepController.ts         상태 관리 훅
│   └── colors.ts                    VIZ_STATES 유니온 타입 + helper
└── QuickSort.tsx                    [수정] 새 프레임워크 사용

app/globals.css                      [수정] --viz-* CSS 변수 18개 + @theme inline 매핑

tests/
└── use-step-controller.test.ts      [신규] 훅 단위 테스트 12+ 케이스
```

### 3.2 계층 의존

```
QuickSort.tsx (도메인 시각화)
    ↓ imports
VisualContainer + StepController + SpeedSlider + useStepController (common 프레임워크)
    ↓ imports
colors.ts (공통 타입)

globals.css (단일 진실 소스: 색상 값)
    ← all components consume via Tailwind utilities
```

### 3.3 데이터 흐름 (런타임)

```
사용자가 [블로그 글 렌더 시점]
   ↓
QuickSort 컴포넌트 마운트
   ↓
useMemo로 quickSortSnapshots(initial) 사전 계산 (30~40 스냅샷)
   ↓
useStepController(snapshots.length) 호출
   → step=0, isPlaying=false, speed=3, reducedMotion 감지
   ↓
VisualContainer (figure + title + description)
   ↓
배열 막대 그래프 렌더 (current = snapshots[step])
   ↓
StepController ({...controller}, stepDescription=current.note)
   → Prev/Next 버튼, Progress bar, Play/Pause, SpeedSlider
   ↓
사용자가 Play 클릭 → isPlaying=true → setTimeout(speed) → step++
```

---

## 4. `useStepController` 훅 명세

### 4.1 인터페이스

```typescript
// components/visualizations/common/useStepController.ts

export interface UseStepControllerOptions {
  initialSpeed?: number       // 1~5, 기본 3
  initialPlaying?: boolean    // 기본 false. reducedMotion 감지 시 강제 false
}

export interface StepControllerState {
  readonly step: number
  readonly totalSteps: number
  readonly isPlaying: boolean
  readonly speed: number         // 1~5
  readonly canPrev: boolean
  readonly canNext: boolean
  readonly progress: number      // 0.0 ~ 1.0
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

export function useStepController(
  totalSteps: number,
  options?: UseStepControllerOptions,
): StepControllerState
```

### 4.2 내부 구현 규칙

**관리 상태 3개** (useState):
- `step` (초기 0)
- `isPlaying` (초기 `options.initialPlaying ?? false`)
- `speed` (초기 `options.initialSpeed ?? 3`)

**감지 상태 1개** (useState):
- `reducedMotion` (초기 false, `useEffect`에서 matchMedia로 감지)

**useEffect 3개**:

1. **`totalSteps` 변경 → 자동 reset**:
```typescript
useEffect(() => {
  setStep(0)
  setIsPlaying(false)
}, [totalSteps])
```

2. **`prefers-reduced-motion` 감지 + auto-pause**:
```typescript
useEffect(() => {
  if (typeof window === 'undefined') return
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const apply = () => setReducedMotion(mq.matches)
  apply()
  mq.addEventListener('change', apply)
  return () => mq.removeEventListener('change', apply)
}, [])

useEffect(() => {
  if (reducedMotion && isPlaying) setIsPlaying(false)
}, [reducedMotion, isPlaying])
```

3. **auto-play 타이머** (핵심):
```typescript
useEffect(() => {
  if (!isPlaying) return
  if (reducedMotion) return
  if (step >= totalSteps - 1) {
    setIsPlaying(false)
    return
  }
  const handle = setTimeout(
    () => setStep((s) => Math.min(totalSteps - 1, s + 1)),
    speedToMs(speed),
  )
  return () => clearTimeout(handle)
}, [isPlaying, step, speed, totalSteps, reducedMotion])
```

### 4.3 속도 매핑

```typescript
function speedToMs(speed: number): number {
  const clamped = Math.max(1, Math.min(5, Math.round(speed)))
  const SPEED_MAP: Record<number, number> = {
    1: 1600,  // 느림
    2: 1200,
    3: 800,   // 기본 (CLAUDE.md §6.4 기본값)
    4: 600,
    5: 400,   // 빠름
  }
  return SPEED_MAP[clamped]
}
```

### 4.4 액션 경계 처리

모든 액션은 `useCallback` 으로 메모이제이션. 경계 조건:
- `prev()`: `step > 0`일 때만 감소
- `next()`: `step < totalSteps - 1`일 때만 증가
- `play()`: `reducedMotion === true` 또는 `step === totalSteps - 1`이면 무시
- `pause()`: 항상 `setIsPlaying(false)`
- `toggle()`: `isPlaying` ? `pause()` : `play()`
- `reset()`: `step = 0`, `isPlaying = false`
- `setSpeed(s)`: `Math.max(1, Math.min(5, Math.round(s)))`로 clamp
- `goTo(n)`: `Math.max(0, Math.min(totalSteps - 1, Math.round(n)))`로 clamp + `setIsPlaying(false)` (수동 점프 = 의도적 개입)

### 4.5 파생 상태

```typescript
const canPrev = step > 0
const canNext = step < totalSteps - 1
const progress = totalSteps > 1 ? step / (totalSteps - 1) : 0
```

단순 산술이므로 `useMemo` 불필요.

### 4.6 테스트 (`tests/use-step-controller.test.ts`)

**환경**: `@vitest-environment jsdom` pragma 파일 상단에 추가 (전역 vitest 설정 변경 없이).

**케이스 12+**:
- 초기 상태: `step=0, isPlaying=false, speed=3, canPrev=false, canNext=true`
- `initialSpeed: 5` 옵션 → `speed=5`
- `totalSteps=1` → `canNext=false, progress=0`
- `next()` 호출 → `step=1, canPrev=true`
- `next()` at last step → 변화 없음
- `prev()` at step 0 → 변화 없음
- `goTo(3)` → `step=3, isPlaying=false`
- `goTo(-1)` → `step=0` (clamp)
- `goTo(100)` → `step=totalSteps-1` (clamp)
- `reset()` → `step=0, isPlaying=false`
- `setSpeed(5)` → `speed=5`; `setSpeed(0)` → `speed=1`; `setSpeed(10)` → `speed=5` (clamp 3 cases)
- `totalSteps` 변경 rerender → `step=0, isPlaying=false`
- auto-play 경계: mock timers로 last step 도달 시 `isPlaying=false` 확인
- `reducedMotion`: `matchMedia` mock 후 `play()` 호출 → `isPlaying=false`

---

## 5. 컴포넌트 명세

### 5.1 `<VisualContainer />`

**Props**:
```typescript
interface VisualContainerProps {
  title: string
  description?: string
  children: ReactNode
  onReset?: () => void
  className?: string
}
```

**렌더 구조**:
```tsx
<figure className={cn('not-prose my-8 rounded-[14px] border border-border bg-background p-5', className)}>
  <figcaption className="mb-4 flex items-start justify-between gap-4">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
    </div>
    {onReset && (
      <button type="button" onClick={onReset} className="..." aria-label="초기 상태로 리셋">
        <RotateCcw className="h-4 w-4" />
      </button>
    )}
  </figcaption>
  {children}
</figure>
```

**결정 사항**:
- `not-prose`로 `.prose-kr` 스타일 차단
- `figure` 시맨틱 유지 (현재 QuickSort와 동일)
- `onReset` 버튼은 상단 우측 (선택적)
- `className` prop으로 주제별 커스텀 허용

### 5.2 `<StepController />`

**Props**:
```typescript
interface StepControllerProps extends StepControllerState {
  stepDescription?: string
  showSpeedSlider?: boolean   // 기본 true
  showProgressBar?: boolean   // 기본 true
  className?: string
}
```

**핵심**: `extends StepControllerState` — 훅의 반환값을 `<StepController {...controller} />` 로 spread 가능.

**렌더 구조** (의사 코드, 상세는 섹션 3.2 참고):
```tsx
<div className={cn('mt-4 space-y-3', className)}>
  {/* 1. Step description */}
  {stepDescription && <StepDescription step={step} total={totalSteps - 1} text={stepDescription} />}

  {/* 2. Progress bar (role="progressbar", clickable to jump) */}
  {showProgressBar && totalSteps > 1 && (
    <ProgressBar progress={progress} step={step} totalSteps={totalSteps} onJump={goTo} />
  )}

  {/* 3. Buttons row + SpeedSlider */}
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-1">
      <ControlButton onClick={reset} disabled={step === 0 && !isPlaying} ariaLabel="처음으로 리셋">
        <RotateCcw />
      </ControlButton>
      <ControlButton onClick={prev} disabled={!canPrev} ariaLabel="이전 단계">
        <ChevronLeft />
      </ControlButton>
      <ControlButton onClick={toggle} disabled={!canNext || reducedMotion} ariaLabel={isPlaying ? '일시정지' : '자동 재생'}>
        {isPlaying ? <Pause /> : <Play />}
      </ControlButton>
      <ControlButton onClick={next} disabled={!canNext} ariaLabel="다음 단계">
        <ChevronRight />
      </ControlButton>
    </div>
    {showSpeedSlider && !reducedMotion && <SpeedSlider speed={speed} onChange={setSpeed} />}
  </div>
</div>
```

**Progress bar 클릭 동작**:
```typescript
onClick={(e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  goTo(Math.round(ratio * (totalSteps - 1)))
}}
```

**접근성**:
- 모든 버튼 `aria-label` 한국어
- Progress bar `role="progressbar"` + `aria-valuenow/valuemin/valuemax`
- `focus-visible:ring-2 focus-visible:ring-ring` 포커스 링

### 5.3 `<SpeedSlider />`

**Props**:
```typescript
interface SpeedSliderProps {
  speed: number
  onChange: (speed: number) => void
  className?: string
}
```

**렌더 구조** — 5개 세로 막대 세그먼트:
```tsx
<div className={cn('flex items-center gap-2 text-[11px] text-muted-foreground', className)} role="group" aria-label="재생 속도">
  <span className="hidden sm:inline">속도</span>
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((level) => (
      <button
        key={level}
        type="button"
        onClick={() => onChange(level)}
        aria-label={`속도 ${level}`}
        aria-pressed={speed === level}
        className={cn(
          'h-5 w-2 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          level <= speed ? 'bg-primary' : 'bg-border',
        )}
      />
    ))}
  </div>
</div>
```

**시각 효과**: "배터리 게이지" 스타일. 현재 속도까지 `primary`, 나머지는 `border`.

---

## 6. 색상 토큰 시스템

### 6.1 `app/globals.css` 추가 — `:root` 블록

```css
:root {
  /* ... 기존 tokens 유지 ... */

  /* Visualization state tokens — 6 states × 3 slots = 18 variables.
     새 상태 추가 절차는 §6.3 참고. */

  /* Pivot — 피벗/기준 요소 (amber) */
  --viz-pivot-border:    #F59E0B;
  --viz-pivot-bg:        #FEF3C7;
  --viz-pivot-fg:        #78350F;

  /* Comparing — 비교 중 요소 (blue) */
  --viz-comparing-border: #3B82F6;
  --viz-comparing-bg:     #DBEAFE;
  --viz-comparing-fg:     #1E3A8A;

  /* Confirmed — 확정/완료 요소 (emerald) */
  --viz-confirmed-border: #10B981;
  --viz-confirmed-bg:     #D1FAE5;
  --viz-confirmed-fg:     #064E3B;

  /* Blocked — 차단/충돌 요소 (red) */
  --viz-blocked-border:   #EF4444;
  --viz-blocked-bg:       #FEE2E2;
  --viz-blocked-fg:       #7F1D1D;

  /* Waiting — 대기 중 요소 (gray) */
  --viz-waiting-border:   #9CA3AF;
  --viz-waiting-bg:       #F3F4F6;
  --viz-waiting-fg:       #374151;

  /* Highlight — 특별 강조 요소 (purple) */
  --viz-highlight-border: #8B5CF6;
  --viz-highlight-bg:     #EDE9FE;
  --viz-highlight-fg:     #4C1D95;
}
```

### 6.2 `app/globals.css` 추가 — `[data-theme="dark"]` 블록

```css
[data-theme="dark"] {
  /* ... 기존 dark tokens 유지 ... */

  --viz-pivot-border:    #FBBF24;
  --viz-pivot-bg:        #3B2D05;
  --viz-pivot-fg:        #FEF3C7;

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
}
```

### 6.3 `@theme inline` 매핑 — Tailwind 유틸리티 자동 생성

```css
@theme inline {
  /* ... 기존 매핑 유지 ... */

  /* Visualization state tokens */
  --color-viz-pivot:          var(--viz-pivot-border);
  --color-viz-pivot-bg:       var(--viz-pivot-bg);
  --color-viz-pivot-fg:       var(--viz-pivot-fg);

  --color-viz-comparing:      var(--viz-comparing-border);
  --color-viz-comparing-bg:   var(--viz-comparing-bg);
  --color-viz-comparing-fg:   var(--viz-comparing-fg);

  --color-viz-confirmed:      var(--viz-confirmed-border);
  --color-viz-confirmed-bg:   var(--viz-confirmed-bg);
  --color-viz-confirmed-fg:   var(--viz-confirmed-fg);

  --color-viz-blocked:        var(--viz-blocked-border);
  --color-viz-blocked-bg:     var(--viz-blocked-bg);
  --color-viz-blocked-fg:     var(--viz-blocked-fg);

  --color-viz-waiting:        var(--viz-waiting-border);
  --color-viz-waiting-bg:     var(--viz-waiting-bg);
  --color-viz-waiting-fg:     var(--viz-waiting-fg);

  --color-viz-highlight:      var(--viz-highlight-border);
  --color-viz-highlight-bg:   var(--viz-highlight-bg);
  --color-viz-highlight-fg:   var(--viz-highlight-fg);
}
```

**자동 생성 유틸리티**: Tailwind v4가 위 매핑을 읽고 `bg-viz-pivot`, `border-viz-pivot`, `text-viz-pivot`, `ring-viz-pivot` 등 유틸리티를 자동 생성. 18 슬롯 × 4 종류(bg/border/text/ring) = **최대 72개 유틸리티** 사용 가능.

### 6.4 명명 관례

| 슬롯 | Tailwind 유틸리티 | 용도 |
|---|---|---|
| border | `border-viz-<state>` | 요소의 외곽선 |
| bg | `bg-viz-<state>-bg` | 요소의 배경색 |
| fg | `text-viz-<state>-fg` | 요소 내부 텍스트 색 |

**예시**:
```tsx
<div className="border-viz-pivot bg-viz-pivot-bg text-viz-pivot-fg">
  피벗 원소
</div>
```

### 6.5 `components/visualizations/common/colors.ts`

```typescript
/**
 * 시각화 상태 이름의 단일 진실 소스.
 * 새 상태 추가 시 app/globals.css의 --viz-<state>-* 변수도 함께 추가해야 함.
 * 상세: docs/superpowers/specs/2026-04-15-phase-4-visualization-framework.md §6.6
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
 * 상태에 대한 Tailwind 유틸리티 클래스 조합을 반환.
 * 시각화 컴포넌트가 inline 스타일 대신 일관된 클래스를 얻는 helper.
 */
export function vizStateClasses(state: VizState): string {
  return `border-viz-${state} bg-viz-${state}-bg text-viz-${state}-fg`
}
```

### 6.6 새 상태 추가 절차 (확장성 가이드)

새 시각화에서 기존 6 상태로 표현되지 않는 의미가 필요한 경우 (예: `deadlock`):

1. **`app/globals.css`의 `:root` 블록에 3개 변수 추가**:
   ```css
   --viz-deadlock-border: #DC2626;
   --viz-deadlock-bg:     #FECACA;
   --viz-deadlock-fg:     #450A0A;
   ```

2. **`app/globals.css`의 `[data-theme="dark"]` 블록에 다크 모드 값 추가**:
   ```css
   --viz-deadlock-border: #F87171;
   --viz-deadlock-bg:     #1A0303;
   --viz-deadlock-fg:     #FECACA;
   ```

3. **`@theme inline` 블록에 3개 Tailwind 매핑 추가**:
   ```css
   --color-viz-deadlock:    var(--viz-deadlock-border);
   --color-viz-deadlock-bg: var(--viz-deadlock-bg);
   --color-viz-deadlock-fg: var(--viz-deadlock-fg);
   ```

4. **`components/visualizations/common/colors.ts`의 `VIZ_STATES` 배열에 추가**:
   ```typescript
   export const VIZ_STATES = [
     'pivot', 'comparing', 'confirmed', 'blocked', 'waiting', 'highlight',
     'deadlock',  // ← 새 상태
   ] as const
   ```

5. **시각화에서 사용**:
   ```tsx
   <div className={vizStateClasses('deadlock')}>Deadlock detected</div>
   ```

6. **`pnpm build` — 완료**. Tailwind가 자동으로 유틸리티 생성.

**권장 사항**:
- 기존 6 상태로 표현 가능하면 신규 상태를 만들지 말고 재사용
- 라이트/다크 WCAG AA 대비 확보 (border 4.5:1, bg 위 fg 4.5:1 이상)
- 새 상태는 "정말로 의미가 다를 때"만

---

## 7. QuickSort 리팩토링

### 7.1 2-커밋 전략

**커밋 1 — Pure refactor** (동작 보존):
- 프레임워크 사용하도록 내부 코드 교체
- 시각적 결과는 이전과 동일 (Phase 2 스크린샷과 픽셀 일치)
- 코드 분량: 218줄 → ~110-130줄

**커밋 2 — Feature add**:
- SpeedSlider 노출 (기본 속도 3)
- Progress bar 노출 (클릭해서 점프)
- 코드 분량: ~115-135줄

### 7.2 Refactor 후 QuickSort 구조

```tsx
'use client'

import { useMemo } from 'react'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'
import { cn } from '@/lib/utils'

// 알고리즘 로직 — 기존 quickSortSnapshots 함수 그대로 유지 (변경 없음)

interface QuickSortProps {
  initial?: number[]
  description?: string
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
    <VisualContainer
      title="Quick Sort 분할 과정"
      description={description}
    >
      {/* 배열 막대 그래프 — CSS 변수 토큰 사용 */}
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

      {/* 컨트롤러 — 훅 상태를 spread로 전달 */}
      <StepController {...controller} stepDescription={current.note} />

      {/* Legend */}
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
      <span className={cn('inline-block h-3 w-3 rounded-sm border-2', stateClass)} aria-hidden="true" />
      {label}
    </span>
  )
}
```

### 7.3 변경되지 않는 것

- `quickSortSnapshots()` 함수 — 알고리즘 로직 그대로
- `Snapshot` interface — 데이터 구조 그대로
- `QuickSortProps` — 공개 API (initial, description) 그대로 → 기존 MDX 사용(`<QuickSort initial={[...]} />`)이 영향 없음
- 시각 결과 — 픽셀 단위로 이전과 동일 (커밋 1 시점)

---

## 8. 구현 작업 순서 (6단계)

각 단계 종료 시 `pnpm build` + `pnpm test` 녹색 유지.

### 1단계 — 색상 토큰 추가
1. `app/globals.css`의 `:root`와 `[data-theme="dark"]`에 18개 변수 추가
2. `@theme inline` 블록에 18개 매핑 추가
3. `pnpm build` — Tailwind가 새 유틸리티 생성하는지 확인
4. Commit: `feat(styles): add --viz-* tokens for visualization framework (6 states × 3 slots)`

### 2단계 — `colors.ts` + `useStepController` 훅 + 테스트
1. `components/visualizations/common/colors.ts` 생성
2. `components/visualizations/common/useStepController.ts` 생성 + 훅 구현
3. `tests/use-step-controller.test.ts` 생성 + 12+ 케이스
4. 파일 상단에 `// @vitest-environment jsdom` pragma 추가
5. `pnpm test` — 새 테스트 포함 모두 녹색
6. Commit: `feat(viz): add useStepController hook with jsdom tests`

### 3단계 — 공통 컴포넌트 3개 구현
1. `components/visualizations/common/VisualContainer.tsx`
2. `components/visualizations/common/SpeedSlider.tsx`
3. `components/visualizations/common/StepController.tsx` (+ 내부 `ControlButton` helper)
4. `pnpm build` + `pnpm type-check` 모두 녹색
5. Commit: `feat(viz): add VisualContainer/StepController/SpeedSlider components`

### 4단계 — QuickSort pure refactor
1. `components/visualizations/QuickSort.tsx`를 새 프레임워크 사용하도록 refactor
2. `quickSortSnapshots()` 함수는 변경 없음
3. Tailwind 클래스 `amber/blue/emerald` 하드코딩을 `vizStateClasses()` helper로 교체
4. `pnpm build` + dev 서버에서 시각적으로 이전 버전과 **픽셀 단위 동일**하게 렌더되는지 수동 확인
5. Commit: `refactor(viz): migrate QuickSort to VisualContainer/StepController framework`

### 5단계 — QuickSort에 SpeedSlider + Progress bar 노출
1. `<StepController>`의 기본값 `showSpeedSlider={true}`, `showProgressBar={true}` 사용 (별도 prop 설정 불필요)
2. dev 서버에서 속도 슬라이더 클릭, 진행 바 클릭 점프 동작 수동 검증
3. 개발자 도구의 `prefers-reduced-motion` emulation으로 접근성 대응 검증
4. Commit: `feat(viz): expose SpeedSlider and progress bar in QuickSort`

### 6단계 — CLAUDE.md + blog-writer 스킬 업데이트
1. **CLAUDE.md §6.2**: 공통 컴포넌트 API를 "설계안" → "실제 구현"으로 업데이트. `useStepController` 훅 추가 언급.
2. **CLAUDE.md §6.4**: `vizColors` 객체 설명을 `--viz-*` CSS 변수 + `vizStateClasses()` helper 설명으로 교체.
3. **CLAUDE.md §12**: Phase 4.1 완료 표시. Phase 4.2(Playground), 4.3(Timeline) 미래 서브 페이즈 명시.
4. **`.claude/skills/blog-writer/references/visualization-rules.md`**: "QuickSort.tsx 패턴 재사용" → "`useStepController` + `<VisualContainer>` + `<StepController>` 프레임워크 사용" 으로 가이드 갱신. 새 Step-by-step 시각화 작성 템플릿 코드 추가.
5. Commit: `docs: update CLAUDE.md §6 and blog-writer skill for Phase 4.1 completion`

---

## 9. 완료 기준 (Definition of Done)

- [ ] `app/globals.css`에 18개 `--viz-*` 변수 추가 (light + dark)
- [ ] `@theme inline`에 18개 `--color-viz-*` 매핑 추가
- [ ] `components/visualizations/common/` 에 5개 파일: `VisualContainer.tsx`, `StepController.tsx`, `SpeedSlider.tsx`, `useStepController.ts`, `colors.ts`
- [ ] `useStepController` 테스트 12+ 케이스 녹색
- [ ] `QuickSort.tsx`가 프레임워크 사용, 커밋 1(pure refactor)과 커밋 2(feature add) 분리
- [ ] 커밋 1 시점에 시각적으로 이전 버전과 동일 (수동 검증)
- [ ] 커밋 2 시점에 SpeedSlider와 progress bar 동작
- [ ] `pnpm build` / `pnpm type-check` / `pnpm test` 모두 녹색
- [ ] 총 테스트 87 + 12 = ~99개
- [ ] CLAUDE.md §6.2, §6.4, §12 업데이트
- [ ] `visualization-rules.md` 업데이트
- [ ] `prefers-reduced-motion: reduce` 환경에서 동작 검증 (수동)

---

## 10. 알려진 미결 사항 (Phase 이후로 이월)

- **Phase 4.2 (Interactive Playground)**: `ControlPanel`, `SegmentedControl`, `RadioGroup`, `Toggle` 등의 공통 컴포넌트. Isolation Level, GC 임계값, Cache TTL 같은 시각화가 처음 등장할 때 도입.
- **Phase 4.3 (Timeline/Concurrent)**: `TimelineTrack`, `ActorSwimlane`, `TimelineEvent` + `--viz-actor-1~4` 토큰. Lock 경합, MVCC, Cache Stampede, Deadlock 시각화가 처음 등장할 때 도입.
- **시각화 컴포넌트 자동 등록**: 현재 `components/mdx/components.tsx`에 수동 등록. 미래에 자동 수집 시스템 검토 가능.
- **시각화 간 state 공유**: 한 글에 여러 시각화가 있을 때 서로 영향 주는 케이스 (예: 한 시각화의 결과가 다른 시각화의 입력). 현재는 독립 실행. 필요 시 Context API 도입.

---

## 11. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|---|---|---|
| `vitest`의 `environment: node`로는 `window.matchMedia` 모킹 불가 | `useStepController` 테스트의 reducedMotion 케이스 실패 | 파일별 `// @vitest-environment jsdom` pragma로 해결. 전역 vitest 설정 변경 없음 |
| Tailwind가 `bg-viz-*` 유틸리티를 동적 클래스로 인식 못함 | 실제 클래스가 CSS에 포함 안 됨 | `vizStateClasses()` helper가 리터럴 문자열을 반환하므로 Tailwind content scanner가 감지. 단, 동적 조합(`bg-viz-${state}-bg`)은 safelist 또는 `@theme inline`으로 보장 |
| QuickSort refactor 후 시각적 차이 | Phase 2 스타일 가이드 스크린샷 불일치 | 4단계 pure refactor 후 dev 서버 수동 비교. 차이 발견 시 수정 |
| `prefers-reduced-motion` SSR 감지 실패 | Hydration mismatch 경고 | 초기 렌더는 `reducedMotion: false` 가정, `useEffect` 내부에서만 감지 (클라이언트 전용). Hydration mismatch 없음 |
| `goTo()` 호출 시 auto-play 자동 중지 규칙이 예상과 다름 | UX 혼란 | 스펙에 명시 + 테스트 케이스로 고정 ("수동 점프 = 사용자 의도적 개입 = auto-play 중지") |
| 6 상태 중 3개(blocked/waiting/highlight)가 당장 사용 안 됨 | Tailwind tree-shake가 해당 유틸리티를 번들에서 제거 — 정상 | YAGNI 위반 아님. CSS 변수만 추가되므로 비용 매우 적음. 사용자의 확장성 요구에 직접 대응 |
| 속도 변경 중 auto-play 타이머 race condition | 스텝이 건너뛰거나 중복 | useEffect 의존성에 `speed` 포함 → speed 변경 시 cleanup + 새 타이머. 기본 동작 |

---

## 12. Phase 4.1 이후의 경로

Phase 4.1이 완료되면 다음이 가능해진다:

1. **blog-writer 스킬의 시각화 생성이 프레임워크 기반**: 새 Step-by-step 시각화 생성 시 `useStepController` + `VisualContainer` + `StepController`를 조립만 하면 됨. 보일러플레이트 없음.

2. **다음 블로그 글의 시각화 품질 향상**: 새 글의 Step-by-step 시각화가 모두 일관된 UI (컨트롤/속도/진행 바)를 가짐.

3. **Phase 4.2/4.3 서브 페이즈의 명확한 확장 경로**: 각 서브 페이즈는 실제 사용 사례 1개를 구현하면서 그 과정에서 추출된 공통 컴포넌트를 `common/`에 승격. Phase 4.1이 확립한 패턴을 따름.

4. **리디자인 대응 용이**: 색상 변경은 `globals.css`의 CSS 변수 1~18줄만 수정. 컴포넌트 스타일 변경은 `common/*.tsx` 하나의 파일만 수정. 도메인 시각화는 영향 없음.
