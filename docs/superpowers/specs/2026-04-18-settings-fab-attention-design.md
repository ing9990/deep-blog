---
title: Settings FAB Attention (Orbit Preview Intro)
date: 2026-04-18
status: draft
---

# Settings FAB Attention — Orbit Preview Intro

## Problem

우측 하단 `SettingsFab`(톱니 아이콘, `bottom-6 right-6`)은 테마(Sun/Moon)와 언어 토글을 여는 유일한 진입점이 되지만, 현재 상태로는 **"이 버튼을 누르면 테마·언어를 바꿀 수 있다"** 는 기능성을 외부로 드러내지 않는다. 방문자는 FAB의 존재를 인지하더라도 용도를 추측하지 못하거나 아예 무시할 가능성이 높다.

## Goal

세션당 한 번, FAB 주변에 짧은 시각 프리뷰를 재생해서:

- FAB이 눌러볼 가치가 있는 인터랙티브 요소임을 인식시키고
- 클릭 시 무엇이 가능한지(테마 2종, 언어 1종)를 **텍스트 없이** 은유적으로 전달한다.

재방문자에게는 거슬리지 않아야 하므로 세션 1회 단방향이다. Hero Intro와 동일한 세션 게이트 패턴을 유지한다.

## Non-Goals

- FAB 자체의 위치·크기·색상 변경
- 설정 패널(`SettingsPanel`) 내부 UI 변경
- 테마 토글의 `system` 옵션 제거(별도 작업, 이전 대화에서 이미 분리됨)
- 언어 토글 버튼을 헤더로 옮기는 작업(별도 작업)
- i18n 메시지 추가(이 효과는 텍스트를 렌더하지 않음)

## UX Design

### 1. Trigger conditions

세션당 1회. `sessionStorage['deep-fab-intro-seen']`이 없을 때만 실행되고, 재생 종료 시 기록.

Hero Intro가 있는 인덱스 홈의 첫 방문 시나리오와 그 외 페이지로 바로 진입하는 시나리오를 모두 자연스럽게 처리한다.

**`SettingsFabIntro` mount 시 결정 로직**:

```
if (sessionStorage['deep-fab-intro-seen']) return       // 이미 봤음

if (document.querySelector('[aria-label="DEEP 소개"]')) {
  // Hero Intro가 현재 화면에 있음
  listen 'deep-hero-dismissed' (window CustomEvent)
    → 1200ms 지연 후 재생
  fallback: 10s 후에도 이벤트 없으면 재생
} else {
  // Hero가 없거나 이미 종료된 상태
  800ms 지연 후 재생
}
```

재생 시작 직전에도 storage 재확인하여 race condition(Hero dismissal 이벤트와 탭 뒤로가기 등이 겹치는 경우)에 안전하게 no-op.

### 2. Orbit animation

FAB 주변으로 세 아이콘이 궤도를 타고 진입 → 짧게 정지 → FAB 안으로 흡수.

**타임라인 (총 ~1.6초)**:

| 구간 | 시간 (ms) | 동작 |
|------|-----------|------|
| 진입 | 0–500 | 반경 80px 바깥에서 반경 56px 삼각형 배치로 이동 + 페이드인. 아이콘별 60ms stagger |
| 홀드 | 500–1000 | 궤도 위치에서 정지(인식 시간 500ms) |
| 흡수 | 1000–1400 | FAB 중심으로 scale 1→0 + translate + 페이드아웃, ease-in |
| Ring pulse | 0–1600 | FAB 자체 주변 ring 1회 pulse (scale 1→1.6, opacity 0.3→0) |

**아이콘 삼각형 배치** (FAB 중심 기준, 0° = 상단, 시계방향):

- Sun: -90° (상단)
- "가/A" 언어 아이콘: +150° (좌하)
- Moon: +30° (우상)

삼각형 배치는 세 개의 요소가 균등하게 주목되도록 하는 고전적 레이아웃이다.

### 3. Icon composition

- **Sun**, **Moon**: `lucide-react` 기본 아이콘, 18×18
- **언어 아이콘**: 텍스트 문자 렌더링
  - `lang === 'ko'` → `"가"` (Paperlogy, `var(--font-sans)`)
  - `lang === 'en'` → `"A"` (JetBrains Mono, `var(--font-mono)`)
- 세 아이콘 모두 30×30 원형 컨테이너(`bg-background`, `shadow-sm`, `border border-border`) 위에 올려서 FAB과 시각적 일관성 유지

`useTranslation().lang`을 통해 현재 언어 상태를 정직하게 반영한다. 즉 "현재 이 상태를 바꿀 수 있다"는 메시지.

### 4. Accessibility & edge cases

- `prefers-reduced-motion: reduce` 감지 시: 궤도 이동·흡수 애니메이션 전부 skip. 대신 **세 아이콘을 최종 궤도 위치에 정적으로 페이드인(300ms) → 1500ms 홀드 → 페이드아웃(300ms)**. 기능 프리뷰는 유지하되 움직임만 제거
- Orbit 요소는 전부 `aria-hidden="true"` + `pointer-events-none`
- FAB 자체 `aria-label`과 포커스 동작은 변경 없음
- `sessionStorage` 접근 실패(private mode, sandboxed iframe): 조용히 skip, intro 비활성
- 모바일 `≤375px`: 궤도 반경 56→40px, 바깥 시작점 80→56px
- `document.hidden` 시 타이머 경과: 재생 시점에 `document.visibilityState !== 'visible'`이면 `visibilitychange` 이벤트로 visible 될 때까지 지연

### 5. Session gate behavior

