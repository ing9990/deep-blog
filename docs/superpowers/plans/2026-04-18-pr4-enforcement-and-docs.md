# PR4: Enforcement + Docs (Final) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock in the token system built across PR1–PR3 with automated enforcement (ESLint `no-restricted-syntax` + Stylelint) and complete the documentation (updated CLAUDE.md §2/§4/§5/§6, new `docs/design-tokens.md` reference). Close the style-token-system project so future code cannot silently reintroduce hardcoded values.

**Architecture:** Pragmatic enforcement stack — no new ESLint plugin (avoids config conflicts observed in worktree and Next.js 16 `next lint` deprecation path). Uses ESLint built-in `no-restricted-syntax` with regex patterns against `Literal` AST nodes to catch `text-[Npx]`, `z-[N]` / `z-50` / `z-10`, `bg-[#...]`, `rounded-[Npx]`, `shadow-[0_...rgba...]` classname hardcodes. Stylelint (independent CLI) catches CSS-side hardcodes in `.prose-kr` and other rules (not `@theme inline`/`:root`/`[data-theme="dark"]`/`html[data-font-size=...]` primitive blocks). `components/visualizations/**` (except `common/`) whitelisted for SVG-coordinate logic exceptions.

**Tech Stack:** ESLint 9 (already installed, extending current `.eslintrc.json` with `rules.no-restricted-syntax` — no new plugin) + `stylelint` + `stylelint-config-standard` (new deps). No runtime impact.

---

## Prerequisites

