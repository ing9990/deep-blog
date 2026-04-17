# Settings FAB Attention (Orbit Preview Intro) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 우측 하단 `SettingsFab`에 세션 1회 Orbit 프리뷰 애니메이션을 추가해서 "테마·언어를 바꿀 수 있다"는 기능성을 방문자에게 드러낸다.

**Architecture:** 신규 `SettingsFabIntro` 클라이언트 컴포넌트가 FAB 주변에 Sun/Moon/언어 아이콘 궤도 애니메이션을 재생한다. 타이밍은 Hero Intro 존재 여부에 따라 분기되며(홈 = 1200ms after dismissal / 그 외 = 800ms after mount), `sessionStorage['deep-fab-intro-seen']`으로 세션 게이트. `HeroIntro`에 dismissal CustomEvent dispatch 2줄만 추가해서 느슨하게 결합한다. `prefers-reduced-motion` 사용자는 정적 페이드 변형으로 기능 프리뷰를 유지한다.

**Tech Stack:** Next.js 15 App Router (Client Components), TypeScript strict, Tailwind v4, `lucide-react` (Sun/Moon), `next-themes` (변경 없음), pure CSS keyframes (framer-motion 등 신규 의존성 없음).

**Spec:** `docs/superpowers/specs/2026-04-18-settings-fab-attention-design.md`

---

## File Structure

| Path | 변경 유형 | 책임 |
|------|-----------|------|
| `app/globals.css` | Modify | 키프레임(`fab-orbit-in`, `fab-orbit-absorb`, `fab-ring-pulse`, `fab-orbit-static`) + `--z-fab-intro` 토큰 |
| `components/blog/HeroIntro.tsx` | Modify | dismissal 시점에 `deep-hero-dismissed` CustomEvent dispatch (2줄) |
| `components/layout/SettingsFabIntro.tsx` | Create | Orbit 오버레이 컴포넌트. 타이밍 결정, reduced-motion 분기, lang 반영 |
| `components/layout/SettingsFab.tsx` | Modify | wrapper `div`로 구조 조정 + `<SettingsFabIntro />` mount |

분리 근거:
- `SettingsFab`은 클릭 토글/패널 제어 책임. 일회성 ephemeral intro는 별도 컴포넌트로 분리해서 mount/unmount lifecycle 격리.
- `HeroIntro` 수정은 2줄짜리 dispatch 추가뿐. 기존 dismiss ref 가드 로직은 건드리지 않음(회귀 방지).
- CSS 키프레임은 `globals.css`에 모이는 기존 패턴(`panel-in`, `hero-rise` 등) 준수.

---

## Task 1: Add keyframes and z-index token to globals.css

### Files
- Modify: `app/globals.css`

### Context

- 기존 `--z-fab: 50` 토큰은 251번 근처. `--z-` 토큰들이 여기 모여있음.
- 기존 `@keyframes` 블록은 856번 근처부터. `hero-rise`, `panel-in` 등. 여기에 FAB 관련 키프레임을 이어서 추가.
- Orbit 애니메이션은 CSS 변수(`--start-x`, `--start-y`, `--end-x`, `--end-y`)로 아이콘별 좌표 주입.

### Steps

- [ ] **Step 1.1: `--z-fab-intro` 토큰 추가**

`app/globals.css`에서 `--z-fab` 정의 줄 바로 다음에 추가:

```css
  --z-fab:       50;      /* SettingsFab floating button */
  --z-fab-intro: 49;      /* Orbit preview sits visually above, button stays clickable */
```

- [ ] **Step 1.2: `fab-orbit-full` 키프레임 추가**

진입(0~500ms, ease-out) → 홀드(500~1000ms) → 흡수(1000~1600ms, ease-in)를 단일 키프레임의 step-wise `animation-timing-function`으로 통합. Tailwind arbitrary `animate-[...]`에서 comma-separated multiple animations는 파싱이 불안정해서 단일 키프레임이 안전.

기존 `@keyframes panel-in` 블록 다음에 추가:

