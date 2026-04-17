# PR1: Typography Tokens + Font-Scale Settings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce centralized typography tokens (primitives + semantic aliases) in `app/globals.css`, add user-adjustable font-size Settings (Small / Normal / Large), and migrate all typography hardcodes across the DEEP codebase to token references — without regressing any existing UI.

**Architecture:** Hybrid token system (primitive scale + semantic aliases) defined in `@theme inline` and `:root` blocks of `app/globals.css`. Scale multiplier (`--text-scale`) in `html[data-font-size="..."]` selectors lets one variable change shift the entire typographic scale. Settings persistence follows the existing `SettingsProvider` + localStorage + `useTranslation` pattern already used for `cardLayout` and `language`. Responsive (≥768px) adjustments live in a single `@media` block on semantic aliases so call sites never branch on viewport.

**Tech Stack:** Next.js 15 App Router · TypeScript strict · Tailwind v4 (`@theme inline`) · CSS custom properties · `next/script` (beforeInteractive) for pre-hydration · Vitest (for validator unit tests). No new runtime dependencies.

---

## Prerequisites

- Worktree at `.worktrees/pr1-typography-tokens` on branch `feature/pr1-typography-tokens` (branched from `main` @ `0ae5352`).
- Baseline verified: `pnpm type-check` green, Velite build succeeds.
- Reference spec: `docs/superpowers/specs/2026-04-18-style-token-system-design.md`.

## File Structure (plan-level overview)

### Created
- No new runtime files. All tokens live in `app/globals.css`; settings additions extend existing files.
- `tests/settings-font-size.test.ts` — unit tests for `normalizeFontSize`.

### Modified (infrastructure)
- `app/globals.css` — add typography primitives in `@theme inline`, semantic aliases in `:root` and `[data-theme="dark"]`, responsive `@media` overrides, `html[data-font-size="..."]` scale selectors, refactor `.prose-kr` rules to reference tokens.
- `app/layout.tsx` — add `next/script` (beforeInteractive) for pre-hydration `data-font-size` sync.
- `components/providers/SettingsProvider.tsx` — add `FontSize` type + `fontSize` field + `normalizeFontSize()` + sync effect.
- `lib/i18n/messages.ts` — add 4 font-size message keys.
- `components/layout/SettingsPanel.tsx` — add Font-size section + migrate the panel's own `text-[…px]` hardcodes to tokens.

### Modified (migration — typography hardcodes → tokens)
- `app/posts/[slug]/page.tsx`
- `components/blog/*` — Header, HeaderActions, MobileOverlays, ThemeToggle, CategoryNav, IndexCategoryNav, TableOfContents, PostCardTimeline, PostCardEditorial, PostCardFloating, RelatedPost, PostMeta, TagChip, TagPageHeader, KeywordLink, SortSelect, Footer, RecentPostsSection, PostList, HeroIntro, BlogHomeClient
- `components/mdx/*` — Callout, components, Tabs, TabsView
- `components/ui/*` — badge, button, input, select
- `components/visualizations/common/*` — VisualContainer, StepController, SpeedSlider (chrome only — internal viz files are excluded)

### Out of Scope (this PR)
- Spacing/dimension tokens (`--layout-*`, `--radius-*`, `--z-*`) — PR2.
- Color token consolidation (Callout state colors, arbitrary hex) — PR3.
- ESLint/stylelint rules + CLAUDE.md update — PR4.
- Visualization-internal `text-[…]` in `components/visualizations/{BTreeInsert,QuickSort,CardinalitySpectrum,...}` — these are SVG labels/coordinates (logic constants).

---

## Phase 1 — Token definitions in `app/globals.css`

### Task 1: Add typography primitives to `@theme inline`

**Files:**
- Modify: `app/globals.css` — add after the `--font-mono` declaration (currently line 53), before `--radius-sm`.

- [ ] **Step 1: Add primitive tokens**

Insert these lines immediately after the `--font-mono` declaration (around line 53) and before `--radius-sm`:

```css
  /* ------------------------------------------------------------------
     Typography primitives — T-shirt scale. All sizes multiply through
     --text-scale so html[data-font-size="..."] can shift the whole
     scale with one variable. See docs/superpowers/specs/2026-04-18-
     style-token-system-design.md for the taxonomy.
     ------------------------------------------------------------------ */
  --text-2xs: calc(10px * var(--text-scale, 1));
  --text-xs:  calc(11px * var(--text-scale, 1));
  --text-sm:  calc(12px * var(--text-scale, 1));
  --text-md:  calc(13px * var(--text-scale, 1));
  --text-base: calc(15px * var(--text-scale, 1));
  --text-lg:  calc(17px * var(--text-scale, 1));
  --text-xl:  calc(19px * var(--text-scale, 1));
  --text-2xl: calc(22px * var(--text-scale, 1));
  --text-3xl: calc(24px * var(--text-scale, 1));

  /* Line-height primitives */
  --leading-tight: 1.2;
  --leading-snug: 1.4;
  --leading-normal: 1.6;
  --leading-relaxed: 1.75;

  /* Font-weight primitives */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
```

- [ ] **Step 2: Verify**

Run: `cd .worktrees/pr1-typography-tokens && pnpm type-check`
Expected: exit 0. (Tailwind v4 loads `@theme` at build time; type-check does not validate CSS, but this confirms the change did not break TS imports.)

Run: `pnpm exec velite build && pnpm build 2>&1 | tail -20`
Expected: build completes without CSS parse errors. (If `calc(10px * var(--text-scale, 1))` is reported as invalid, it means Tailwind stripped the fallback — unlikely, but if it happens, split into `:root { --text-scale: 1 }` now instead of waiting for Task 5.)

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): add typography primitives to @theme inline

9 font-size primitives, 4 line-height, 4 font-weight. All font-sizes
wrap in calc(Npx * var(--text-scale, 1)) so a future --text-scale
override can shift the entire scale atomically.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Add `--text-scale` default + semantic aliases at `:root`

**Files:**
- Modify: `app/globals.css` — the existing `:root { ... }` block (lines 61–154).

- [ ] **Step 1: Add scale default at top of `:root`**

Immediately after the opening `:root {` (line 61), add:

```css
  /* Font-scale multiplier — overridden by html[data-font-size="small"|"large"].
     Default 1 ("normal") is the reference scale. */
  --text-scale: 1;
```

- [ ] **Step 2: Add semantic typography aliases before closing `}` of `:root`**

Immediately before the closing `}` of the `:root` block (currently line 154), add:

```css

  /* ------------------------------------------------------------------
     Typography semantic aliases — role-driven names. Consumers reference
     these (e.g., text-[length:var(--text-body)]) so primitive shifts and
     responsive overrides propagate without touching call sites.

     Responsive values (--text-body, --text-h1, --text-h2, --text-h3,
     --text-code-block) are re-declared in the @media (min-width: 768px)
     block below. Non-responsive aliases appear only once here.
     ------------------------------------------------------------------ */
  --text-body:            var(--text-base);
  --text-body-sm:         var(--text-md);
  --text-meta:            var(--text-sm);
  --text-caption:         var(--text-xs);
  --text-hint:            var(--text-2xs);

  --text-h1:              calc(28px * var(--text-scale, 1));
  --text-h2:              var(--text-2xl);
  --text-h3:              calc(18px * var(--text-scale, 1));
  --text-h4:              var(--text-lg);

  --text-menu:            var(--text-lg);
  --text-nav-item:        var(--text-md);
  --text-nav-header:      var(--text-xs);

  --text-search-input:    var(--text-base);
  --text-search-title:    var(--text-md);
  --text-search-summary:  var(--text-sm);

  --text-callout-body:    var(--text-base);
  --text-callout-label:   var(--text-sm);

  --text-code-block:      calc(13px * var(--text-scale, 1));
  --text-code-inline:     0.9em;  /* ratio exception — stays relative to parent */

  --text-button:          var(--text-md);
  --text-badge:           var(--text-xs);
  --text-settings-title:  var(--text-base);
  --text-settings-header: 11.5px;  /* one-off exception: uppercase section label */
```

