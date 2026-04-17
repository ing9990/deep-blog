# Style Token System Design

- **Date:** 2026-04-18
- **Status:** Approved (pending user review)
- **Owner:** Claude (with ing9990)
- **Branch target:** feature/language-settings → main (via 4 sequential PRs)

## Problem

DEEP 블로그 전역에 스타일 하드코딩이 산재해 유지보수가 어렵다. 특히:

- 타이포그래피: `text-[17px]`, `text-[11px]`, `text-xs/sm/base/…` 등 177개 arbitrary 값 + 40개 Tailwind scale 직접 참조가 40+ 컴포넌트에 흩어져 있음
- `app/globals.css`에 67개 `px` 리터럴
- "검색창 폰트만 1px 줄이기" 같은 요청 시 4~8개 파일 탐색·수정 필요
- 사용자 조정 가능한 Font-size (`설정 > 폰트 > 작게/보통/크게`) 요구가 현재 구조로는 불가능

## Goals

1. **단일 소스 토큰 시스템** — 타이포/스페이스/컬러 토큰을 `app/globals.css`에 중앙화
2. **사용자 조정 가능한 font-size** — Settings Panel에 3-step (작게/보통/크게) 추가, 기본 "보통"
3. **재발 방지** — ESLint + stylelint로 arbitrary 리터럴 차단
4. **점진 마이그레이션** — 4개 thematic PR로 회귀 위험 최소화
5. **장기 유지보수 우선** — 단기 편의보다 토큰 의도 명확성·검증 가능성·확장성 우선

## Non-Goals

- 비주얼라이제이션 내부 SVG 좌표·애니메이션 타이밍·stepper 로직 상수 토큰화 (`components/visualizations/**` 파일 내부는 제외 — chrome 컴포넌트 `VisualContainer`·`StepController`·`SpeedSlider`만 포함)
- Tailwind 기본 spacing 스케일(`p-4`, `gap-2`, `mt-8`) 대체 — 계속 사용
- Shiki 생성 inline style 통합
- 새로운 breakpoint 도입 (기본 `md: 768px`만 유지)

## Decisions (Brainstorm 합의)

| 항목 | 결정 | 근거 |
|---|---|---|
| 스코프 | Typography + Color + Spacing | 하드코딩 전 영역, 컬러는 consolidation 위주 |
| 네이밍 | Hybrid (primitives + semantic alias) | 확장성 + 의미 명확성 |
| 비주얼라이제이션 | 로직 상수 제외, chrome 포함 | 애니메이션 회귀 없이 외곽 일관성 |
| Enforcement | ESLint + stylelint | `pnpm lint` 레벨 차단 |
| 반응형 | Semantic alias에서 media query | 사용처 단순화 |
| Font-scale | Primitive에 `calc(* var(--text-scale))` | 한 줄 변경으로 전체 스케일 |

## Architecture

### 단일 소스: `app/globals.css`

```
app/globals.css
├── @theme inline { }              # primitives (colors, fonts, radii, text, space, size)
├── :root { }                      # semantic aliases (light)
├── [data-theme="dark"] { }        # semantic alias dark overrides
├── @media (min-width: 768px) {
│     :root { }                    # 반응형 semantic 재정의 (md+)
│   }
├── html[data-font-size="small|normal|large"] { }   # --text-scale 조정
├── @layer base { }                # html/body defaults
└── .prose-kr { }                  # MDX prose (토큰 참조로 리팩토링)
```

**원칙:** 새 CSS 파일 만들지 않음. Tailwind v4 `@theme` 리졸버 스코프 유지.

### 문서: `docs/design-tokens.md`

- Primitives 전체 리스트
- Semantic alias 매핑 표
- 사용 예 (`text-[length:var(--text-body)]` 등)
- 리터럴 허용 예외 정책

## Token Taxonomy

### 1. Typography Primitives