| 시나리오 | Hero 재생 | FAB Intro 재생 |
|----------|-----------|----------------|
| 신규 세션, 홈 첫 방문 | O | Hero dismissal 후 1200ms |
| 신규 세션, 포스트 직접 유입 | X | mount 후 800ms |
| Hero 봤던 세션, 포스트 이동 | X (이미 seen) | 같은 세션 내라면 이미 재생됨, skip |
| 재방문 세션 | X | X (storage 기록) |

Hero와 FAB Intro는 독립 storage 키를 사용하되 **같은 세션 안에서는 Hero 종료 이후에만 FAB Intro가 재생되는** 순서 보장을 한다.

## Implementation Design

### Files

**신규**:

- `components/layout/SettingsFabIntro.tsx`
  - Client component
  - props: `targetRef?: React.RefObject<HTMLButtonElement>` (FAB 위치 기준점), 또는 FAB 내부에 absolute 포지셔닝으로 배치
  - 상태: `stage: 'idle' | 'playing'`
  - 타이밍 결정 로직(섹션 1), reduced-motion 감지, visibility 지연 내장

**수정**:

- `components/layout/SettingsFab.tsx`
  - `<SettingsFabIntro />`를 FAB 엘리먼트와 같은 컨테이너에 추가
  - Intro가 FAB 위치를 참조할 수 있도록 wrapper 구조 조정

- `components/blog/HeroIntro.tsx`
  - `sessionStorage.setItem(STORAGE_KEY, ...)` 바로 뒤에 `window.dispatchEvent(new CustomEvent('deep-hero-dismissed'))` 호출(2줄 추가)
  - 기존 dismiss ref 가드와 충돌 없음(한 번만 실행되는 블록 내부)

- `app/globals.css`
  - 키프레임: `fab-orbit-in`, `fab-orbit-absorb`, `fab-ring-pulse`, `fab-orbit-static` (reduced-motion 분기용)
  - 홀드 구간은 별도 키프레임 없이 `animation-delay`로 해결
  - 토큰: `--z-fab-intro: calc(var(--z-fab) - 1)`
  - `prefers-reduced-motion: reduce` 미디어 쿼리 블록에서 Orbit 키프레임 대체

### Rendering structure

```
<div class="fixed bottom-6 right-6 z-[var(--z-fab)]">   ← 기존 FAB 자리
  <SettingsFabIntro />          ← absolute inset-0, pointer-events-none
  <SettingsPanel ... />
  <button class="FAB button">   ← 기존 버튼
    <Settings />
  </button>
</div>
```

Intro 요소들은 FAB 중심을 기준으로 CSS `translate()`로 배치된다. FAB 버튼 자체와 겹치지만 `pointer-events-none`이라 클릭 방해가 없다.

### Keyframes (globals.css 추가분 — 구현 시 세부 튜닝)

```css
@keyframes fab-orbit-in {
  from { transform: translate(var(--start-x), var(--start-y)) scale(0.6); opacity: 0; }
  to   { transform: translate(var(--end-x), var(--end-y)) scale(1); opacity: 1; }
}
@keyframes fab-orbit-absorb {
  from { transform: translate(var(--end-x), var(--end-y)) scale(1); opacity: 1; }
  to   { transform: translate(0, 0) scale(0); opacity: 0; }
}
@keyframes fab-ring-pulse {
  from { transform: scale(1); opacity: 0.3; }
  to   { transform: scale(1.6); opacity: 0; }
}
```

각 아이콘에 `--start-x/y`, `--end-x/y` CSS 변수를 inline style로 주입하여 삼각형 좌표를 계산한다(JavaScript 계산은 최소화, 주로 CSS).

## Testing

### Manual verification (dev 서버)

- [ ] **신규 세션 / 홈**: Hero Intro 통과 → 1.2초 후 FAB 주변 Orbit 재생 → 흡수 완료 → `sessionStorage['deep-fab-intro-seen']` 확인
- [ ] **신규 세션 / 포스트 직접 유입**(`/posts/<slug>`): mount 후 0.8초 후 재생
- [ ] **재방문 세션 / 홈**: Orbit 재생 안 됨
- [ ] **언어 상태 반영**: `lang === 'ko'` → "가" 렌더 / `lang === 'en'` → "A" 렌더
- [ ] **reduced-motion**: OS 설정 on 상태에서 Orbit 대신 ring pulse 1회만 재생
- [ ] **모바일 375px**: 궤도 반경 축소, 레이아웃 overflow 없음
- [ ] **라이트/다크**: 아이콘 가독성 및 ring 색상 유효
- [ ] **FAB 클릭 방해 없음**: Orbit 재생 중 FAB 클릭 시 패널 정상 open

### Unit / 자동화

- 별도 유닛 테스트는 작성하지 않음(Vitest 기본 env = node, 이 효과는 DOM + timer 의존적)
- 기존 회귀 방지: `pnpm type-check` + `pnpm lint` + `pnpm build` 통과

## Rollout

단일 PR로 구현. feature flag 없이 바로 반영.

## Open Questions

- 궤도 반경 56px가 FAB(48px, `h-12 w-12`) 대비 시각적으로 적절한지는 실제 브라우저에서 튜닝(구현 단계에서 확인)
- `SettingsProvider`는 초기 렌더 시 `DEFAULT_SETTINGS(language: 'en')`을 반환하고 mount 직후 `loadSettings()`로 localStorage 값을 반영한다. `SettingsFabIntro`는 mount 후 최소 800ms 후 재생이므로 `lang` flicker 우려는 없지만, 첫 렌더에서 "A"가 아주 짧게 보였다가 "가"로 바뀌는 visual glitch가 있다면 `useEffect`로 lang 확정 후 재생 시작을 한 번 더 지연시킴
- Hero Intro가 활성화된 상태에서 페이지를 새로고침하면 Hero는 이미 seen이라 재생되지 않고, FAB Intro도 이미 seen이면 둘 다 skip — 의도한 동작