- [ ] **Step 3: Verify build**

Run: `pnpm exec velite build && pnpm build 2>&1 | tail -20`
Expected: build succeeds. No Tailwind warnings about unknown variables.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): add --text-scale default and semantic typography aliases

25 role-named aliases (body, heading, menu, search, callout, code, UI)
resolve to primitives. Responsive aliases (--text-body, h1-h3,
code-block) will be re-declared at md: breakpoint in a later task.
Two exceptions flagged inline: --text-code-inline uses 0.9em ratio,
--text-settings-header keeps 11.5px literal for uppercase micro-type.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Confirm dark-theme block needs no typography changes

**Files:**
- (none — verification task only)

- [ ] **Step 1: Review the `[data-theme="dark"]` block**

Open `app/globals.css` and review lines 156–242. All declarations are color-only (`--background`, `--foreground`, `--callout-*-bg`, `--viz-*`, etc.). No font-size or line-height values live there.

- [ ] **Step 2: Confirm typography is theme-invariant**

Typography scale stays identical across light and dark themes — only colors change. `:root` token declarations (Task 2) are sufficient; no dark overrides needed.

- [ ] **Step 3: No commit — proceed to Task 4**

This task records the decision explicitly so the plan author does not revisit this question later.

---

### Task 4: Add responsive semantic overrides at `@media (min-width: 768px)`

**Files:**
- Modify: `app/globals.css` — the existing `@media (min-width: 768px)` block at lines 519–526.

- [ ] **Step 1: Expand the media block**

Replace the current block:

```css
@media (min-width: 768px) {
  .prose-kr { font-size: 17px; }
  .prose-kr h2 { font-size: 24px; }
  .prose-kr h3 { font-size: 19px; }
  .prose-kr table { font-size: 15px; }
  .prose-kr table th,
  .prose-kr table td { padding: 14px 18px; }
}
```

With:

```css
@media (min-width: 768px) {
  :root {
    /* Responsive semantic re-declarations. Primitives already pick up
       --text-scale; these aliases swap to the larger size at md+. */
    --text-body:       var(--text-lg);
    --text-h1:         calc(32px * var(--text-scale, 1));
    --text-h2:         var(--text-3xl);
    --text-h3:         var(--text-xl);
    --text-code-block: calc(14px * var(--text-scale, 1));
  }

  .prose-kr table { font-size: 15px; }
  .prose-kr table th,
  .prose-kr table td { padding: 14px 18px; }
}
```

Note: `.prose-kr` and `.prose-kr h2|h3` rules are **removed from the media block** because `.prose-kr` will be refactored in Task 6 to reference `--text-body`, `--text-h2`, `--text-h3` — which now swap automatically via the `:root` override above. `.prose-kr table` and its `th/td` padding stay here: they are a table-specific concern unrelated to the typography scale, and PR2 will tokenize them.

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: build succeeds. `.prose-kr` visuals will look wrong temporarily because Task 6 has not refactored its rules yet; the build itself must still pass.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): add responsive semantic overrides at md: breakpoint

--text-body, --text-h1, --text-h2, --text-h3, --text-code-block swap
to the larger size at 768px. .prose-kr legacy rules remain temporarily
broken; Task 6 (refactor .prose-kr to reference tokens) fixes them.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Add `html[data-font-size]` scale overrides

**Files:**
- Modify: `app/globals.css` — insert immediately after the `[data-theme="dark"]` block (after the current line 242).

- [ ] **Step 1: Add the three scale selectors**

Insert:

```css

/* ------------------------------------------------------------------
   Font-scale overrides — user preference via Settings > 폰트 크기.
   Written to html[data-font-size] by the SettingsProvider sync effect
   (Task 9) and a pre-hydration script in app/layout.tsx (Task 10,
   for FOUC prevention).

   "normal" is the default (1.0). Small shrinks by 8 %, large grows by
   10 %. The multiplier propagates through every primitive declared in
   @theme inline (see Task 1) and every responsive literal in the
   :root / @media blocks (Tasks 2 & 4) that uses calc(Npx * scale).
   ------------------------------------------------------------------ */
html[data-font-size="small"]  { --text-scale: 0.92; }
html[data-font-size="normal"] { --text-scale: 1; }
html[data-font-size="large"]  { --text-scale: 1.10; }
```

- [ ] **Step 2: Verify the file has no duplicate `:root` or malformed selectors**

Run: `grep -c "^:root {" app/globals.css`
Expected: `1` (exactly one top-level `:root`).

Run: `grep -c "html\[data-font-size" app/globals.css`
Expected: `3`.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): add html[data-font-size] scale selectors

small=0.92, normal=1.0, large=1.10. Multiplier flows through every
--text-* primitive and every calc()-based semantic alias. Requires the
SettingsProvider sync effect (Task 9) and pre-hydration script
(Task 10) to actually set the attribute.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Refactor `.prose-kr` rules to reference tokens

**Files:**
- Modify: `app/globals.css` — the `.prose-kr` rules at lines 267–371 (body/h2/h3/p/a/code/pre) and the keyword-link, table, and katex rules.

- [ ] **Step 1: Replace the base `.prose-kr` block**

Replace this block (currently at lines 267–275):

```css
.prose-kr {
  /* Blog post body uses Pretendard Variable — better hinting for long-form
     Korean reading. Global default (Paperlogy) stays on everything else. */
  font-family: var(--font-pretendard), ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--foreground);
}
```

With:

```css
.prose-kr {
  /* Blog post body uses Pretendard Variable — better hinting for long-form
     Korean reading. Global default (Paperlogy) stays on everything else. */
  font-family: var(--font-pretendard), ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", Roboto, sans-serif;
  font-size: var(--text-body);
  line-height: var(--leading-relaxed);
  color: var(--foreground);
}
```

Note: body line-height was `1.5`; `--leading-relaxed` is `1.75`. This is an intentional design-token normalization — long-form Korean reads better with `1.75`, which matches the Tailwind `.prose` default. If the visual change is undesirable, revert to defining `--leading-body: 1.5` at `:root` and using that here. Default: accept the 1.75 change.

- [ ] **Step 2: Replace the `.prose-kr h2` block**

Replace (currently at lines 277–286):

```css
.prose-kr h2 {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.01em;
  margin-top: 3em;
  margin-bottom: 1em;
  padding-top: 1.5em;
  border-top: 1px solid var(--border);
}
```

With:

```css
.prose-kr h2 {
  font-size: var(--text-h2);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.01em;
  margin-top: 3em;
  margin-bottom: 1em;
  padding-top: 1.5em;
  border-top: 1px solid var(--border);
}
```

- [ ] **Step 3: Replace the `.prose-kr h3` block**

Replace (currently at lines 296–302):

```css
.prose-kr h3 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
}
```

With:

```css
.prose-kr h3 {
  font-size: var(--text-h3);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  margin-top: 1.6em;
  margin-bottom: 0.6em;
}
```

- [ ] **Step 4: Replace the plain `<pre>` fallback font-size**

Replace (currently at lines 363–371):

```css
.prose-kr pre {
  margin: 1.5em 0;
  padding: 1em 1.25em;
  border-radius: var(--radius);
  background-color: var(--muted);
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
}
```