```css
@theme inline {
  /* font-size (scale multiplier 적용) */
  --text-2xs: calc(10px * var(--text-scale, 1));
  --text-xs:  calc(11px * var(--text-scale, 1));
  --text-sm:  calc(12px * var(--text-scale, 1));
  --text-md:  calc(13px * var(--text-scale, 1));
  --text-base: calc(15px * var(--text-scale, 1));
  --text-lg:  calc(17px * var(--text-scale, 1));
  --text-xl:  calc(19px * var(--text-scale, 1));
  --text-2xl: calc(22px * var(--text-scale, 1));
  --text-3xl: calc(24px * var(--text-scale, 1));

  /* line-height */
  --leading-tight: 1.2;
  --leading-snug: 1.4;
  --leading-normal: 1.6;
  --leading-relaxed: 1.75;

  /* font-weight */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
}
```

### 2. Typography Semantic Aliases (~25)

| 카테고리 | alias | 값 | 용도 |
|---|---|---|---|
| Body | `--text-body` | `var(--text-base)` → `var(--text-lg)` @md | MDX 본문 |
|  | `--text-body-sm` | `var(--text-md)` | 2차 텍스트 |
|  | `--text-meta` | `var(--text-sm)` | 날짜·읽기시간 |
|  | `--text-caption` | `var(--text-xs)` | 캡션·푸터 |
|  | `--text-hint` | `var(--text-2xs)` | ⌘K·kbd hint |
| Heading | `--text-h1` | `calc(28px * scale)` → `calc(32px * scale)` @md | 포스트 제목 |
|  | `--text-h2` | `var(--text-2xl)` → `var(--text-3xl)` @md | 섹션 |
|  | `--text-h3` | `calc(18px * scale)` → `var(--text-xl)` @md | 서브섹션 |
|  | `--text-h4` | `var(--text-lg)` | |
| Nav | `--text-menu` | `var(--text-lg)` | 로고·헤더 |
|  | `--text-nav-item` | `var(--text-md)` | 카테고리·TOC 링크 |
|  | `--text-nav-header` | `var(--text-xs)` | "ON THIS PAGE" 등 |
| Search | `--text-search-input` | `var(--text-base)` | 입력 |
|  | `--text-search-title` | `var(--text-md)` | 결과 제목 |
|  | `--text-search-summary` | `var(--text-sm)` | 스니펫 |
| Callout | `--text-callout-body` | `var(--text-base)` | |
|  | `--text-callout-label` | `var(--text-sm)` | NOTE/WARN 라벨 |
| Code | `--text-code-block` | `calc(13px * scale)` → `calc(14px * scale)` @md | Shiki 블록 |
|  | `--text-code-inline` | `0.9em` (비율 예외) | 인라인 |
| UI | `--text-button` | `var(--text-md)` | |
|  | `--text-badge` | `var(--text-xs)` | 태그·카테고리 chip |

### 3. Layout Dimension Tokens

```css
--layout-nav-width: 288px;
--layout-toc-width: 224px;
--layout-content-gap: 1.5rem;       /* mobile */
--layout-header-height: 64px;
--layout-sticky-offset: 5rem;
--layout-page-pad: 1rem;             /* mobile */
--layout-page-pad-md: 1.5rem;        /* md+ */
--layout-content-max: 46rem;
```

`DocShell` 3-col `[288px, 1fr, 224px]` 불변식 유지 — 리터럴만 토큰 참조로 교체.

### 4. Radius Tokens (확장)

```css
--radius: 0.5rem;  /* shadcn 기존 */
--radius-chip: calc(var(--radius) - 2px);
--radius-card: var(--radius);
--radius-panel: calc(var(--radius) + 2px);
```

### 5. Z-index Tokens (신규)

```css
--z-nav: 10;
--z-sticky: 20;
--z-overlay: 40;
--z-hero: 50;
--z-toast: 60;
```

### 6. Color Tokens (consolidation)