```css
@keyframes fab-orbit-full {
  0% {
    transform: translate(var(--start-x, 0), var(--start-y, 0)) scale(0.6);
    opacity: 0;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  31.25% {
    /* 500ms / 1600ms = 31.25%. 진입 완료, 궤도 위치 안착 */
    transform: translate(var(--end-x, 0), var(--end-y, 0)) scale(1);
    opacity: 1;
    animation-timing-function: linear;
  }
  62.5% {
    /* 1000ms / 1600ms = 62.5%. 홀드 종료, 흡수 시작 */
    transform: translate(var(--end-x, 0), var(--end-y, 0)) scale(1);
    opacity: 1;
    animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
  }
  100% {
    transform: translate(0, 0) scale(0);
    opacity: 0;
  }
}
```

- [ ] **Step 1.3: `fab-orbit-static` 키프레임 추가 (reduced-motion 분기용)**

```css
@keyframes fab-orbit-static {
  0%   { transform: translate(var(--end-x, 0), var(--end-y, 0)) scale(0.85); opacity: 0; }
  15%  { transform: translate(var(--end-x, 0), var(--end-y, 0)) scale(1);    opacity: 1; }
  85%  { transform: translate(var(--end-x, 0), var(--end-y, 0)) scale(1);    opacity: 1; }
  100% { transform: translate(var(--end-x, 0), var(--end-y, 0)) scale(0.85); opacity: 0; }
}
```

- [ ] **Step 1.4: `fab-ring-pulse` 키프레임 추가**

```css
@keyframes fab-ring-pulse {
  from {
    transform: scale(1);
    opacity: 0.35;
  }
  to {
    transform: scale(1.6);
    opacity: 0;
  }
}
```

- [ ] **Step 1.5: type-check 및 lint**

```bash
pnpm type-check
pnpm lint
```

Expected: 둘 다 통과 (CSS 변경은 영향 없음, 단 lint가 CSS 파싱하는지 확인).

- [ ] **Step 1.6: Commit**

```bash
git add app/globals.css
git commit -m "$(cat <<'EOF'
style(globals): add FAB orbit intro keyframes and z-index token

Single fab-orbit-full keyframe encodes entry, hold, and absorb with
step-wise animation-timing-function. fab-orbit-static is the
reduced-motion variant. fab-ring-pulse wraps the FAB border.
New --z-fab-intro token sits one below --z-fab.
EOF
)"
```

---

## Task 2: Dispatch `deep-hero-dismissed` CustomEvent from HeroIntro

### Files
- Modify: `components/blog/HeroIntro.tsx` (line 184-194 영역)

### Context

현재 Hero Intro는 dismissal 확정 시점에 `sessionStorage.setItem(STORAGE_KEY, ...)`만 호출한다. `SettingsFabIntro`가 이 시점을 관찰할 수 있도록 같은 블록에서 `window.dispatchEvent`를 호출한다.

기존 useEffect 블록(line 184-194)은 dismiss ref 가드로 단일 실행이 보장되므로, 이벤트도 정확히 한 번 발행된다. 아래는 현재 블록:

```tsx
useEffect(() => {
  if (!show) return
  if (stage <= STAGE_TOTAL) return
  if (dismissScheduledRef.current) return
  dismissScheduledRef.current = true
  setDismissing(true)
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch {}
  window.setTimeout(() => setShow(false), FADE_MS)
}, [stage, show])
```

### Steps

- [ ] **Step 2.1: CustomEvent dispatch 추가**

`sessionStorage.setItem(...)` try-catch 직후, `window.setTimeout` 전에 추가:

```tsx
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('deep-hero-dismissed'))
  } catch {}
  window.setTimeout(() => setShow(false), FADE_MS)
```

`try-catch`로 래핑하는 이유: 극히 드문 구 브라우저/JSDOM 환경에서 `CustomEvent` constructor 없음을 방어. 실제 상황에서는 거의 필요 없지만 `sessionStorage`와 동일한 방어 패턴 유지.

- [ ] **Step 2.2: type-check 및 lint**

```bash
pnpm type-check
pnpm lint
```

Expected: 통과.

- [ ] **Step 2.3: Dev 서버로 이벤트 발행 확인**