- Worktree at `.worktrees/pr4-enforcement-docs` on branch `feature/pr4-enforcement-docs` (branched from `feature/style-token-system` @ `7a5d2e9`).
- Baseline: `pnpm type-check` green, Velite build succeeds.
- Prior PRs (PR1 typography, PR2 spacing/dimension, PR3 shadows) already merged into integration branch.
- Reference spec: `docs/superpowers/specs/2026-04-18-style-token-system-design.md` (Section "Enforcement" — partially superseded by this plan's pragmatic scope).

## File Structure

### Created
- `.stylelintrc.json` — Stylelint config.
- `docs/design-tokens.md` — Token reference document (all PR1/PR2/PR3 tokens, exceptions, usage examples).

### Modified
- `.eslintrc.json` — add `no-restricted-syntax` rules + `overrides` whitelisting `components/visualizations/{BTreeInsert,QuickSort,…}`.
- `package.json` — add `stylelint` + `stylelint-config-standard` devDependencies; extend `lint` / `lint:fix` scripts.
- `CLAUDE.md` — update §2 (stack), §4 (commands), §5 (prohibitions), §6 (invariants).

### Out of Scope
- ESLint v9 flat config migration (follows Next.js 16 upgrade path separately).
- `eslint-plugin-tailwindcss` adoption (deferred — current built-in `no-restricted-syntax` suffices).
- Pre-commit hook installation (project doesn't currently use Husky; out of scope to add).

---

## Phase 1 — Enforcement infrastructure

### Task 1: Add `no-restricted-syntax` rules to `.eslintrc.json`

**Files:** Modify `.eslintrc.json`.

- [ ] **Step 1: Read current `.eslintrc.json`**

Run: `cat .eslintrc.json`

The existing config extends `next/core-web-vitals` (or `next`). Record the current structure for merge.

- [ ] **Step 2: Add rules and overrides**

Replace `.eslintrc.json` content with (preserving any existing `extends`/`rules` entries):

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/(?:^|[\\s'\"`])(?:text|leading|tracking)-\\[(?!length:var\\()/]",
        "message": "Typography arbitrary 값 금지. --text-* 토큰 사용: text-[length:var(--text-body)] 등. (docs/design-tokens.md)"
      },
      {
        "selector": "Literal[value=/(?:^|[\\s'\"`])z-\\[(?!var\\()/]",
        "message": "z-index arbitrary 값 금지. --z-* 토큰 사용: z-[var(--z-header)] 등."
      },
      {
        "selector": "Literal[value=/(?:^|[\\s'\"`])z-(10|20|30|40|50|60|70|80|90|100)\\b/]",
        "message": "z-index Tailwind 숫자 유틸 금지 (PR2 이후). --z-* 토큰 사용: z-[var(--z-header)] 등."
      },
      {
        "selector": "Literal[value=/(?:^|[\\s'\"`])rounded-\\[[0-9]/]",
        "message": "radius arbitrary 값 금지. --radius-chip/card/panel/overlay 사용: rounded-[var(--radius-card)] 등. Tailwind 기본(rounded-md/lg/xl)은 허용."
      },
      {
        "selector": "Literal[value=/(?:^|[\\s'\"`])(?:bg|text|border|ring|fill|stroke|decoration|outline)-\\[#[0-9a-fA-F]/]",
        "message": "Hex color arbitrary 값 금지. shadcn semantic (bg-background 등) 또는 --callout-*/--viz-*/--keyword 등 사용. primitive 정의는 app/globals.css에만."
      },
      {
        "selector": "Literal[value=/shadow-\\[0[_\\s].*rgba?\\(/]",
        "message": "rgba shadow arbitrary 값 금지. --shadow-card/card-hover/fab 사용: shadow-[var(--shadow-card)] 등."
      }
    ]
  },
  "overrides": [
    {
      "files": [
        "components/visualizations/**/*.tsx"
      ],
      "excludedFiles": [
        "components/visualizations/common/**/*.tsx"
      ],
      "rules": {
        "no-restricted-syntax": "off"
      }
    }
  ]
}
```

**Rationale for each pattern:**
1. Typography: blocks `text-[10px]`, allows `text-[length:var(--text-meta)]`.
2. Z-index arbitrary: blocks `z-[100]`, allows `z-[var(--z-hero)]`.
3. Z-index Tailwind numeric: blocks `z-50` / `z-10` etc (all migrated in PR2).
4. Radius: blocks `rounded-[10px]`, allows `rounded-[var(--radius-card)]` and Tailwind named (`rounded-md`/`rounded-lg`/`rounded-xl`/`rounded-2xl`/`rounded-full` pass because pattern requires `[0-9` after `[`).
5. Hex color: blocks `bg-[#EFF6FF]`, allows shadcn semantic utilities and CSS var references.
6. RGBA shadow: blocks `shadow-[0_4px_16px_rgba(...)]`, allows `shadow-[var(--shadow-fab)]`.

**Whitelist scope:**
- `components/visualizations/BTreeInsert.tsx`, `QuickSort.tsx`, etc (SVG-internal logic constants) — rules OFF.
- `components/visualizations/common/**` (chrome — VisualContainer, StepController, SpeedSlider) — rules ON (already migrated in PR1/PR2).

- [ ] **Step 3: Verify lint passes on current code**

Run: `pnpm lint 2>&1 | tail -30`

Expected: exit 0 (we migrated everything in PR1–PR3). If any errors appear, they indicate either:
- A legitimate hardcode the audits missed — investigate and tokenize
- A false positive in the regex — adjust the pattern

Note: the "lockfile in parent" Next.js warning is pre-existing worktree config issue, not a PR4 failure — ignore.

- [ ] **Step 4: Commit**

```bash
git add .eslintrc.json
git commit -m "feat(lint): add no-restricted-syntax rules for token enforcement

6 regex rules blocking arbitrary typography/z-index/radius/color/shadow
hardcodes at the Literal AST level. Whitelists
components/visualizations/{BTreeInsert,QuickSort,...} (except common/
chrome) for SVG-internal logic constants. No new plugin — uses
ESLint built-in rule for maximum compatibility with current Next.js
config stack.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Install Stylelint + add `.stylelintrc.json`

**Files:** Modify `package.json` devDependencies, create `.stylelintrc.json`.

- [ ] **Step 1: Install packages**

Run:
```bash
pnpm add -D stylelint stylelint-config-standard
```

Expected: `package.json` updated with 2 new devDependencies, `pnpm-lock.yaml` regenerated.

- [ ] **Step 2: Create `.stylelintrc.json`**

Content:

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "declaration-property-value-disallowed-list": [
      {
        "font-size": ["/^\\d+px$/", "/^\\d+rem$/", "/^\\d+\\.\\d+rem$/"],
        "line-height": ["/^[\\d.]+$/"],
        "color": ["/^#[0-9a-fA-F]+$/"],
        "background-color": ["/^#[0-9a-fA-F]+$/"],
        "border-color": ["/^#[0-9a-fA-F]+$/"],
        "z-index": ["/^\\d+$/"]
      },
      {
        "severity": "error"
      }
    ],
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": ["theme", "plugin", "import", "layer", "apply", "tailwind"]
      }
    ],
    "selector-class-pattern": null,
    "no-descending-specificity": null,
    "custom-property-pattern": null
  },
  "overrides": [
    {
      "files": ["app/globals.css"],
      "rules": {
        "declaration-property-value-disallowed-list": null
      }
    }
  ]
}
```

**Rationale:**
- Base rule blocks `font-size: 14px`, `line-height: 1.5`, `color: #fff`, `z-index: 50` in any CSS file that is NOT `app/globals.css`.
- `app/globals.css` override: token definitions live there, so the rule is disabled for that file (primitives must be literals).
- Tailwind-specific at-rules (`@theme`, `@plugin`, `@layer`, `@apply`, `@tailwind`) whitelisted.
- Patterns relaxed for selector-class + descending-specificity + custom-property to avoid churn against existing style.

- [ ] **Step 3: Verify stylelint runs clean**

Run:
```bash
pnpm exec stylelint 'app/**/*.css' 'components/**/*.css' 2>&1 | tail -20
```

Expected: exit 0 (zero violations — `app/globals.css` is whitelisted, and no other `.css` files currently exist in app/ or components/).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .stylelintrc.json
git commit -m "feat(lint): install stylelint + stylelint-config-standard

CSS-side enforcement: blocks font-size Npx, color #hex, z-index N
in all .css files except app/globals.css (where primitives live).
Tailwind at-rules whitelisted.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Extend `package.json` `lint` scripts

**Files:** Modify `package.json`.

- [ ] **Step 1: Read current scripts**

Run: `grep -A 15 '"scripts"' package.json`

Record the current `lint` and `lint:fix` entries (if any).

- [ ] **Step 2: Update scripts**

Change in `package.json` `"scripts"`:

```json
"lint": "next lint && stylelint 'app/**/*.css' 'components/**/*.css'",
"lint:fix": "next lint --fix && stylelint --fix 'app/**/*.css' 'components/**/*.css'"
```

If `lint` is currently just `"next lint"`, append `&& stylelint ...`.
If `lint:fix` doesn't exist, add it.

- [ ] **Step 3: Verify**

Run: `pnpm lint 2>&1 | tail -10`
Expected: exit 0 (both `next lint` and `stylelint` pass on the current codebase).

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat(lint): extend pnpm lint script to run stylelint too

pnpm lint now runs (1) next lint (with no-restricted-syntax rules)
AND (2) stylelint for .css files. Both must pass for lint to exit 0.
Paired lint:fix applies autofix from both.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Documentation

### Task 4: Write `docs/design-tokens.md` reference

**Files:** Create `docs/design-tokens.md`.

- [ ] **Step 1: Write the reference document**

Full content:

````markdown
# DEEP Design Tokens Reference

Central reference for the style-token system in `app/globals.css`. All consumers reference these tokens; arbitrary hardcoded values are forbidden (see CLAUDE.md §5 and the ESLint / Stylelint rules in `.eslintrc.json` / `.stylelintrc.json`).

## Token Layers

**Primitives** — value-neutral scale, declared in `@theme inline`. Consumers should prefer semantic aliases; primitives exist so the scale is modifiable in one place.

**Semantic aliases** — role-named references to primitives. Declared in `:root`; some responsive aliases are re-declared in `@media (min-width: 768px) { :root { ... } }`. Consumers reference these.

**User-preference overrides** — `html[data-font-size="small|normal|large"]` redeclares `--text-scale`. Other overrides (theme color) live in `[data-theme="dark"]`.

---

## Typography

### Primitives (`@theme inline`)

```
--text-2xs: calc(10px * var(--text-scale, 1))
--text-xs:  calc(11px * var(--text-scale, 1))
--text-sm:  calc(12px * var(--text-scale, 1))
--text-md:  calc(13px * var(--text-scale, 1))
--text-base: calc(15px * var(--text-scale, 1))
--text-lg:  calc(17px * var(--text-scale, 1))
--text-xl:  calc(19px * var(--text-scale, 1))
--text-2xl: calc(22px * var(--text-scale, 1))
--text-3xl: calc(24px * var(--text-scale, 1))

--leading-tight: 1.2
--leading-snug: 1.4
--leading-normal: 1.6
--leading-relaxed: 1.75

--weight-regular: 400
--weight-medium: 500
--weight-semibold: 600
--weight-bold: 700
```

### Semantic aliases

| Token | Role | Default (mobile) | md+ override |
|---|---|---|---|
| `--text-body` | MDX post body | `--text-base` (15) | `--text-lg` (17) |
| `--text-body-sm` | Secondary body | `--text-md` (13) | — |
| `--text-meta` | Date / reading time / count | `--text-sm` (12) | — |
| `--text-caption` | Caption / footer / category label | `--text-xs` (11) | — |
| `--text-hint` | Kbd hint / ⌘K badge | `--text-2xs` (10) | — |
| `--text-h1` | Post title | `calc(28px * scale)` | `calc(32px * scale)` |
| `--text-h2` | Section heading | `--text-2xl` (22) | `--text-3xl` (24) |
| `--text-h3` | Sub-section | `calc(18px * scale)` | `--text-xl` (19) |
| `--text-h4` | Card title / small heading | `--text-lg` (17) | — |
| `--text-menu` | DEEP logo / header primary | `--text-lg` (17) | — |
| `--text-nav-item` | Category/TOC link | `--text-md` (13) | — |
| `--text-nav-header` | "ON THIS PAGE" / category summary | `--text-xs` (11) | — |
| `--text-search-input` | Search input | `--text-base` (15) | — |
| `--text-search-title` | Search result title | `--text-md` (13) | — |
| `--text-search-summary` | Search result snippet | `--text-sm` (12) | — |
| `--text-callout-body` | Callout body | `--text-base` (15) | — |
| `--text-callout-label` | Callout title (NOTE/WARN) | `--text-sm` (12) | — |
| `--text-code-block` | Shiki code block | `calc(13px * scale)` | `calc(14px * scale)` |
| `--text-code-inline` | Inline `code` | `0.9em` (ratio) | — |
| `--text-button` | Button / select trigger | `--text-md` (13) | — |
| `--text-badge` | Tag chip | `--text-xs` (11) | — |
| `--text-settings-title` | Settings panel title | `--text-base` (15) | — |
| `--text-settings-header` | Settings section label | `11.5px` (literal) | — |

### User-adjustable font scale

```
html[data-font-size="small"]  { --text-scale: 0.92 }
html[data-font-size="normal"] { --text-scale: 1 }      /* default */
html[data-font-size="large"]  { --text-scale: 1.10 }
```

Controlled via Settings panel → 폰트 크기. Persisted in `localStorage['deep-settings'].fontSize`. Pre-hydration sync via `next/script strategy="beforeInteractive"` in `app/layout.tsx`.

### Usage

```tsx
<h2 className="text-[length:var(--text-h2)] font-semibold">Section</h2>
<p className="text-[length:var(--text-body)]">Body copy</p>
<kbd className="text-[length:var(--text-hint)]">⌘K</kbd>
```

```css
.prose-kr { font-size: var(--text-body); line-height: var(--leading-relaxed); }
```

---

## Layout

| Token | Value | Role |
|---|---|---|
| `--layout-nav-width` | `288px` | DocShell left rail |
| `--layout-toc-width` | `224px` | DocShell right rail |
| `--layout-content-gap` | `2rem` | DocShell column gap |
| `--layout-header-height` | `64px` | Sticky header height |
| `--layout-sticky-offset` | `5rem` | TOC/CategoryNav sticky top |
| `--layout-page-pad` | `1rem` | Mobile edge padding |
| `--layout-page-pad-md` | `1.5rem` | md+ edge padding |
| `--layout-content-max` | `46rem` | Reading width cap |
| `--layout-panel-width` | `300px` | SettingsPanel width |
| `--layout-popover-width` | `18rem` | Popover / KeywordLink default |

### Usage

```tsx
<aside className="w-[var(--layout-toc-width)] sticky top-[var(--layout-sticky-offset)]">
<div className="grid grid-cols-[var(--layout-nav-width)_minmax(0,1fr)_var(--layout-toc-width)]">
```

---

## Z-index

| Token | Value | Role |
|---|---|---|
| `--z-nav` | `10` | In-card badges (timeline bullets) |
| `--z-sticky` | `20` | TOC, sticky inner rails |
| `--z-overlay` | `40` | MobileOverlays |
| `--z-header` | `50` | Page sticky header |
| `--z-fab` | `50` | SettingsFab |
| `--z-panel` | `50` | SettingsPanel |
| `--z-popover` | `50` | shadcn popover / select |
| `--z-toast` | `60` | Reserved |
| `--z-hero` | `100` | HeroIntro overlay (top) |

### Usage

```tsx
<header className="sticky top-0 z-[var(--z-header)]">
```

---

## Radius

### Primitives (`@theme inline`, shadcn scale)

```
--radius-sm: 6px
--radius: 10px
--radius-lg: 14px
--radius-xl: 20px
```

### Semantic aliases

| Token | Value | Role |
|---|---|---|
| `--radius-chip` | `var(--radius-sm)` (6) | Tag chips, small pills |
| `--radius-card` | `var(--radius)` (10) | Post cards, inputs, small panels |
| `--radius-panel` | `var(--radius-lg)` (14) | Callouts, popovers, settings panel |
| `--radius-overlay` | `var(--radius-xl)` (20) | Hero, large modals |

Tailwind-named radius utilities (`rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`) remain allowed for one-off usage not covered by a semantic role.

---

## Shadow (Elevation)

| Token | Value | Role |
|---|---|---|
| `--shadow-card` | `0 2px 12px rgba(0, 0, 0, 0.04)` | Card resting → hover lift |
| `--shadow-card-hover` | `0 4px 16px rgba(0, 0, 0, 0.05)` | Larger card elevation on hover |
| `--shadow-fab` | `0 4px 16px rgba(0, 0, 0, 0.15)` | Floating action button |

### Usage

```tsx
<div className="hover:shadow-[var(--shadow-card)]">
```

---

## Colors

### shadcn semantic (existing)
`--background`, `--foreground`, `--muted`, `--muted-foreground`, `--border`, `--border-strong`, `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`, `--ring`, `--popover`, `--popover-foreground`, `--input`, `--secondary`, `--secondary-foreground`, `--destructive`, `--destructive-foreground`, `--card`

### DEEP extensions
- `--keyword`, `--keyword-bg` — keyword auto-links
- `--code-inline-fg` — inline code teal
- `--callout-{info|warning|error|success}-{bg|border|title|icon}` — Callout variants
- `--code-{bg|chrome-bg|chrome-border|chrome-fg|line-number|traffic-{red|yellow|green}}` — Mac-style code block chrome
- `--viz-{pivot|comparing|confirmed|blocked|waiting|highlight}-{border|bg|fg}` — visualization state colors

### Deferred: generic `--state-*` tokens
The original spec proposed `--state-info/warn/danger/success` as top-level generic state colors. Deferred — `Callout` is the only current consumer of state colors, and its per-type naming (`--callout-info-*`) is clearer than a two-hop alias. Add generic state tokens in a future PR when a second consumer (e.g., form validation, toast) appears.

### Dark mode
All color tokens have dark-mode overrides in `[data-theme="dark"]`. Typography, layout, z-index, radius, and shadow tokens are theme-invariant (same values in light + dark).

---

## Exceptions (allowed)

1. `em` / `%` relative units in CSS (e.g., `.prose-kr h2 { margin-top: 3em }`).
2. `1px`, `2px` border widths (visual refinement, not a scale).
3. `calc()` internal arithmetic (e.g., `calc(100vh - var(--layout-header-height))`).
4. `transparent`, `currentColor`, `inherit` CSS keywords.
5. `color-mix()` percentage values.
6. `components/visualizations/{BTreeInsert,QuickSort,...}` — SVG coordinate / animation / stepper logic constants (ESLint whitelist in `.eslintrc.json`).
7. Shiki-generated inline `style` attributes.
8. Primitive definition blocks: `@theme inline`, `:root`, `[data-theme="dark"]`, `html[data-font-size="..."]` — these MUST contain literal values.
9. Tailwind default spacing (`p-4`, `gap-2`, `m-8`) and dimension (`h-4`, `w-10`) utilities — retained as the main spacing layer.
10. Single-use arbitrary values with documented rationale (e.g., `HeroIntro.tsx`'s `[background:radial-gradient(...rgba...)]` vignette).
11. Icon pixel sizes (`h-[22px] w-[22px]`) — geometric icon constants.
12. Mini-wireframe geometry in `SettingsPanel.tsx` LayoutMiniIcon (`w-[3px]`, `h-[2px]`) — decorative, not layout.

## Adding a new token

1. Decide layer: primitive (`@theme inline`) or semantic alias (`:root`)?
2. For typography, wrap in `calc(Npx * var(--text-scale, 1))` so it inherits font-scale.
3. For responsive variance, re-declare the semantic alias in the `@media (min-width: 768px)` block.
4. For dark-mode variance, re-declare in `[data-theme="dark"]` (typography/layout tokens are usually theme-invariant).
5. Update this document's table.
6. Update CLAUDE.md §6 if the token establishes a new invariant.
7. If the token replaces a hardcoded literal in multiple files, include the migration in the same commit or a follow-up commit.

## Enforcement

- **ESLint** (`.eslintrc.json` `no-restricted-syntax`): blocks `text-[Npx]`, `z-[N]`/`z-50`, `rounded-[Npx]`, `bg/text/border-[#...]`, `shadow-[0_...rgba...]` at classname literal level. Whitelists `components/visualizations/**` (except `common/`).
- **Stylelint** (`.stylelintrc.json`): blocks `font-size: Npx`, `color: #hex`, `z-index: N` in CSS files outside `app/globals.css`.
- Both run via `pnpm lint` (paired with `pnpm lint:fix`).
````

- [ ] **Step 2: Verify file created**

Run: `ls docs/design-tokens.md && wc -l docs/design-tokens.md`
Expected: file exists, ~230 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/design-tokens.md
git commit -m "docs(tokens): add design-tokens.md reference

Single-page reference for all typography, layout, z-index, radius,
shadow, and color tokens. Documents primitive/semantic layers, dark
mode handling, font-scale mechanism, exception policy, new-token
protocol, and links to enforcement configs. Supersedes scattered
inline comments in globals.css.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Update CLAUDE.md

**Files:** Modify `CLAUDE.md`.

- [ ] **Step 1: Read current CLAUDE.md**

Run: `cat CLAUDE.md | head -120`

Identify the current state of §2 (stack), §4 (commands), §5 (prohibitions), §6 (invariants).

- [ ] **Step 2: Update §2 (stack)**

Find line:
```
Next.js 15 App Router · TypeScript strict · Velite (MDX → type-safe) · Tailwind v4 + shadcn/ui · Shiki · KaTeX · Vitest · pnpm 9.15.4 (corepack pinned, Node 23.5 keyid 버그 회피용).
```

Replace with:
```
Next.js 15 App Router · TypeScript strict · Velite (MDX → type-safe) · Tailwind v4 + shadcn/ui · Shiki · KaTeX · Vitest · **Stylelint**(CSS 토큰 강제) · ESLint `no-restricted-syntax`(className 토큰 강제) · pnpm 9.15.4 (corepack pinned, Node 23.5 keyid 버그 회피용).
```

- [ ] **Step 3: Update §4 (commands block)**

Find the command block. After `pnpm lint                  # next lint` line, replace with:

```
pnpm lint                  # next lint + stylelint (토큰 강제 포함)
pnpm lint:fix              # 자동 수정
```

If there's no `lint:fix` entry, add it below `pnpm lint`.

- [ ] **Step 4: Update §5 item 9 (existing typography rule → expand to all categories)**

Currently §5 has item 9 covering only typography:

```
9. **Typography 하드코딩 금지** — `text-[Npx]` / `text-xs|sm|base|lg|xl|2xl|3xl|4xl` / CSS `font-size: Npx` 직접 사용 금지. `app/globals.css`의 semantic 토큰 (`--text-body`, `--text-menu`, ...) 사용. ...
```

Replace with a consolidated item 9:

```
9. **Style 하드코딩 금지** — ESLint + Stylelint가 차단:
   - Typography: `text-[Npx]` / `text-xs|sm|base|lg|xl|2xl|3xl|4xl` / CSS `font-size: Npx` → `--text-*` 토큰
   - Layout 상수: `w-[288px]` / `w-[224px]` / `w-[300px]` / `top-20` 등 → `--layout-*` 토큰
   - Z-index: `z-[N]` / `z-10|20|40|50|60|100` → `--z-*` 토큰
   - Radius: `rounded-[Npx]` → `--radius-chip|card|panel|overlay` (Tailwind named `rounded-md|lg|xl|2xl|full`는 허용)
   - Hex color: `bg-[#...]` / `text-[#...]` / `border-[#...]` / CSS `color: #...` → shadcn semantic 또는 `--keyword`/`--callout-*`/`--code-*`/`--viz-*`
   - Shadow: `shadow-[0_...rgba...]` → `--shadow-card|card-hover|fab`
   예외 (자동 whitelist): `components/visualizations/{BTreeInsert,QuickSort,...}` SVG 로직 상수, `em`/`%` 상대 단위, primitive 정의 블록(`@theme inline`, `:root`, `[data-theme="dark"]`, `html[data-font-size="..."]`), 아이콘 픽셀 크기(`h-[22px] w-[22px]`), 단일 사용 리터럴(HeroIntro radial gradient 등). 토큰 전체 목록: `docs/design-tokens.md`.
```

- [ ] **Step 5: Update §6 — expand Typography 토큰 시스템 section**

The current §6 has a "Typography 토큰 시스템 (PR1)" line. Replace it with:

```
- **Style 토큰 시스템 (PR1–PR3)**: `app/globals.css`에 2-tier — (1) `@theme inline` primitives(typography `--text-*` scale + `--leading-*` + `--weight-*` + shadcn `--radius-*`) (2) `:root` semantic aliases. Responsive는 `@media (min-width: 768px) :root { }`에서 semantic 재선언. **카테고리**: typography, layout(`--layout-nav-width/toc-width/sticky-offset/...`), z-index(`--z-header/fab/panel/popover/hero/...`), radius semantic(`--radius-chip/card/panel/overlay`), shadow(`--shadow-card/card-hover/fab`), colors(shadcn + `--callout-*` + `--keyword` + `--code-*` + `--viz-*`). **사용자 조정 font-scale**: `html[data-font-size="small|normal|large"]`가 `--text-scale`을 `0.92 / 1 / 1.10`로 오버라이드. `SettingsProvider`의 `fontSize` 필드 → `document.documentElement.dataset.fontSize` effect 동기화, FOUC 차단은 `app/layout.tsx`의 `next/script strategy="beforeInteractive"`. 기본값 `normal`. 새 토큰 프로토콜: primitive → semantic alias → `docs/design-tokens.md` 표 업데이트 → 필요 시 CLAUDE.md §6에 불변식 추가. 전체 참조: `docs/design-tokens.md`.
```

- [ ] **Step 6: Verify build**

Run: `pnpm build 2>&1 | tail -5` → succeeds (CLAUDE.md is docs, not code, but worth confirming nothing broke).

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude-md): finalize token system invariants and enforcement

§2 adds Stylelint + ESLint no-restricted-syntax to stack.
§4 adds lint:fix command and extends lint description.
§5 consolidates item 9 to cover all style categories
(typography, layout, z-index, radius, color, shadow) with
whitelist list and docs link.
§6 expands PR1 typography section into full PR1-PR3 token
system description with categories, font-scale mechanism,
and new-token protocol. docs/design-tokens.md is authoritative
reference.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Enforcement regression test + merge

### Task 6: Regression test — deliberately introduce violations

- [ ] **Step 1: Create a temporary canary file**

Create `components/blog/_lint-canary.tsx` with:

```tsx
// @ts-nocheck
// CANARY — this file SHOULD fail lint. Delete after verifying.
export function BadComponent() {
  return (
    <div className="text-[14px] z-50 rounded-[10px] bg-[#EFF6FF] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      should fail lint
    </div>
  )
}
```

- [ ] **Step 2: Run lint, expect 5 violations**

Run: `pnpm lint 2>&1 | tail -30`

Expected: exit 1 with at least 5 errors (one per rule: text-[14px], z-50, rounded-[10px], bg-[#...], shadow-[0_...rgba...]).

Report the exact error messages observed.

- [ ] **Step 3: Delete the canary and confirm clean**

Run: `rm components/blog/_lint-canary.tsx && pnpm lint 2>&1 | tail -10`
Expected: exit 0.

- [ ] **Step 4: Commit the "lint works" evidence**

No file changes, but record the verification as part of the PR4 merge commit body. No separate commit needed. Just document in Task 7's merge commit.

---

### Task 7: Merge PR4 to `feature/style-token-system`

Work from main repo (NOT worktree):

- [ ] **Step 1: Worktree clean**

Run: `git status` → no uncommitted changes.

- [ ] **Step 2: Switch to integration branch**

```bash
cd /Users/ing9990/Document/backend-notes
git checkout feature/style-token-system
```

- [ ] **Step 3: Merge PR4**

```bash
git merge --no-ff feature/pr4-enforcement-docs -m "$(cat <<'EOF'
Merge PR4: Enforcement + Docs (final)

Integrates the fourth and final style-token-system PR. PR4 delivers:
- ESLint no-restricted-syntax rules (6 regex patterns blocking
  arbitrary typography/z-index/radius/color/shadow hardcodes)
- Stylelint + stylelint-config-standard (CSS file enforcement)
- Extended pnpm lint / lint:fix scripts
- docs/design-tokens.md — complete token reference
- CLAUDE.md §2/§4/§5/§6 finalized to reflect PR1-PR3 token system
  and PR4 enforcement

Regression test: a canary file with 5 deliberate violations triggered
exactly the expected 5 lint errors; deleting the canary returned lint
to green.

Completes the style-token-system project. feature/style-token-system
is now ready to merge to main.

Spec: docs/superpowers/specs/2026-04-18-style-token-system-design.md
Plan: docs/superpowers/plans/2026-04-18-pr4-enforcement-and-docs.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify integration branch**

Run:
```bash
pnpm type-check && pnpm lint && pnpm build 2>&1 | tail -10
```
Expected: all three green.

Run: `git log --oneline --graph -20` — confirm all 4 PR merge commits present.

---

### Task 8: Final merge — `feature/style-token-system` → `main`

This completes the style-token-system project.

- [ ] **Step 1: Confirm integration branch is ready**

From main repo:
- `git log --oneline feature/style-token-system -5` — shows PR4 merge commit on top.
- `pnpm test`, `pnpm build` green.

- [ ] **Step 2: Switch to main and merge**

```bash
cd /Users/ing9990/Document/backend-notes
git checkout main
git merge --no-ff feature/style-token-system -m "$(cat <<'EOF'
Merge style-token-system: PR1-PR4 (typography, spacing, color, enforcement)

Completes the style-token-system project begun on 2026-04-18.
Removes all typography/layout/z-index/radius/shadow hardcodes from
the blog codebase (except viz-internal SVG logic) and establishes
ESLint + Stylelint enforcement to prevent regressions.

Four sub-PRs integrated:
- PR1: Typography tokens + user-adjustable font-size Settings
  (작게/보통/크게)
- PR2: Layout/z-index/radius spacing & dimension tokens
- PR3: Shadow elevation tokens (scope-reduced from spec — state
  colors and Callout refactor deferred as YAGNI)
- PR4: ESLint no-restricted-syntax + Stylelint + docs/design-tokens.md
  + finalized CLAUDE.md §2/§4/§5/§6

User-facing: 폰트 크기 3-step preset in Settings (default 보통),
FOUC-prevented via pre-hydration next/script. Visual output
preserved bit-for-bit.

Spec: docs/superpowers/specs/2026-04-18-style-token-system-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify main**

Run:
```bash
pnpm type-check && pnpm lint && pnpm build 2>&1 | tail -10
```
Expected: all green.

Run: `git log --oneline --graph -30` — review full history.

- [ ] **Step 4: Optional cleanup**

After user confirms main is good:
- Worktree cleanup: `git worktree remove .worktrees/pr1-typography-tokens .worktrees/pr2-spacing-tokens .worktrees/pr3-color-consolidation .worktrees/pr4-enforcement-docs`
- Feature branch cleanup: `git branch -d feature/pr1-typography-tokens feature/pr2-spacing-dimension-tokens feature/pr3-color-consolidation feature/pr4-enforcement-docs feature/style-token-system`
- User decides push-to-origin strategy separately (separate session concern — origin/main is behind local main by many commits; not PR4's job to reconcile).

---

## Rollback

If PR4 needs to be reverted:
- ESLint rules: `git revert` the `.eslintrc.json` commit.
- Stylelint: uninstall + `git revert` the `package.json` / `.stylelintrc.json` commits.
- CLAUDE.md: `git revert` the docs commit.
- Token definitions (from PR1-PR3) remain — no component code uses the enforcement layer directly.

The final main merge commit is revertible with `git revert -m 1 <merge-sha>` — that reverts ALL style-token-system work atomically.

## Post-project Follow-ups

- **Push strategy:** `origin/main` is behind local `main` by many commits (i18n + all PR work). Separate decision: force-free push of full local history, or a carefully scoped push.
- **Future `--state-*` token addition** when a second state-color consumer appears (toasts, form errors).
- **ESLint v9 flat config migration** when Next.js 16 upgrade lands.
- **Pre-commit hook** (Husky) — not added by this plan. Add if the user wants to catch violations before CI.