기존 유지: shadcn(`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, `--accent`, `--card`), DEEP(`--keyword`, `--keyword-bg`, `--code-inline-fg`, `--border-strong`, `--viz-*`)

신규:
```css
--state-info:    oklch(0.65 0.14 230);
--state-warn:    oklch(0.75 0.17 80);
--state-danger:  oklch(0.62 0.22 25);
--state-success: oklch(0.65 0.18 150);
--state-info-bg:    color-mix(in oklab, var(--state-info) 10%, var(--background));
--state-warn-bg:    color-mix(in oklab, var(--state-warn) 10%, var(--background));
--state-danger-bg:  color-mix(in oklab, var(--state-danger) 10%, var(--background));
--state-success-bg: color-mix(in oklab, var(--state-success) 10%, var(--background));
```

`[data-theme="dark"]`에서 OKLCH L 값 조정한 dark variant 제공.

## User-Adjustable Font Scale

### Mechanism

```css
html[data-font-size="small"]  { --text-scale: 0.92; }
html[data-font-size="normal"] { --text-scale: 1; }      /* 기본 */
html[data-font-size="large"]  { --text-scale: 1.10; }
```

모든 typography primitive 및 리터럴 heading/code 값이 `calc(Npx * var(--text-scale, 1))` 패턴 → multiplier 하나 변경으로 전역 스케일.

### SettingsProvider 확장

```ts
export type FontSize = 'small' | 'normal' | 'large'

export interface Settings {
  cardLayout: CardLayout
  language: Language
  fontSize: FontSize   // NEW
}

const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'timeline',
  language: 'en',
  fontSize: 'normal',  // 기본
}
```

- `normalizeFontSize()` validator 추가 (기존 normalize 패턴 재사용)
- `SettingsProvider` 내부 `useEffect`로 `document.documentElement.dataset.fontSize = settings.fontSize` 동기화

### SettingsPanel UI

기존 "테마" 섹션 아래 "폰트 크기" 섹션 추가. 3-버튼 그룹 (작게/보통/크게), `LAYOUT_OPTIONS` 패턴 재사용, active 스타일 `border-primary bg-accent`.

### FOUC 방지 (Pre-hydration)

`app/layout.tsx`에 pre-hydration inline script 삽입. `next-themes`가 쓰는 동일 패턴(`<script>` 태그로 React hydration 이전에 실행되어 `localStorage`에서 `deep-settings`를 읽고 `document.documentElement.dataset.fontSize`를 설정). SSR 안전. 구현 시 `next-themes`의 script 주입 방식 참조.

스크립트 내용 (개념):
```
try {
  const raw = localStorage.getItem('deep-settings');
  if (raw) {
    const s = JSON.parse(raw);
    if (s.fontSize === 'small' || s.fontSize === 'large' || s.fontSize === 'normal') {
      document.documentElement.dataset.fontSize = s.fontSize;
    }
  }
} catch {}
```

## Usage Examples

```tsx
// Before
<h2 className="text-[22px] md:text-[24px]">
<span className="text-[10px]">⌘K</span>
<aside className="w-[288px]">
<div className="sticky top-20 z-50">