```bash
lsof -nP -iTCP:3010 -sTCP:LISTEN || PORT=3010 pnpm dev &
```

브라우저 `http://blog.localhost:3010/`에서 신규 세션으로 접속(DevTools Application 탭에서 sessionStorage의 `deep-hero-seen` 제거 후 새로고침). DevTools Console에 다음 스니펫 붙여넣기:

```js
window.addEventListener('deep-hero-dismissed', () => console.log('[hero] dismissed'))
```

Hero Intro 4단계까지 스크롤 후 추가 스크롤로 dismissal 트리거. Console에 `[hero] dismissed`가 정확히 1회 출력되어야 함.

- [ ] **Step 2.4: Commit**

```bash
git add components/blog/HeroIntro.tsx
git commit -m "$(cat <<'EOF'
feat(hero-intro): dispatch deep-hero-dismissed on final dismissal

Emits a one-shot window CustomEvent at the same spot that writes the
sessionStorage flag. Used by SettingsFabIntro to chain its own intro
playback after Hero fades out. Guarded with try/catch to mirror the
existing sessionStorage defensive pattern.
EOF
)"
```

---

## Task 3: Create SettingsFabIntro component

### Files
- Create: `components/layout/SettingsFabIntro.tsx`

### Context

이 컴포넌트는 다음 책임을 가진다:

1. `sessionStorage['deep-fab-intro-seen']` 확인 후 없으면 재생 준비
2. Hero Intro DOM 존재 여부로 타이밍 분기:
   - Hero 있음: `deep-hero-dismissed` 이벤트 대기 (fallback 10초 타이머)
   - Hero 없음: mount 후 800ms
3. `prefers-reduced-motion` 감지 후 분기
4. `document.visibilityState`가 hidden이면 visible 될 때까지 재생 지연
5. 재생 시작 시 storage 기록, 타임라인 종료 후 stage를 idle로 되돌려 DOM 제거
6. 아이콘 3개 렌더: Sun, Moon, 언어("가"/"A")

각 아이콘은 FAB 중심 기준 극좌표(angle, radius)로 궤도 배치. `polar()` 유틸로 CSS 변수 주입.

### Steps

- [ ] **Step 3.1: 파일 생성 + 기본 스캐폴드**

`components/layout/SettingsFabIntro.tsx`에 다음 내용으로 생성:

```tsx
'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'deep-fab-intro-seen'
const HERO_DIALOG_SELECTOR = '[aria-label="DEEP 소개"]'
const HERO_DISMISSED_EVENT = 'deep-hero-dismissed'

const DELAY_AFTER_HERO_MS = 1200
const DELAY_DEFAULT_MS = 800
const HERO_FALLBACK_MS = 10000

const ORBIT_DURATION_MS = 1600
const STATIC_DURATION_MS = 2100

const ORBIT_RADIUS_DESKTOP = 56
const ORBIT_RADIUS_MOBILE = 40
const START_RADIUS_DESKTOP = 80
const START_RADIUS_MOBILE = 56
const MOBILE_BREAKPOINT = 375

type Stage = 'idle' | 'playing'

interface OrbitTarget {
  key: 'sun' | 'moon' | 'lang'
  angleDeg: number
}

const ORBIT_TARGETS: readonly OrbitTarget[] = [
  { key: 'sun',  angleDeg: -90 },
  { key: 'lang', angleDeg: 150 },
  { key: 'moon', angleDeg: 30  },
]

function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius }
}

export function SettingsFabIntro() {
  const { lang } = useTranslation()
  const [stage, setStage] = useState<Stage>('idle')
  const [reducedMotion, setReducedMotion] = useState(false)

  if (stage !== 'playing') return null
  return null
}
```

- [ ] **Step 3.2: type-check**

```bash
pnpm type-check
```

Expected: 통과. 아직 import된 Moon/Sun/cn/lang이 사용되지 않아 lint warning이 있을 수 있지만 type-check는 통과.

- [ ] **Step 3.3: 세션 게이트 + 타이밍 결정 useEffect 추가**

`const [reducedMotion, setReducedMotion] = useState(false)` 다음, `if (stage !== 'playing')` 전에 추가:

```tsx
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
    } catch {
      return
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)

    let cleanupFns: Array<() => void> = []
    const addCleanup = (fn: () => void) => cleanupFns.push(fn)

    const start = () => {
      if (document.visibilityState !== 'visible') {
        const onVisible = () => {
          if (document.visibilityState === 'visible') {
            document.removeEventListener('visibilitychange', onVisible)
            begin()
          }
        }
        document.addEventListener('visibilitychange', onVisible)
        addCleanup(() => document.removeEventListener('visibilitychange', onVisible))
        return
      }
      begin()
    }

    const begin = () => {
      try {
        if (sessionStorage.getItem(STORAGE_KEY)) return
        sessionStorage.setItem(STORAGE_KEY, String(Date.now()))
      } catch {
        return
      }
      setStage('playing')
    }

    const schedule = (delayMs: number) => {
      const id = window.setTimeout(() => start(), delayMs)
      addCleanup(() => window.clearTimeout(id))
    }

    const heroVisible = document.querySelector(HERO_DIALOG_SELECTOR)
    if (heroVisible) {
      const onDismissed = () => schedule(DELAY_AFTER_HERO_MS)
      window.addEventListener(HERO_DISMISSED_EVENT, onDismissed, { once: true })
      addCleanup(() => window.removeEventListener(HERO_DISMISSED_EVENT, onDismissed))
      const fallbackId = window.setTimeout(() => {
        window.removeEventListener(HERO_DISMISSED_EVENT, onDismissed)
        schedule(DELAY_AFTER_HERO_MS)
      }, HERO_FALLBACK_MS)
      addCleanup(() => window.clearTimeout(fallbackId))
    } else {
      schedule(DELAY_DEFAULT_MS)
    }

    return () => {
      for (const fn of cleanupFns) fn()
      cleanupFns = []
    }
  }, [])
```

- [ ] **Step 3.4: 재생 종료 타이머 useEffect 추가**

위 useEffect 다음에 추가:

```tsx
  useEffect(() => {
    if (stage !== 'playing') return
    const duration = reducedMotion ? STATIC_DURATION_MS : ORBIT_DURATION_MS
    const id = window.setTimeout(() => setStage('idle'), duration)
    return () => window.clearTimeout(id)
  }, [stage, reducedMotion])
```

- [ ] **Step 3.5: 화면 크기별 반경 계산 훅 추가**

두 번째 useEffect 다음에 추가:

```tsx
  const [radii, setRadii] = useState({ orbit: ORBIT_RADIUS_DESKTOP, start: START_RADIUS_DESKTOP })

  useEffect(() => {
    if (stage !== 'playing') return
    const compute = () => {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT
      setRadii({
        orbit: isMobile ? ORBIT_RADIUS_MOBILE : ORBIT_RADIUS_DESKTOP,
        start: isMobile ? START_RADIUS_MOBILE : START_RADIUS_DESKTOP,
      })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [stage])
```

- [ ] **Step 3.6: 렌더 분기 작성**

`if (stage !== 'playing') return null` 줄을 아래 블록으로 교체:

```tsx
  if (stage !== 'playing') return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[var(--z-fab-intro)]"
    >
      {!reducedMotion && (
        <span className="absolute inset-0 rounded-xl border-2 border-foreground/40 animate-[fab-ring-pulse_1.6s_cubic-bezier(0.22,1,0.36,1)_forwards]" />
      )}
      {ORBIT_TARGETS.map((target, index) => {
        const end = polar(target.angleDeg, radii.orbit)
        const start = polar(target.angleDeg, radii.start)
        return (
          <OrbitIcon
            key={target.key}
            startX={start.x}
            startY={start.y}
            endX={end.x}
            endY={end.y}
            delayMs={index * 60}
            reducedMotion={reducedMotion}
          >
            {target.key === 'sun' && <Sun className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />}
            {target.key === 'moon' && <Moon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />}
            {target.key === 'lang' && (
              <span
                className={cn(
                  'text-[14px] font-bold leading-none',
                  lang === 'en' ? 'font-mono' : 'font-sans',
                )}
              >
                {lang === 'ko' ? '가' : 'A'}
              </span>
            )}
          </OrbitIcon>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3.7: OrbitIcon 내부 컴포넌트 추가**

`SettingsFabIntro` 함수 닫는 중괄호 바로 다음에 추가:

```tsx
interface OrbitIconProps {
  startX: number
  startY: number
  endX: number
  endY: number
  delayMs: number
  reducedMotion: boolean
  children: ReactNode
}