With:

```css
.prose-kr pre {
  margin: 1.5em 0;
  padding: 1em 1.25em;
  border-radius: var(--radius);
  background-color: var(--muted);
  overflow-x: auto;
  font-size: var(--text-code-block);
  line-height: var(--leading-normal);
}
```

- [ ] **Step 5: Replace the figure code-block `<pre>` font-size**

Replace (currently at lines 649–660):

```css
.prose-kr figure[data-rehype-pretty-code-figure] pre {
  margin: 0;
  padding: 16px 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border-radius: 0;
  background-color: transparent;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.65;
}
```

With:

```css
.prose-kr figure[data-rehype-pretty-code-figure] pre {
  margin: 0;
  padding: 16px 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border-radius: 0;
  background-color: transparent;
  overflow-x: auto;
  font-size: var(--text-code-block);
  line-height: 1.65;
}
```

Note: `1.65` is a code-specific literal, kept because it was tuned for line-number alignment with Shiki's default rendering. Out of scope to tokenize in PR1.

- [ ] **Step 6: Replace inline code font-size**

Replace (currently at lines 346–354):

```css
.prose-kr code:not(pre code) {
  font-family: var(--font-mono);
  font-size: 0.88em;
  font-weight: 500;
  ...
}
```

With:

```css
.prose-kr code:not(pre code) {
  font-family: var(--font-mono);
  font-size: var(--text-code-inline);
  font-weight: var(--weight-medium);
  color: var(--code-inline-fg);
  background-color: color-mix(in oklab, var(--code-inline-fg) 10%, var(--background));
  padding: 0.2em 0.45em;
  border-radius: var(--radius-sm);
}
```

Note: we replace `0.88em` with `--text-code-inline` (0.9em). Intentional normalization — `0.9em` is more common and aligns with `.prose-kr table code` (currently `0.88em`). Keep both in sync.

Also update the table inline-code rule (lines 506–508):

```css
.prose-kr table code:not(pre code) {
  font-size: 0.88em;
}
```

Replace with:

```css
.prose-kr table code:not(pre code) {
  font-size: var(--text-code-inline);
}
```

- [ ] **Step 7: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: build succeeds.

- [ ] **Step 8: Start dev server and sanity-check body/h2/h3/code rendering**

Start dev server in background:
```bash
PORT=3010 pnpm dev
```
(Use `run_in_background: true`.)

Open `http://blog.localhost:3010/` in browser. Verify at mobile (375px) and desktop widths:
- Post body reads with comfortable line-height (~1.75)
- H2 has top border and 22px (mobile) / 24px (desktop)
- H3 is 18px (mobile) / 19px (desktop)
- Inline `code` is teal, ~0.9em
- Code blocks preserve chrome + line numbers

- [ ] **Step 9: Commit**

```bash
git add app/globals.css
git commit -m "refactor(globals): refactor .prose-kr rules to reference typography tokens

Body, h2, h3, plain pre, figure pre, inline code, table inline code
now read font-size/line-height/font-weight from --text-* and
--leading-*/--weight-* tokens. Behavior preserved; line-height on body
normalized from 1.5 to --leading-relaxed (1.75), and inline-code
font-size normalized from 0.88em to --text-code-inline (0.9em).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — i18n + Settings wiring

### Task 7: Add font-size i18n message keys

**Files:**
- Modify: `lib/i18n/messages.ts`

- [ ] **Step 1: Add four new message keys**

In the `MESSAGES` object, immediately after the `'settings.lang.en'` entry (currently line 41), before the closing `} as const`, add:

```ts
  'settings.font':             { ko: '폰트 크기',         en: 'Font size' },
  'settings.font.small':       { ko: '작게',              en: 'Small' },
  'settings.font.normal':      { ko: '보통',              en: 'Normal' },
  'settings.font.large':       { ko: '크게',              en: 'Large' },
```

Final snippet (for reference, showing surrounding context):

```ts
  'settings.language':         { ko: '언어',              en: 'Language' },
  'settings.lang.ko':          { ko: '한국어',            en: 'Korean' },
  'settings.lang.en':          { ko: '영어',              en: 'English' },
  'settings.font':             { ko: '폰트 크기',         en: 'Font size' },
  'settings.font.small':       { ko: '작게',              en: 'Small' },
  'settings.font.normal':      { ko: '보통',              en: 'Normal' },
  'settings.font.large':       { ko: '크게',              en: 'Large' },
} as const
```

- [ ] **Step 2: Verify types**

Run: `pnpm type-check`
Expected: exit 0. New keys appear in `MessageKey` union automatically.

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/messages.ts
git commit -m "feat(i18n): add font-size message keys

settings.font plus three options (small/normal/large) in ko/en.
Consumers: SettingsPanel font section (Task 11).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Extend `SettingsProvider` with `fontSize` field

**Files:**
- Modify: `components/providers/SettingsProvider.tsx`
- Create: `tests/settings-font-size.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/settings-font-size.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { normalizeFontSize } from '@/components/providers/SettingsProvider'