// After
<h2 className="text-[length:var(--text-h2)]">
<span className="text-[length:var(--text-hint)]">⌘K</span>
<aside className="w-[var(--layout-nav-width)]">
<div className="sticky top-[var(--layout-sticky-offset)] z-[var(--z-hero)]">
```

```css
/* globals.css .prose-kr */
.prose-kr { font-size: var(--text-body); line-height: var(--leading-relaxed); }
.prose-kr h2 { font-size: var(--text-h2); }
```

## Literal Exceptions (허용)

1. `em` / `%` 상대 단위 (`.prose-kr h2 { margin-top: 3em }`)
2. `1px`, `2px` border width
3. `calc()` 내부 산술 (`calc(100vh - var(--layout-header-height))`)
4. `transparent`, `currentColor`, `inherit` 키워드
5. `color-mix()` 내부 `%` 값
6. 비주얼라이제이션 내부 SVG 좌표·애니메이션 값 (`components/visualizations/**`)
7. Shiki 생성 inline style
8. Primitive/semantic 정의 블록 자체 (`@theme inline`, `:root`, `[data-theme="dark"]`)

## Enforcement

### ESLint (`.eslintrc.json` 확장)

```json
{
  "extends": ["next/core-web-vitals", "plugin:tailwindcss/recommended"],
  "rules": {
    "no-restricted-syntax": ["error",
      { "selector": "Literal[value=/\\b(text|leading|tracking)-\\[(?!length:var\\()/]",
        "message": "Typography arbitrary 값 금지. --text-* 토큰 사용." },
      { "selector": "Literal[value=/\\b(w|h|min-w|min-h|max-w|max-h|top|bottom|left|right)-\\[\\d+px\\]/]",
        "message": "레이아웃 고정값은 --layout-* 토큰 사용." },
      { "selector": "Literal[value=/\\b(bg|text|border)-\\[#[0-9a-fA-F]+\\]/]",
        "message": "arbitrary hex color 금지. semantic 토큰 사용." },
      { "selector": "Literal[value=/\\bz-\\[?\\d+\\]?/]",
        "message": "z-index는 --z-* 토큰 사용." }
    ]
  },
  "overrides": [
    { "files": ["components/visualizations/**/*.tsx"],
      "rules": { "no-restricted-syntax": "off" } }
  ]
}
```

패키지: `eslint-plugin-tailwindcss` 추가.

### Stylelint (`.stylelintrc.json`)

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "declaration-property-value-disallowed-list": [{
      "font-size": ["/^\\d+px$/", "/^\\d+rem$/"],
      "line-height": ["/^[\\d.]+$/"],
      "color": ["/^#[0-9a-fA-F]+$/"],
      "background-color": ["/^#[0-9a-fA-F]+$/"],
      "z-index": ["/^\\d+$/"]
    }, {
      "ignore": ["inside-block"]
    }]
  },
  "overrides": [
    {
      "files": ["app/globals.css"],
      "customSyntax": "postcss",
      "rules": {
        "declaration-property-value-disallowed-list": [{
          "color": ["/^#[0-9a-fA-F]+$/"]
        }]
      }
    }
  ]
}
```

- `app/globals.css`는 토큰 정의 위치 → font-size/line-height/z-index 리터럴 허용 (primitive 정의가 리터럴이어야 하므로). hex color만 계속 금지 (OKLCH 권장).
- 나머지 `.css` 파일과 `className` 내부는 모든 규칙 적용.
- 정의 블록 내부 리터럴(`:root`, `[data-theme="dark"]`, `html[data-font-size="..."]`)이 모두 `app/globals.css`에 있어야 하므로 이 설계와 일관.

### `package.json` 스크립트

```json
{
  "scripts": {
    "lint": "next lint && stylelint 'app/**/*.css' 'components/**/*.css'",
    "lint:fix": "next lint --fix && stylelint --fix 'app/**/*.css'"
  }
}
```

## Migration Plan (4 PRs)

### PR1 — Typography + Font-size Settings

**추가:**
- `app/globals.css`: typography primitives + semantic aliases + `html[data-font-size]` 스케일 오버라이드 + `@media (min-width: 768px)` 재정의
- `SettingsProvider.tsx`: `fontSize` 필드, `normalizeFontSize`, `data-font-size` 동기화 effect
- `SettingsPanel.tsx`: 폰트 크기 섹션
- `app/layout.tsx`: pre-hydration inline script
- `components/mdx/components.tsx`: `fontSize` 관련 매핑 검토

**치환:** 전 `.tsx` (비주얼라이제이션 로직 파일 제외) `text-[Npx]`, `text-xs|sm|base|lg|xl|…` → `text-[length:var(--text-*)]` 또는 semantic alias

**검증:** Dev 서버에서 Settings → 작게/보통/크게 전환 → 9 조합(3 viewport × 3 scale)에서 **모든** UI 영역 동시 스케일. 1개라도 안 바뀌면 누락.

### PR2 — Spacing · Dimension 토큰