function OrbitIcon({
  startX,
  startY,
  endX,
  endY,
  delayMs,
  reducedMotion,
  children,
}: OrbitIconProps) {
  // CSS 변수 주입은 동적 좌표이므로 inline style로만 처리.
  // 나머지는 전부 Tailwind 유틸리티로 옮김 (CLAUDE.md §5 인라인 style 최소화).
  const style: CSSProperties = {
    ['--start-x' as string]: `${startX}px`,
    ['--start-y' as string]: `${startY}px`,
    ['--end-x' as string]: `${endX}px`,
    ['--end-y' as string]: `${endY}px`,
    animationDelay: `${delayMs}ms`,
  }

  const animationClass = reducedMotion
    ? 'animate-[fab-orbit-static_2.1s_cubic-bezier(0.22,1,0.36,1)_forwards]'
    : 'animate-[fab-orbit-full_1.6s_linear_forwards]'

  return (
    <span
      className={cn(
        'absolute left-1/2 top-1/2 -ml-[15px] -mt-[15px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-border',
        animationClass,
      )}
      style={style}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 3.8: type-check 및 lint**

```bash
pnpm type-check
pnpm lint
```

Expected: 통과.

- [ ] **Step 3.9: Commit**

```bash
git add components/layout/SettingsFabIntro.tsx
git commit -m "$(cat <<'EOF'
feat(settings-fab): add SettingsFabIntro orbit preview component

Session-gated one-shot animation: Sun, Moon, and current-language
glyph enter on a 56px orbit around the FAB, hold briefly, then get
absorbed into the button. Triggers 1200ms after deep-hero-dismissed
when HeroIntro is present, or 800ms after mount otherwise. Honors
prefers-reduced-motion with a static fade variant and shrinks the
orbit on <=375px screens. Guards against tab-hidden playback via
visibilitychange.
EOF
)"
```

---

## Task 4: Wire SettingsFabIntro into SettingsFab

### Files
- Modify: `components/layout/SettingsFab.tsx`

### Context

현재 `SettingsFab`는 `<>...</>` fragment로 `SettingsPanel`과 `<button>`을 나란히 렌더한다. 버튼 자체에 `fixed bottom-6 right-6`이 붙어있어서 FAB 위치 결정 역할을 한다.

`SettingsFabIntro`는 FAB 중심 기준 `absolute inset-0`로 배치되어야 하므로, 버튼을 wrapper `div`로 감싸고 wrapper에 position fixed를 올린다. 버튼은 wrapper 내부에서 `relative h-full w-full`로 위치만 채운다. Intro는 wrapper의 `inset-0`에 absolute.

현재 코드:

```tsx
return (
  <>
    <SettingsPanel open={open} onClose={handleClose} />
    <button
      type="button"
      onClick={handleToggle}
      className="fixed bottom-6 right-6 z-[var(--z-fab)] flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-transform hover:scale-105"
      aria-label={t('settings.open')}
    >
      <Settings ... />
    </button>
  </>
)
```

### Steps

- [ ] **Step 4.1: `SettingsFabIntro` import 추가**

파일 상단 import 블록에 추가:

```tsx
import { SettingsFabIntro } from './SettingsFabIntro'
```

- [ ] **Step 4.2: wrapper 구조 적용**

`return (...)` 블록을 아래로 교체:

```tsx
  return (
    <>
      <SettingsPanel open={open} onClose={handleClose} />
      <div className="fixed bottom-6 right-6 z-[var(--z-fab)] h-12 w-12">
        <button
          type="button"
          onClick={handleToggle}
          className="relative h-full w-full rounded-xl bg-foreground text-background shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-transform hover:scale-105 flex items-center justify-center"
          aria-label={t('settings.open')}
        >
          <Settings
            className="h-[22px] w-[22px] transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[60deg]"
            style={{ transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </button>
        <SettingsFabIntro />
      </div>
    </>
  )
```

변경점 요약:
- `<button>`의 `fixed bottom-6 right-6 z-[var(--z-fab)] flex h-12 w-12`가 wrapper `div`로 이동
- `<button>`은 `relative h-full w-full`로 wrapper 내 공간을 채움
- `<SettingsFabIntro />`가 wrapper 내부 button 뒤에 렌더됨 (동일 stacking context 내 DOM 순서로 button 위에 그려지지만 `pointer-events-none`으로 클릭은 button에 전달)

- [ ] **Step 4.3: type-check 및 lint**

```bash
pnpm type-check
pnpm lint
```

Expected: 통과.

- [ ] **Step 4.4: Commit**

```bash
git add components/layout/SettingsFab.tsx
git commit -m "$(cat <<'EOF'
feat(settings-fab): mount SettingsFabIntro inside FAB wrapper

Wraps the FAB button in a positioning div so SettingsFabIntro can
sit absolute inset-0 relative to the FAB center. Button moves to
relative h-full w-full inside the wrapper. Intro overlay is
pointer-events-none so clicks pass through to the button.
EOF
)"
```

---

## Task 5: Manual verification and build

### Files
- No code changes, verification only

### Context

Spec의 manual checklist 전체 수행. 하나라도 실패하면 해당 Task로 되돌아가서 수정.

Dev 서버 규칙(CLAUDE.md §0): `PORT=3010 pnpm dev`를 백그라운드로. 접속은 `http://blog.localhost:3010/`.

### Steps

- [ ] **Step 5.1: Dev 서버 가동 확인**

```bash
lsof -nP -iTCP:3010 -sTCP:LISTEN
```

Listen 중이 아니면 백그라운드로:

```bash
PORT=3010 pnpm dev
```

(Bash `run_in_background: true`로)

- [ ] **Step 5.2: 신규 세션 / 홈 시나리오**

브라우저 DevTools Application 탭에서 `http://blog.localhost:3010/` 도메인의 sessionStorage 전체 삭제 후 새로고침.

확인:
- Hero Intro 재생됨
- 4단계 + dismissal 스크롤 → Hero fade out
- Hero 사라진 후 약 1.2초 뒤 FAB 주변에 Sun/Moon/언어 3 아이콘이 궤도 진입 → 홀드 → 흡수
- 애니메이션 종료 후 sessionStorage에 `deep-fab-intro-seen` 타임스탬프 기록 확인
- FAB 클릭으로 SettingsPanel 정상 open

Expected: 모두 통과.

- [ ] **Step 5.3: 신규 세션 / 포스트 직접 유입 시나리오**

sessionStorage 전체 삭제 후 포스트 URL 직접 접근. 예: `http://blog.localhost:3010/posts/<slug>`

확인:
- Hero Intro 재생 안 됨
- 페이지 mount 후 약 0.8초 뒤 FAB 주변 Orbit 재생
- storage에 `deep-fab-intro-seen` 기록

Expected: 모두 통과.

- [ ] **Step 5.4: 재방문 세션 시나리오**

sessionStorage에 이미 `deep-fab-intro-seen`이 있는 상태에서 홈과 포스트 페이지를 각각 새로고침.

Expected: Orbit 전혀 재생 안 됨. FAB 클릭은 정상 작동.

- [ ] **Step 5.5: 언어 상태 반영 확인**

sessionStorage 삭제 후 DevTools의 localStorage에서 `deep-settings`를 `{"language":"ko",...}` / `{"language":"en",...}`로 각각 설정 후 새로고침.

확인:
- `language: 'ko'` → 언어 아이콘 자리에 "가" 렌더
- `language: 'en'` → 언어 아이콘 자리에 "A" 렌더

Expected: 정확히 반영.

- [ ] **Step 5.6: Reduced motion 시나리오**

macOS: 시스템 설정 > 손쉬운 사용 > 디스플레이 > 동작 줄이기 활성화 (또는 Chrome DevTools Rendering 패널에서 Emulate CSS media feature `prefers-reduced-motion: reduce` 선택).

sessionStorage 삭제 후 홈 새로고침.

확인:
- 세 아이콘이 최종 궤도 위치에 정적으로 페이드인 → 약 1.5초 홀드 → 페이드아웃
- Ring pulse 없음
- 궤도 이동/흡수 애니메이션 없음

Expected: 정적 변형 재생.

- [ ] **Step 5.7: 모바일 375px 시나리오**

Chrome DevTools Device toolbar에서 iPhone SE(375×667) 모드로 전환. sessionStorage 삭제 후 홈 새로고침.

확인:
- 궤도 반경이 축소(40px)되어 FAB 주변 영역 밖으로 overflow하지 않음
- 아이콘 3개가 시각적으로 FAB과 일관

Expected: 모바일에서도 자연스럽게 재생.

- [ ] **Step 5.8: 라이트/다크 시나리오**

`useTheme()` 토글로 라이트/다크 전환 후 sessionStorage 삭제하고 각각 시나리오 반복.

확인:
- 라이트/다크 모두 아이콘 가독성 충분
- Ring 색상이 배경과 충돌하지 않음(`border-foreground/40`이라 자동 반전됨)

Expected: 두 모드 모두 자연스러움.

- [ ] **Step 5.9: FAB 클릭 방해 없음 확인**

sessionStorage 삭제 후 홈 새로고침. Orbit 재생 중(0~1.6초 사이)에 FAB을 빠르게 클릭.

Expected: SettingsPanel이 정상 open. Orbit은 그대로 재생되거나 자연스럽게 끝남.

- [ ] **Step 5.10: `pnpm build` 전체 빌드 확인**

```bash
pnpm build
```

Expected: 전 페이지 빌드 성공. Velite 키워드 맵 생성, Next 빌드, 타입체크 모두 통과.

- [ ] **Step 5.11: 회귀 체크**

다음 기존 기능들이 영향받지 않았는지 확인:
- Hero Intro 4단계 정상 진행(dismiss ref 가드 기존 동작 유지)
- `SettingsPanel` 내부 테마/언어/폰트 토글 정상 작동
- 헤더 GitHub/ThemeToggle 정상 렌더 및 클릭

Expected: 전부 회귀 없음.

- [ ] **Step 5.12: 검증 완료 요약 Commit (선택)**

별도 코드 변경이 없으므로 별도 commit은 만들지 않음. 단 중간에 튜닝(예: 궤도 반경 조정)이 필요했다면 해당 변경을 단일 commit으로 묶어 남김:

```bash
git add -p  # 필요한 부분만 선택
git commit -m "tune(settings-fab-intro): adjust orbit radius for visual balance"
```

---

## Final: PR readiness

- [ ] **F.1: 전체 변경 요약 확인**

```bash
git log --oneline -5
```

Expected: 4~5개 commit (css, hero-intro, intro-component, fab-wire, optional tune)이 각각 작은 scope로 분리됨.

- [ ] **F.2: Spec과 plan 동기 확인**

Spec의 "Implementation Design > Files" 목록과 실제 변경 파일이 일치하는지 확인:

```bash
git diff --name-only main...HEAD
```

Expected: `app/globals.css`, `components/blog/HeroIntro.tsx`, `components/layout/SettingsFab.tsx`, `components/layout/SettingsFabIntro.tsx` 네 파일만 변경 (plan 자체 제외).

- [ ] **F.3: PR 생성 여부 확인**

이 시점에서 사용자에게 PR 생성 여부 질의. 자동으로 push/PR 만들지 않음(CLAUDE.md §5: 파괴적 git 명령 + 공유 상태 변경은 사용자 확인 전 금지).

---

## Rollback

이 feature에 치명적 회귀(예: FAB 클릭 불가, Hero Intro 무한 지속)가 발견되면:

```bash
git revert <commit-sha>  # Task 4 커밋을 우선 revert (intro mount 제거)
```

`SettingsFabIntro.tsx` 파일 자체 삭제 및 `globals.css`의 키프레임 제거는 선택적. 파일이 남아있어도 mount되지 않으면 빌드/런타임 영향 없음.