describe('normalizeFontSize', () => {
  it('accepts valid values', () => {
    expect(normalizeFontSize('small')).toBe('small')
    expect(normalizeFontSize('normal')).toBe('normal')
    expect(normalizeFontSize('large')).toBe('large')
  })

  it('defaults to "normal" for invalid inputs', () => {
    expect(normalizeFontSize(undefined)).toBe('normal')
    expect(normalizeFontSize(null)).toBe('normal')
    expect(normalizeFontSize('xlarge')).toBe('normal')
    expect(normalizeFontSize(42)).toBe('normal')
    expect(normalizeFontSize({})).toBe('normal')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/settings-font-size.test.ts`
Expected: FAIL — `normalizeFontSize` is not exported.

- [ ] **Step 3: Extend `SettingsProvider.tsx` — types, defaults, validator**

Replace the existing type declarations at the top of the file (currently lines 12–23):

```ts
export type CardLayout = 'editorial' | 'timeline' | 'floating'
export type Language = 'en' | 'ko'

export interface Settings {
  cardLayout: CardLayout
  language: Language
}

const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'timeline',
  language: 'en',
}
```

With:

```ts
export type CardLayout = 'editorial' | 'timeline' | 'floating'
export type Language = 'en' | 'ko'
export type FontSize = 'small' | 'normal' | 'large'

export interface Settings {
  cardLayout: CardLayout
  language: Language
  fontSize: FontSize
}

const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'timeline',
  language: 'en',
  fontSize: 'normal',
}
```

Then, immediately after the existing `normalizeCardLayout` function (currently around line 49), add:

```ts
export function normalizeFontSize(value: unknown): FontSize {
  return value === 'small' || value === 'normal' || value === 'large'
    ? value
    : 'normal'
}
```

Next, update `loadSettings` to read `fontSize`.

Replace the existing function body (currently lines 51–63):

```ts
function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>
    return {
      cardLayout: normalizeCardLayout(parsed.cardLayout),
      language: normalizeLanguage(parsed.language),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}
```

With:

```ts
function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>
    return {
      cardLayout: normalizeCardLayout(parsed.cardLayout),
      language: normalizeLanguage(parsed.language),
      fontSize: normalizeFontSize(parsed.fontSize),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/settings-font-size.test.ts`
Expected: PASS (5 assertions).

- [ ] **Step 5: Run full type-check**

Run: `pnpm type-check`
Expected: exit 0. Any consumer that previously destructured `Settings` without expecting `fontSize` is still fine because the new field is required by the interface but `DEFAULT_SETTINGS` now includes it — and `loadSettings` returns it, so Provider state is always complete.

- [ ] **Step 6: Commit**

```bash
git add components/providers/SettingsProvider.tsx tests/settings-font-size.test.ts
git commit -m "feat(settings): add fontSize field with small/normal/large validator

Extends Settings type, DEFAULT_SETTINGS (normal), loadSettings parser,
and exposes normalizeFontSize() as a named export (tested via vitest).
The data-font-size DOM sync happens in Task 9.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Add `data-font-size` DOM sync effect

**Files:**
- Modify: `components/providers/SettingsProvider.tsx`

- [ ] **Step 1: Add sync effect inside `SettingsProvider`**

Find the existing `SettingsProvider` function (starts around line 73). Immediately after the existing `useEffect` that calls `setSettings(loadSettings())`, add a second effect that mirrors `fontSize` to `html[data-font-size]`.

Current code (around lines 73–89):

```tsx
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const updateSetting = useCallback(
```

Insert the new effect immediately after the closing `}, [])` of the first effect:

```tsx
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  useEffect(() => {
    document.documentElement.dataset.fontSize = settings.fontSize
  }, [settings.fontSize])

  const updateSetting = useCallback(
```

- [ ] **Step 2: Verify type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/providers/SettingsProvider.tsx
git commit -m "feat(settings): sync fontSize to html[data-font-size]

Simple effect keyed on settings.fontSize writes the attribute whenever
the setting changes. Initial render shows data-font-size='normal'
(default state); post-hydration effect runs with the loaded value.
Pre-hydration FOUC prevention arrives in Task 10.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Add pre-hydration script to `app/layout.tsx` via `next/script`

**Files:**
- Modify: `app/layout.tsx`

**Why `next/script` instead of a raw `<script>` tag:** Next.js' `next/script` component with `strategy="beforeInteractive"` is the documented pattern for pre-hydration scripts in App Router. It injects the script into the document head early (before React hydration) and handles XSS-safe serialization of the children string — no raw innerHTML API needed. This is the same pattern `next-themes` uses internally.

- [ ] **Step 1: Import `Script` from `next/script`**

At the top of `app/layout.tsx`, add the import alongside the existing imports:

```tsx
import Script from 'next/script'
```

- [ ] **Step 2: Add the `<Script>` tag as first child of `<body>`**

In the `RootLayout` function, modify the body opening (currently lines 82–84):

```tsx
    <html lang="ko" className={`${paperlogy.variable} ${pretendard.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
```

Insert a `<Script>` component as the first child of `<body>`, before `<ThemeProvider>`:

```tsx
    <html lang="ko" className={`${paperlogy.variable} ${pretendard.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <Script id="font-size-init" strategy="beforeInteractive">
          {`try{var s=localStorage.getItem('deep-settings');if(s){var f=JSON.parse(s).fontSize;if(f==='small'||f==='large'||f==='normal'){document.documentElement.dataset.fontSize=f}}}catch(e){}`}
        </Script>
        <ThemeProvider>
```

The script body runs before React hydrates. It reads `deep-settings` from localStorage, parses JSON, validates `fontSize`, and writes `data-font-size` on the `<html>` element. Any failure (no storage key, malformed JSON, SSR environment) is silently swallowed — the CSS defaults (`--text-scale: 1`) handle the fallback path.

- [ ] **Step 3: Verify `suppressHydrationWarning` remains**

It already does, on the `<html>` element (line 82). React will not complain about the attribute mismatch between server-rendered (`data-font-size` absent) and client-rendered (`data-font-size="normal|small|large"`).

- [ ] **Step 4: Verify build**

Run: `pnpm build 2>&1 | tail -20`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(layout): add pre-hydration font-size sync script

next/script with strategy=beforeInteractive reads
localStorage['deep-settings'].fontSize and sets
document.documentElement.dataset.fontSize before React hydrates,
preventing a flash of wrong font-scale on first paint. Static
literal children — XSS-safe.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Add Font-size section to `SettingsPanel`

**Files:**
- Modify: `components/layout/SettingsPanel.tsx`

- [ ] **Step 1: Import the new `FontSize` type**

In the existing import from `@/components/providers/SettingsProvider` (currently lines 6–10), add `type FontSize`:

```tsx
import {
  useSettings,
  type CardLayout,
  type FontSize,
  type Language,
} from '@/components/providers/SettingsProvider'
```

- [ ] **Step 2: Add the options constant after `LANGUAGE_OPTIONS`**

Currently lines 26–29 define `LANGUAGE_OPTIONS`. Immediately after it, add:

```tsx
const FONT_SIZE_OPTIONS: { value: FontSize; labelKey: MessageKey }[] = [
  { value: 'small',  labelKey: 'settings.font.small' },
  { value: 'normal', labelKey: 'settings.font.normal' },
  { value: 'large',  labelKey: 'settings.font.large' },
]
```

- [ ] **Step 3: Add the Font-size section to the panel body**

Inside the panel body `<div className="py-2">` (currently lines 86–137), the existing sections are: Theme (card layout) → Divider → Language. Append another Divider + Font-size section **after** the Language section. Find the closing `</div>` of the Language section (at line 137) and the existing `</div>` that closes the whole body (line 138).

Insert immediately before the body-closing `</div>` (line 138):

```tsx
        {/* Divider */}
        <div className="border-t border-border" />

        {/* Font Size Section */}
        <div className="px-5 py-3">
          <div className="mb-2.5 text-[length:var(--text-settings-header)] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.font')}
          </div>
          <div className="flex gap-2">
            {FONT_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSetting('fontSize', opt.value)}
                className={cn(
                  'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[length:var(--text-button)] font-semibold transition-all',
                  settings.fontSize === opt.value
                    ? 'border-primary bg-accent text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-border-strong',
                )}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>
```

Note: this matches the Language section's visual style (text-only buttons, no mini icons) because font-size is an abstract numeric preference rather than a layout shape.

- [ ] **Step 4: Migrate SettingsPanel's own typography hardcodes to tokens**

Now replace the remaining `text-[Npx]` literals in `SettingsPanel.tsx`.

Replace (line 74):

```tsx
        <h3 className="text-[15px] font-bold tracking-tight">{t('settings.title')}</h3>
```

With:

```tsx
        <h3 className="text-[length:var(--text-settings-title)] font-bold tracking-tight">{t('settings.title')}</h3>
```

Replace (line 89 — Theme section header):

```tsx
          <div className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.theme')}
          </div>
```

With:

```tsx
          <div className="mb-2.5 text-[length:var(--text-settings-header)] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.theme')}
          </div>
```

Replace (line 106 — layout option label):

```tsx
                <span className="text-[11px] font-semibold">{t(opt.labelKey)}</span>
```

With:

```tsx
                <span className="text-[length:var(--text-caption)] font-semibold">{t(opt.labelKey)}</span>
```

Replace (line 117 — Language section header):

```tsx
          <div className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.language')}
          </div>
```

With:

```tsx
          <div className="mb-2.5 text-[length:var(--text-settings-header)] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.language')}
          </div>
```

Replace (line 127 — Language button):

```tsx
                className={cn(
                  'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[12.5px] font-semibold transition-all',
```

With:

```tsx
                className={cn(
                  'flex-1 rounded-lg border-[1.5px] px-3 py-2 text-[length:var(--text-button)] font-semibold transition-all',
```

(Note: the original Language button used 12.5px while layout labels use 11px. We fold both to their nearest semantic token: `--text-button` (13px scaled) for the language/font-size button groups, `--text-caption` (11px scaled) for the compact layout chips. This is the point of the refactor — two similar UI fragments that differed by 1.5px now align under one semantic role.)

- [ ] **Step 5: Verify type-check + build**

Run: `pnpm type-check && pnpm build 2>&1 | tail -10`
Expected: both succeed.

- [ ] **Step 6: Manual smoke — toggle font-size**

If the dev server from Task 6 is still running, open `http://blog.localhost:3010/`, click the Settings FAB (bottom-right), and toggle between 작게 / 보통 / 크게. Expected:
- Panel title, section headers, and option labels all shift size.
- Post body, headings, nav — **nothing else should be shifting yet** because migration is Phase 3. Only `.prose-kr` (via Task 6 refactor) and the panel itself (this task) currently reference tokens.
- Setting persists across page refresh.

- [ ] **Step 7: Commit**

```bash
git add components/layout/SettingsPanel.tsx
git commit -m "feat(settings): add font-size section and migrate panel typography

New section after Language (작게/보통/크게) writes settings.fontSize.
Panel's own text-[15px], text-[11.5px], text-[11px], text-[12.5px]
hardcodes migrate to --text-settings-title, --text-settings-header,
--text-caption, --text-button. Two similar button styles (language,
font-size) now share --text-button.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Component migration

### Task 12: Migration mapping reference (no code change)

This is a reference task — not a code step, but a lookup table the migration tasks will use.

**Typography class → semantic token mapping (use in Tasks 13–19):**

| Before (Tailwind class / arbitrary) | Intended role | After |
|---|---|---|
| `text-[10px]` | Hint, kbd badge | `text-[length:var(--text-hint)]` |
| `text-[11px]`, `text-[11.5px]`, `text-xs` (generic caption) | Caption / footer / small label | `text-[length:var(--text-caption)]` |
| `text-[11px]` (nav header "ON THIS PAGE") | Nav section label | `text-[length:var(--text-nav-header)]` |
| `text-xs` (post meta: date, reading time) | Meta | `text-[length:var(--text-meta)]` |
| `text-[12px]`, `text-[12.5px]`, `text-[13px]` | Body-sm / search-summary | `text-[length:var(--text-body-sm)]` or `text-[length:var(--text-search-summary)]` |
| `text-sm` (TOC items, nav links) | Nav item | `text-[length:var(--text-nav-item)]` |
| `text-sm` (button labels) | Button | `text-[length:var(--text-button)]` |
| `text-sm` (search result title) | Search title | `text-[length:var(--text-search-title)]` |
| `text-base` / `text-[15px]` | Body default, callout body | `text-[length:var(--text-body)]` or `text-[length:var(--text-callout-body)]` |
| `text-[17px]` (DEEP logo, menu primary) | Menu | `text-[length:var(--text-menu)]` |
| `text-lg` | h4 | `text-[length:var(--text-h4)]` |
| `text-xl`, `text-[19px]` | h3 desktop | `text-[length:var(--text-h3)]` |
| `text-2xl`, `text-[22px]` | h2 | `text-[length:var(--text-h2)]` |
| `text-3xl`, `text-[24px]`, `text-[28px]` | h1 | `text-[length:var(--text-h1)]` |
| `text-[11px]` in tag chip | Badge | `text-[length:var(--text-badge)]` |

**Font weight:**
| Before | After |
|---|---|
| `font-normal` | keep as-is (Tailwind maps to 400 = `--weight-regular`) |
| `font-medium` | keep as-is (500 = `--weight-medium`) |
| `font-semibold` | keep as-is (600 = `--weight-semibold`) |
| `font-bold` | keep as-is (700 = `--weight-bold`) |
| `font-[450]` or other arbitrary | migrate to `font-[var(--weight-*)]` |

**Decision: keep Tailwind's named weight utilities.** They map to 400/500/600/700 — our primitives define the same numbers. Only migrate `font-[Nxx]` arbitrary values (rare). Line-height similarly: keep `leading-*` named utilities unless the value is arbitrary.

**Rationale:** The goal is user-adjustable *size*, not user-adjustable weight or line-height. Keeping Tailwind's weight names preserves diff readability without losing token-system benefits.

**When picking between ambiguous semantic targets** (e.g., a 13px text could be `--text-body-sm` or `--text-search-summary`), choose based on the component's role:
- Post/body text context → `--text-body` / `--text-body-sm` / `--text-meta`
- Search dialog → `--text-search-*`
- Callout → `--text-callout-*`
- Navigation (header menu, category nav, TOC) → `--text-menu` / `--text-nav-*`
- Inline code → `--text-code-inline`
- Code block → `--text-code-block`

No step here — this is reference material for the rest of Phase 3.

---

### Task 13: Migrate header region — `Header.tsx`, `HeaderActions.tsx`, `MobileOverlays.tsx`, `ThemeToggle.tsx`

**Files:**
- Modify: `components/blog/Header.tsx`
- Modify: `components/blog/HeaderActions.tsx`
- Modify: `components/blog/MobileOverlays.tsx`
- Modify: `components/blog/ThemeToggle.tsx`

- [ ] **Step 1: Inspect current classes**

Run: `grep -n 'text-\[\|text-xs\|text-sm\|text-base\|text-lg' components/blog/Header.tsx components/blog/HeaderActions.tsx components/blog/MobileOverlays.tsx components/blog/ThemeToggle.tsx`

Note each occurrence and its context (logo, placeholder, title, result, etc.).

- [ ] **Step 2: `HeaderActions.tsx` — DEEP logo + search kbd hint**

Replace every `text-[17px]` (DEEP logo) with `text-[length:var(--text-menu)]`.
Replace every `text-[10px]` (⌘K badge) with `text-[length:var(--text-hint)]`.
Replace every `text-sm` inside the search-button placeholder text with `text-[length:var(--text-search-input)]` (the trigger mimics the search input).

Example edit (illustrative — exact surrounding context may differ):

Before:
```tsx
<span className="text-[17px] font-bold">DEEP</span>
...
<span className="text-sm text-muted-foreground">Search...</span>
...
<kbd className="text-[10px]">⌘K</kbd>
```

After:
```tsx
<span className="text-[length:var(--text-menu)] font-bold">DEEP</span>
...
<span className="text-[length:var(--text-search-input)] text-muted-foreground">Search...</span>
...
<kbd className="text-[length:var(--text-hint)]">⌘K</kbd>
```

- [ ] **Step 3: `Header.tsx`**

Replace any `text-sm` used for nav links with `text-[length:var(--text-nav-item)]`. If `Header.tsx` only contains layout with no typography classes, no change needed — confirm via grep.

- [ ] **Step 4: `MobileOverlays.tsx` — search + nav overlays**

From the audit: `text-base` (input), `text-sm` (no-results / result title), `text-xs` (result summary), plus search-related `text-sm` hits.

Replacements:
- Search input `text-base` → `text-[length:var(--text-search-input)]`
- "No results" `text-sm` → `text-[length:var(--text-body-sm)]`
- Result title `text-sm` → `text-[length:var(--text-search-title)]`
- Result summary `text-xs` → `text-[length:var(--text-search-summary)]`

(If grep reveals additional `text-*` not listed here, map using Task 12's table.)

- [ ] **Step 5: `ThemeToggle.tsx`**

Typically contains only an icon button. Replace any `text-sm` / `text-xs` on tooltips or labels with `--text-button` / `--text-caption` respectively.

- [ ] **Step 6: Verify build + manual smoke**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5`
Expected: both succeed.

Open dev server, verify:
- DEEP logo in header renders correctly, scales with font-size setting.
- ⌘K badge renders at ~10px (small preset: ~9.2px, large: ~11px).
- Mobile menu / search overlays render correctly.

- [ ] **Step 7: Commit**

```bash
git add components/blog/Header.tsx components/blog/HeaderActions.tsx components/blog/MobileOverlays.tsx components/blog/ThemeToggle.tsx
git commit -m "refactor(header): migrate header typography to semantic tokens

DEEP logo, search trigger text, ⌘K hint, mobile overlays all read
from --text-menu / --text-search-* / --text-hint. Font-scale setting
now affects the header.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Migrate navigation — `CategoryNav.tsx`, `IndexCategoryNav.tsx`, `TableOfContents.tsx`

**Files:**
- Modify: `components/blog/CategoryNav.tsx`
- Modify: `components/blog/IndexCategoryNav.tsx`
- Modify: `components/blog/TableOfContents.tsx`

- [ ] **Step 1: `CategoryNav.tsx`**

From the audit: `text-[11px]` (category summary — the `<summary>` of each `<details>`), `text-sm` (post links inside).

Replacements:
- `text-[11px]` → `text-[length:var(--text-nav-header)]`
- `text-sm` → `text-[length:var(--text-nav-item)]`

- [ ] **Step 2: `IndexCategoryNav.tsx`**

This is the homepage variant. Grep:

```bash
grep -n 'text-\[' components/blog/IndexCategoryNav.tsx
```

Map using the same rule (category header → `--text-nav-header`, items → `--text-nav-item`).

- [ ] **Step 3: `TableOfContents.tsx`**

From the audit: `text-xs` (the "ON THIS PAGE" header), `text-sm` (TOC item links).

Replacements:
- `text-xs` (header label) → `text-[length:var(--text-nav-header)]`
- `text-sm` (item links) → `text-[length:var(--text-nav-item)]`

- [ ] **Step 4: Verify**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5`
Expected: both succeed.

Open a post page, verify:
- Right rail TOC renders with header in small caps, items below.
- Left rail category nav: summaries uppercase, items legible.
- Scale via Settings shifts both rails simultaneously.

- [ ] **Step 5: Commit**

```bash
git add components/blog/CategoryNav.tsx components/blog/IndexCategoryNav.tsx components/blog/TableOfContents.tsx
git commit -m "refactor(nav): migrate category-nav and TOC typography to tokens

CategoryNav, IndexCategoryNav, TableOfContents read --text-nav-header
(section labels) and --text-nav-item (links). Font-scale now affects
both doc-shell rails.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Migrate post card components — `PostCardTimeline.tsx`, `PostCardEditorial.tsx`, `PostCardFloating.tsx`, `RelatedPost.tsx`

**Files:**
- Modify: `components/blog/PostCardTimeline.tsx`
- Modify: `components/blog/PostCardEditorial.tsx`
- Modify: `components/blog/PostCardFloating.tsx`
- Modify: `components/blog/RelatedPost.tsx`

- [ ] **Step 1: Grep each card file**

Run:
```bash
for f in components/blog/PostCardTimeline.tsx components/blog/PostCardEditorial.tsx components/blog/PostCardFloating.tsx components/blog/RelatedPost.tsx; do
  echo "=== $f ==="
  grep -n 'text-\[\|text-xs\|text-sm\|text-base\|text-lg\|text-xl\|text-2xl' "$f"
done
```

Copy the grep output — that is your exact edit list.

- [ ] **Step 2: Apply the Task-12 mapping**

For each match, pick the semantic target:
- Post title (large, usually `text-xl`, `text-2xl`, `text-[24px]`, or `text-lg`) → `--text-h3` or `--text-h4` by visual hierarchy (card titles are typically below h2 of enclosing page)
- Date / reading time → `--text-meta`
- Summary / excerpt text (`text-sm` / `text-base`) → `--text-body-sm`
- Tag chips inside the card → `--text-badge`
- Category label → `--text-caption`

Concrete example — a typical card structure in `PostCardTimeline.tsx`:

Before:
```tsx
<h3 className="text-lg font-semibold tracking-tight">{post.title}</h3>
<p className="text-sm text-muted-foreground">{post.excerpt}</p>
<span className="text-xs text-muted-foreground">{formattedDate} · {readingTime}</span>
<span className="text-[11px] font-medium">{category}</span>
```

After:
```tsx
<h3 className="text-[length:var(--text-h4)] font-semibold tracking-tight">{post.title}</h3>
<p className="text-[length:var(--text-body-sm)] text-muted-foreground">{post.excerpt}</p>
<span className="text-[length:var(--text-meta)] text-muted-foreground">{formattedDate} · {readingTime}</span>
<span className="text-[length:var(--text-caption)] font-medium">{category}</span>
```

`RelatedPost.tsx` and the other two cards follow the same logic — match each grep result against Task 12's table.

- [ ] **Step 3: Verify type-check and build**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5`
Expected: both succeed.

Open homepage, verify all three card layouts (Timeline default, Editorial, Floating) via Settings → 테마. Confirm card titles, dates, tags all scale with font-size.

- [ ] **Step 4: Commit**

```bash
git add components/blog/PostCardTimeline.tsx components/blog/PostCardEditorial.tsx components/blog/PostCardFloating.tsx components/blog/RelatedPost.tsx
git commit -m "refactor(cards): migrate post card typography to semantic tokens

Timeline, Editorial, Floating, and RelatedPost cards read from
--text-h4 (titles), --text-body-sm (excerpts), --text-meta (dates),
--text-badge (tags), --text-caption (category). All three home layouts
respect font-scale.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Migrate metadata + misc blog components

**Files:**
- Modify: `components/blog/PostMeta.tsx`
- Modify: `components/blog/TagChip.tsx`
- Modify: `components/blog/TagPageHeader.tsx`
- Modify: `components/blog/KeywordLink.tsx`
- Modify: `components/blog/SortSelect.tsx`
- Modify: `components/blog/Footer.tsx`
- Modify: `components/blog/RecentPostsSection.tsx`
- Modify: `components/blog/PostList.tsx`
- Modify: `components/blog/HeroIntro.tsx`
- Modify: `components/blog/BlogHomeClient.tsx`
- Modify: `app/posts/[slug]/page.tsx`

- [ ] **Step 1: Grep all files at once**

Run:
```bash
for f in components/blog/PostMeta.tsx components/blog/TagChip.tsx components/blog/TagPageHeader.tsx components/blog/KeywordLink.tsx components/blog/SortSelect.tsx components/blog/Footer.tsx components/blog/RecentPostsSection.tsx components/blog/PostList.tsx components/blog/HeroIntro.tsx components/blog/BlogHomeClient.tsx app/posts/\[slug\]/page.tsx; do
  echo "=== $f ==="
  grep -n 'text-\[\|text-xs\|text-sm\|text-base\|text-lg\|text-xl\|text-2xl\|text-3xl\|text-4xl' "$f"
done
```

- [ ] **Step 2: Apply Task-12 mapping**

Per-file role guidance:
- **`PostMeta.tsx`** — date/reading-time/author line under post title. `text-xs` / `text-sm` → `--text-meta`.
- **`TagChip.tsx`** — tag pill. `text-[11px]` / `text-xs` → `--text-badge`.
- **`TagPageHeader.tsx`** — tag index header (post count, back link). Title-size text → `--text-h2`, back-link → `--text-nav-item`, count → `--text-meta`.
- **`KeywordLink.tsx`** — popover content inside the keyword popover. Title → `--text-body`, summary → `--text-body-sm`, meta → `--text-meta`.
- **`SortSelect.tsx`** — the `<select>` / button group. Labels → `--text-button` (click targets).
- **`Footer.tsx`** — small print. `text-xs` → `--text-caption`.
- **`RecentPostsSection.tsx`** — "최근 글" section. Heading → `--text-h3` or `--text-h4`; preview items render via their card component (migrated in Task 15).
- **`PostList.tsx`** — list container; mainly renders cards. Empty state uses `text-sm` → `--text-body-sm`.
- **`HeroIntro.tsx`** — overlay text (session-once intro). Heading → `--text-h1`, subtitle → `--text-body-sm`, scroll hint → `--text-caption`. **Do not** touch animation timing constants (`IDLE_GAP`, `COMMIT_DELTA`, etc.) — those are unrelated logic constants.
- **`BlogHomeClient.tsx`** — top-level client. Typically `text-sm` / `text-xs` for filter UI; map per role (filter chip → `--text-button`, counter → `--text-meta`).
- **`app/posts/[slug]/page.tsx`** — post-page shell. Usually contains the `<h1>` for the post title (→ `--text-h1`) and surrounding meta.

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5`
Expected: both succeed.

Navigate to: homepage, a tag page (`/tags/<slug>`), a post page, an index category scope. Toggle font-size at each. Confirm no stray `text-[Npx]` literals remain in these files:

```bash
grep -n 'text-\[[0-9]' components/blog/PostMeta.tsx components/blog/TagChip.tsx components/blog/TagPageHeader.tsx components/blog/KeywordLink.tsx components/blog/SortSelect.tsx components/blog/Footer.tsx components/blog/RecentPostsSection.tsx components/blog/PostList.tsx components/blog/HeroIntro.tsx components/blog/BlogHomeClient.tsx app/posts/\[slug\]/page.tsx
```
Expected: no output (only `text-[length:var(...)]` hits, which match the pattern but are what we want — those should remain).

- [ ] **Step 4: Commit**

```bash
git add components/blog/PostMeta.tsx components/blog/TagChip.tsx components/blog/TagPageHeader.tsx components/blog/KeywordLink.tsx components/blog/SortSelect.tsx components/blog/Footer.tsx components/blog/RecentPostsSection.tsx components/blog/PostList.tsx components/blog/HeroIntro.tsx components/blog/BlogHomeClient.tsx app/posts/[slug]/page.tsx
git commit -m "refactor(blog): migrate metadata, list, hero, tag typography to tokens

PostMeta/TagChip/TagPageHeader/KeywordLink/SortSelect/Footer/
RecentPostsSection/PostList/HeroIntro/BlogHomeClient and post page
shell all read from --text-meta/--text-badge/--text-h*/--text-body*
as role-appropriate. Font-scale now covers the full index + post
reading flow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 17: Migrate MDX components — `components.tsx`, `Callout.tsx`, `Tabs.tsx`, `TabsView.tsx`

**Files:**
- Modify: `components/mdx/components.tsx`
- Modify: `components/mdx/Callout.tsx`
- Modify: `components/mdx/Tabs.tsx`
- Modify: `components/mdx/TabsView.tsx`

- [ ] **Step 1: Grep**

Run:
```bash
for f in components/mdx/components.tsx components/mdx/Callout.tsx components/mdx/Tabs.tsx components/mdx/TabsView.tsx; do
  echo "=== $f ==="
  grep -n 'text-\[\|text-xs\|text-sm\|text-base\|text-lg\|text-xl' "$f"
done
```

- [ ] **Step 2: `components.tsx` — MDX element overrides**

This file defines overrides for `h1` / `h2` / `h3` / `h4` / `p` / `a` / `ul` / `ol` / `li` / `table` / `img` etc. Most typography lives in `.prose-kr` (already refactored in Task 6). The `components.tsx` overrides typically handle structural wrappers (e.g., `<div className="table-wrapper">`), so often **no typography changes are needed here**. If grep finds any `text-*` classes, map per Task 12.

- [ ] **Step 3: `Callout.tsx` — body + label**

From the audit: `text-[15px]` (body).
- Body `text-[15px]` → `text-[length:var(--text-callout-body)]`
- Title label (NOTE / WARNING / etc., likely `text-sm` or `text-xs`) → `text-[length:var(--text-callout-label)]`

Note: Callout *colors* (amber for WARN, red for DANGER) are PR3 scope. Only touch typography here.

- [ ] **Step 4: `Tabs.tsx` and `TabsView.tsx`**

Triggers (tab buttons) usually use `text-sm`. Map to `--text-button`.
Content inside tabs inherits `.prose-kr` — typically no change.

**Respect the CLAUDE.md §6 invariant:** `Tabs.tsx` stays a Server Component, `TabsView.tsx` stays Client. Do not change the RSC boundary — only replace `text-*` classes.

- [ ] **Step 5: Verify**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5`
Expected: both succeed.

Open a post that contains `<Callout>` and `<Tabs>` blocks (e.g., `content/posts/claude-code-primer.mdx`). Verify:
- Callout body text scales with font-size.
- Tab trigger labels scale.
- **Both tabs render** (smoke check for the Tabs RSC invariant).

- [ ] **Step 6: Commit**

```bash
git add components/mdx/components.tsx components/mdx/Callout.tsx components/mdx/Tabs.tsx components/mdx/TabsView.tsx
git commit -m "refactor(mdx): migrate MDX component typography to tokens

Callout body/label → --text-callout-*, Tabs trigger → --text-button.
components.tsx overrides unchanged (typography handled by .prose-kr).
RSC boundary preserved.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 18: Migrate shadcn UI primitives — `badge.tsx`, `button.tsx`, `input.tsx`, `select.tsx`

**Files:**
- Modify: `components/ui/badge.tsx`
- Modify: `components/ui/button.tsx`
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/select.tsx`

- [ ] **Step 1: Grep**

Run:
```bash
for f in components/ui/badge.tsx components/ui/button.tsx components/ui/input.tsx components/ui/select.tsx; do
  echo "=== $f ==="
  grep -n 'text-\[\|text-xs\|text-sm\|text-base\|text-lg' "$f"
done
```

- [ ] **Step 2: Apply per-primitive mapping**

- `badge.tsx` — `text-xs` / `text-[Npx]` → `text-[length:var(--text-badge)]`
- `button.tsx` — default `text-sm`; variant sizes map as: sm→`--text-caption`, default→`--text-button`, lg→`--text-body`
- `input.tsx` — `text-sm` / `text-base` → `text-[length:var(--text-body)]` (form input body size)
- `select.tsx` — same rule as `input.tsx` for the trigger; items use `--text-button`

- [ ] **Step 3: Verify build + regression check**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5`
Expected: both succeed.

These are primitives consumed by many components — do a site-wide visual scan:
- Any `<Button>` (settings panel, pagination, etc.) still reads correctly
- Any `<Badge>` (tag chips, category chips) unchanged
- Any `<Input>` (search dialog, form fields) unchanged

- [ ] **Step 4: Commit**

```bash
git add components/ui/badge.tsx components/ui/button.tsx components/ui/input.tsx components/ui/select.tsx
git commit -m "refactor(ui): migrate shadcn primitive typography to tokens

badge → --text-badge, button → --text-button / --text-caption /
--text-body (by variant), input/select trigger → --text-body.
Downstream consumers automatically pick up the scale.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 19: Migrate visualization chrome — `VisualContainer.tsx`, `StepController.tsx`, `SpeedSlider.tsx`

**Files:**
- Modify: `components/visualizations/common/VisualContainer.tsx`
- Modify: `components/visualizations/common/StepController.tsx`
- Modify: `components/visualizations/common/SpeedSlider.tsx`

- [ ] **Step 1: Grep**

Run:
```bash
for f in components/visualizations/common/VisualContainer.tsx components/visualizations/common/StepController.tsx components/visualizations/common/SpeedSlider.tsx; do
  echo "=== $f ==="
  grep -n 'text-\[\|text-xs\|text-sm\|text-base' "$f"
done
```

- [ ] **Step 2: Apply role-based mapping**

- **`VisualContainer.tsx`** — renders an outer figure with optional caption. Caption `text-xs` / `text-sm` → `--text-caption`. Title (if present) → `--text-h4`.
- **`StepController.tsx`** — step counter + prev/next buttons. Button labels → `--text-button`, step-counter meta → `--text-meta`.
- **`SpeedSlider.tsx`** — "1x / 2x" speed labels. Labels → `--text-caption`.

**Do NOT touch** internal viz files (`BTreeInsert.tsx`, `QuickSort.tsx`, `CardinalitySpectrum.tsx`, etc.). Their `text-[…]` classes are SVG label coordinates or sizes tied to viz logic — out of scope.

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5`
Expected: both succeed.

Open a post with a visualization (e.g., `quick-sort.mdx`, `b-tree-structure.mdx`). Confirm:
- Chrome (container title, caption, step counter, speed labels) scales with font-size.
- SVG content inside is unchanged (by design — logic constants stay).

- [ ] **Step 4: Commit**

```bash
git add components/visualizations/common/VisualContainer.tsx components/visualizations/common/StepController.tsx components/visualizations/common/SpeedSlider.tsx
git commit -m "refactor(viz): migrate visualization chrome typography to tokens

VisualContainer caption/title, StepController button/counter,
SpeedSlider labels read from --text-* semantic tokens. Internal SVG
label sizes untouched (logic constants).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 — Verification

### Task 20: Full project verification

- [ ] **Step 1: Run lint**

Run: `pnpm lint 2>&1 | tail -30`
Expected: exit 0 or only pre-existing warnings (no new errors introduced by this PR). If new errors surface, fix them and re-run.

- [ ] **Step 2: Run type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 3: Run tests**

Run: `pnpm test 2>&1 | tail -20`
Expected: all tests pass, including the new `tests/settings-font-size.test.ts`.

- [ ] **Step 4: Run full build**

Run: `pnpm build 2>&1 | tail -30`
Expected: `✓ Compiled successfully` (or similar). No ESM/module errors, no CSS parse errors.

- [ ] **Step 5: Final hardcoded-text scan (diagnostic)**

Run to see what's left:
```bash
grep -rn 'text-\[[0-9]\+\(\.[0-9]\+\)*\(px\|rem\|em\)\]' --include="*.tsx" app components | grep -v 'components/visualizations/[A-Z]' | grep -v 'components/visualizations/common'
```

Expected output: **empty**. If any hits remain (outside viz-internal files and chrome we already migrated), they were missed — return to the appropriate Phase 3 task and finish them.

Also scan for Tailwind named scale in the same non-viz scope — these are fine to keep if role-appropriate (`text-xs` inside Tailwind-standard chrome), but anything left after migration should be deliberate:

```bash
grep -rn '\btext-\(xs\|sm\|base\|lg\|xl\|2xl\|3xl\|4xl\)\b' --include="*.tsx" app components | grep -v 'components/visualizations/[A-Z]' | grep -v 'components/visualizations/common'
```

Review each remaining hit: is it a deliberate `shadcn`-style class (e.g., a UI primitive's default), or was it missed? Tokenize or leave per Task 12's reference decision.

---

### Task 21: Manual smoke matrix

**Scenarios — all must pass before PR is opened:**

- [ ] **Step 1: Dev server + 9-combo typography smoke**

Dev server should already be running from Task 6 (port 3010). Open in browser.

Matrix — test each combo at `http://blog.localhost:3010/`:

|  | Small (작게) | Normal (보통) | Large (크게) |
|---|---|---|---|
| Mobile (375px, Chrome DevTools) | ☐ | ☐ | ☐ |
| Tablet (768px) | ☐ | ☐ | ☐ |
| Desktop (1280px) | ☐ | ☐ | ☐ |

For each of the 9 cells, verify by eye:
- Header logo shifts size
- TOC on post pages shifts
- Post body text shifts
- Callout body shifts
- Code blocks shift (font-size, not line-height)
- Post cards (title, excerpt, meta) shift
- Settings panel shifts
- No layout breakage, no clipped text, no overflowing code blocks

- [ ] **Step 2: Dark-mode crosscheck**

Repeat the 3 scale states at 1280px in dark mode (click theme toggle). Confirm:
- Same scale behavior
- Colors unchanged (PR1 is typography-only)

- [ ] **Step 3: Persistence check**

Set font-size to "크게", refresh the page. First paint should already be large (no pop from "보통" to "크게"). This verifies the pre-hydration script (Task 10).

- [ ] **Step 4: Invariants smoke**

Confirm CLAUDE.md §6 invariants still hold:
- `DocShell` 3-col grid layout unchanged
- `.prose-kr h2` has a single top border (not double)
- Hero intro appears once per session, dismisses normally
- Tabs in MDX posts show both tabs
- Korean IME input in search dialog does not drop characters
- Keyword-link popovers still open

---

### Task 22: Open the PR

- [ ] **Step 1: Verify working tree is clean**

Run: `git status`
Expected: no uncommitted changes.

- [ ] **Step 2: Push branch**

Run: `git push -u origin feature/pr1-typography-tokens`

- [ ] **Step 3: Open the PR**

```bash
gh pr create --title "PR1: Typography tokens + font-scale Settings" --body "$(cat <<'EOF'
## Summary

- Adds typography primitive + semantic alias token system in `app/globals.css`
- User-adjustable font-size in Settings panel (작게 / 보통 / 크게), default 보통, persisted in localStorage, FOUC-prevented via pre-hydration script
- Migrates ~30 components from hardcoded `text-[Npx]` / `text-xs..text-4xl` to `text-[length:var(--text-*)]` semantic tokens
- `.prose-kr` rules now read from tokens (body, h2, h3, code blocks)

Spec: `docs/superpowers/specs/2026-04-18-style-token-system-design.md`
Plan: `docs/superpowers/plans/2026-04-18-pr1-typography-tokens-and-font-scale.md`

## Scope boundary (PR1)

- **In:** typography tokens (font-size, line-height, font-weight), font-scale setting, per-role semantic aliases
- **Out:** spacing/layout tokens (PR2), color consolidation (PR3), ESLint/stylelint + CLAUDE.md (PR4), viz-internal SVG sizing (logic constants)

## Test plan

- [x] `pnpm type-check` green
- [x] `pnpm lint` green (no new errors)
- [x] `pnpm test` green (incl. new `normalizeFontSize` tests)
- [x] `pnpm build` green
- [x] 9-combo manual smoke: 3 viewports × 3 font-sizes
- [x] Dark-mode crosscheck
- [x] Persistence across page refresh (pre-hydration script verified)
- [x] CLAUDE.md §6 invariants intact (DocShell grid, h2 border, Hero once, Tabs both, IME, keyword popover)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Post-PR follow-ups (not part of this plan)

- **PR2:** Spacing + dimension tokens (`--layout-*`, `--radius-*`, `--z-*`) + migrate layout chrome.
- **PR3:** Color consolidation (Callout state tokens, arbitrary hex hunt).
- **PR4:** ESLint + stylelint enforcement; update CLAUDE.md §2/§4/§5/§6 with the new invariants (`html[data-font-size]`, scale multiplier, `text-[length:var(...)]` idiom, token documentation reference).

## Rollback

If PR1 needs to be reverted after merge:
- Token definitions in `globals.css` can stay (harmless — no consumers left).
- `SettingsProvider.fontSize` field + pre-hydration script can be ripped via `git revert`.
- Component-level migrations can be reverted incrementally (each commit in Phase 3 is self-contained).