**추가:** `--layout-*`, `--radius-*`, `--z-*`
**치환:** `w-[288px]`, `w-[224px]`, `top-[calc(...)]`, `z-10|20|50`, arbitrary radius → 토큰 참조. 일반 Tailwind 스케일(`p-4`, `gap-2`) 유지
**검증:** `DocShell` 3-col 그리드 정렬, TOC sticky 오프셋, SearchDialog/HeroIntro overlay 모든 breakpoint 회귀 없음

### PR3 — Color 통합

**추가:** `--state-info|warn|danger|success` + `-bg` variants (light/dark)
**치환:** `Callout` 4 type의 raw palette (`text-amber-*` 등) → state 토큰. `bg-[#…]`, `text-[#…]`, `border-[#…]` arbitrary hex → semantic. `text-zinc-*`, `text-neutral-*` raw palette → shadcn semantic (다크 자동)
**검증:** Callout 4종 × light/dark 시각 검증

### PR4 — Enforcement + 문서

**추가:**
- `eslint-plugin-tailwindcss` + `.eslintrc` 확장
- `stylelint` + `stylelint-config-standard` + `.stylelintrc.json`
- `package.json` `lint` 스크립트 확장
- `docs/design-tokens.md` 레퍼런스
- **CLAUDE.md 업데이트 (사용자 명시 요구):**
  - §2 스택에 stylelint 추가
  - §4 검증 명령에 lint 확장 반영
  - §5 금지사항에 arbitrary `text-[Npx]` / `w-[Npx]` / `bg-[#…]` / `z-[N]` 항목
  - §6 불변식에 "primitive + semantic 하이브리드 토큰, scale multiplier, `html[data-font-size]` 컨벤션, Settings `fontSize` 기본값 'normal'" 항목

**검증:** `pnpm lint` green. 의도적 `text-[20px]` 삽입 시 fail 확인. 의도적 `font-size: 14px` (globals.css 외부) 삽입 시 fail 확인.

## Verification Matrix (모든 PR 공통)

### 자동 검증
```bash
pnpm type-check && pnpm lint && pnpm build
```

### 수동 스모크 (18 조합)
| viewport | light/dark | font-size | 확인 영역 |
|---|---|---|---|
| 375px | light | small/normal/large | 헤더·검색·Hero·카드·본문 |
| 768px | light/dark | small/normal/large | + DocShell 3-col·TOC |
| 1280px | light/dark | small/normal/large | + 카테고리 nav·키워드 링크 |

각 PR 완료 후 해당 PR 영향 축 중심으로 스모크.

### 회귀 체크리스트
- [ ] Hero Intro burst detector 정상 (CLAUDE.md §6 불변식)
- [ ] `.prose-kr` h2 구분선 단일 (이중 선 없음)
- [ ] Tabs 두 번째 탭 표시됨 (lazy reference 회귀 없음)
- [ ] IME 한글 조합 중 글자 사라짐 없음
- [ ] `next/image` width/height 유지
- [ ] 키워드 링크 popover 정상

## Rollback Strategy

- PR1 리버트 가능: 토큰 정의는 남겨두고 사용처만 리버트 (빈 primitive는 무해)
- PR4(enforcement)는 단독 리버트: 룰만 끔. 코드 자체는 토큰 참조 유지
- 각 PR 사이에서 빌드·배포 가능 상태 유지

## Out-of-Scope / Future Work

- `em`/`rem` 기반 typography로 접근성 강화 (현재 px multiplier 방식 유지)
- 추가 breakpoint (`lg: 1024px` 등) 도입 — 현재 수요 없음
- 컴포넌트별 토큰 override API (styled-components 스타일) — 현재 프로젝트 규모에 과잉
- Visual regression 자동화 테스트 (Chromatic 등) — 수동 스모크로 충분

## References

- CLAUDE.md §5 (금지), §6 (변경 금지 불변식)
- `app/globals.css` 기존 `@theme inline` 블록
- `components/providers/SettingsProvider.tsx` 기존 패턴
- Tailwind v4 `@theme` docs
- shadcn token convention
