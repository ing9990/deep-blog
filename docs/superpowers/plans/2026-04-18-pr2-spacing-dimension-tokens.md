# PR2: Spacing · Dimension Tokens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `--layout-*`, `--z-*`, and `--radius-*` semantic tokens to `app/globals.css`, then migrate all arbitrary dimension (`w-[Npx]`, `h-[Npx]`, `top-[...]`), z-index (`z-10|20|50|100`), and radius (`rounded-[Npx]`) hardcodes across the DEEP codebase to token references. Tailwind default spacing utilities (`p-4`, `gap-2`, `mt-8`) remain untouched.

**Architecture:** Layout dimensions and z-index layers expressed as semantic tokens in `:root`. Radius semantic aliases (`--radius-chip/card/panel`) map to the existing `--radius-sm/base/lg` primitives already declared in `@theme inline`. The `DocShell` 3-col grid (288px / 1fr / 224px) and TOC sticky offset (`top-20` = 5rem) stay functionally identical — only the hardcoded literals move to token references. No new primitive scale added; Tailwind's spacing utilities remain the main spacing layer.

**Tech Stack:** Tailwind v4 (`@theme inline`) · CSS custom properties · Next.js 15 App Router (no runtime changes). No new dependencies.

---

## Prerequisites

- Worktree at `.worktrees/pr2-spacing-tokens` on branch `feature/pr2-spacing-dimension-tokens` (branched from `feature/style-token-system` @ `cafc9f3`).
- Baseline verified: `pnpm type-check` green, Velite build succeeds.
- Reference spec: `docs/superpowers/specs/2026-04-18-style-token-system-design.md` (Section 3: Layout Dimension Tokens; Section 4: Radius Tokens; Section 5: Z-index Tokens).
- PR1 (typography tokens) already merged into the integration branch.

## File Structure (plan-level overview)

### Created
- No new files.

### Modified (infrastructure — 1 file)
- `app/globals.css` — add `--layout-*`, `--z-*`, `--radius-chip|card|panel` semantic aliases in the `:root` block.

### Modified (migration — 21 files)
- **Layout chrome:** `components/layout/DocShell.tsx`, `components/layout/SettingsPanel.tsx`, `components/layout/SettingsFab.tsx`
- **Blog shell:** `components/blog/Header.tsx`, `components/blog/HeaderActions.tsx`, `components/blog/MobileOverlays.tsx`, `components/blog/ThemeToggle.tsx`
- **Post cards:** `components/blog/PostCardTimeline.tsx`, `components/blog/PostCardEditorial.tsx`, `components/blog/PostCardFloating.tsx`, `components/blog/RelatedPost.tsx`
- **Misc blog:** `components/blog/HeroIntro.tsx`, `components/blog/KeywordLink.tsx`, `components/blog/SortSelect.tsx`
- **MDX:** `components/mdx/Callout.tsx`, `components/mdx/components.tsx`, `components/mdx/TabsView.tsx`
- **UI primitives:** `components/ui/popover.tsx`, `components/ui/select.tsx`
- **Viz chrome:** `components/visualizations/common/StepController.tsx`, `components/visualizations/common/VisualContainer.tsx`

### Out of Scope (this PR)
- Tailwind default spacing (`p-4`, `gap-2`, `mt-8`, etc.) — remains the main spacing layer.
- Color consolidation — PR3.
- ESLint + stylelint enforcement + CLAUDE.md further updates — PR4.
- Visualization-internal SVG coordinates in `components/visualizations/{BTreeInsert,QuickSort,...}` — logic constants.
- New primitive spacing scale — YAGNI; Tailwind's existing scale is sufficient.

---

## Phase 1 — Token definitions in `app/globals.css`

### Task 1: Add `--layout-*` tokens

**Files:** Modify `app/globals.css` — the existing `:root` block.

- [ ] **Step 1: Locate insertion point**

Read `app/globals.css`. Find the typography semantic alias block (currently ends with `--text-settings-header: 11.5px;` inside `:root`). Layout tokens go in the same `:root` block, after the typography aliases, before the closing `}`.

- [ ] **Step 2: Insert layout tokens**

Add immediately after `--text-settings-header: 11.5px;` line:

```css

  /* ------------------------------------------------------------------
     Layout dimension tokens — fixed widths, sticky offsets, page pads,
     content caps. Consumers reference via w-[var(--layout-*)] etc.
     Only hardcoded LAYOUT literals are tokenized; Tailwind's default
     spacing scale (p-*, gap-*, m-*) stays as-is.
     ------------------------------------------------------------------ */
  --layout-nav-width:      288px;      /* DocShell left rail (CategoryNav) */
  --layout-toc-width:      224px;      /* DocShell right rail (TOC) */
  --layout-content-gap:    2rem;       /* grid column gap */
  --layout-header-height:  64px;       /* sticky header height */
  --layout-sticky-offset:  5rem;       /* TOC/CategoryNav sticky top (was top-20) */
  --layout-page-pad:       1rem;       /* mobile edge padding */
  --layout-page-pad-md:    1.5rem;     /* md+ edge padding */
  --layout-content-max:    46rem;      /* reading width cap */
  --layout-panel-width:    300px;      /* SettingsPanel width */
  --layout-popover-width:  18rem;      /* popover/KeywordLink default */
```

- [ ] **Step 3: Verify**

Run: `pnpm type-check` → exit 0.
Run: `pnpm build 2>&1 | tail -10` → no CSS parse errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): add --layout-* dimension tokens

10 semantic layout tokens (nav/toc widths, header height, sticky
offset, page pads, content cap, panel/popover widths). Values match
current literal hardcodes for bit-exact visual preservation. Tailwind
default spacing scale (p-*, gap-*, m-*) stays as-is.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Add `--z-*` tokens

**Files:** Modify `app/globals.css`.

- [ ] **Step 1: Insert z-index tokens**

Immediately after the `--layout-popover-width` line (from Task 1), add:

```css

  /* ------------------------------------------------------------------
     Z-index tokens — named layers for overlapping UI. Replaces
     scattered z-10/z-20/z-50/z-[100] hardcodes.
     ------------------------------------------------------------------ */
  --z-sticky:  20;      /* TOC, sticky header inner rails */
  --z-header:  50;      /* page-level sticky header */
  --z-nav:     10;      /* in-card badges, timeline bullet points */
  --z-overlay: 40;      /* MobileOverlays search/menu */
  --z-fab:     50;      /* SettingsFab floating button */
  --z-panel:   50;      /* SettingsPanel (sibling of fab) */
  --z-popover: 50;      /* shadcn popover/select content */
  --z-hero:    100;     /* HeroIntro session-once overlay (top of stack) */
  --z-toast:   60;      /* reserved for future toasts */
```

Note on current observed values (from grep):
- `z-10` → in-card (PostCardTimeline bullets) → `--z-nav`
- `z-50` → Header, SettingsFab, SettingsPanel, popover, select → `--z-header` / `--z-fab` / `--z-panel` / `--z-popover` (all = 50)
- `z-[100]` → HeroIntro → `--z-hero`

- [ ] **Step 2: Verify**

Run: `pnpm build 2>&1 | tail -10` → succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): add --z-* layered z-index tokens

9 named z-layer tokens replacing scattered z-10/z-50/z-[100]
hardcodes. Values preserve current stacking order exactly
(sticky < overlay < fab = panel = popover = header < toast < hero).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Add `--radius-chip|card|panel` semantic aliases

**Files:** Modify `app/globals.css`.

- [ ] **Step 1: Insert radius semantic aliases**

The `@theme inline` block already declares primitives: `--radius-sm: 6px`, `--radius: 10px`, `--radius-lg: 14px`, `--radius-xl: 20px`. Add semantic aliases in `:root` immediately after the z-index block:

```css

  /* ------------------------------------------------------------------
     Radius semantic aliases — role-based names mapping to the existing
     shadcn primitive scale (--radius-sm/base/lg/xl in @theme inline).
     ------------------------------------------------------------------ */
  --radius-chip:   var(--radius-sm);   /* 6px  — tag chips, small pills */
  --radius-card:   var(--radius);      /* 10px — post cards, inputs */
  --radius-panel:  var(--radius-lg);   /* 14px — callouts, popovers, settings panel */
  --radius-overlay: var(--radius-xl);  /* 20px — hero, modals */
```

- [ ] **Step 2: Verify + commit**

Run: `pnpm build 2>&1 | tail -10` → succeeds.

```bash
git add app/globals.css
git commit -m "feat(tokens): add --radius-chip/card/panel/overlay semantic aliases

Role-based aliases mapping to existing shadcn --radius-sm/base/lg/xl
primitives. No new values added — this is pure naming layer for
readable consumer usage (rounded-[var(--radius-card)] vs rounded-[10px]).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Component migration

### Task 4: Token mapping reference (no-op)

Mapping table for Phase 2 tasks:

**Dimensions → `--layout-*`:**
| Before | After |
|---|---|
| `w-[288px]` (DocShell nav) | `w-[var(--layout-nav-width)]` |
| `w-[224px]` (DocShell toc) | `w-[var(--layout-toc-width)]` |
| `w-[300px]` (SettingsPanel) | `w-[var(--layout-panel-width)]` |
| `w-72` (popover, 18rem) | `w-[var(--layout-popover-width)]` — only if overlap clear; else keep `w-72` |
| `top-20` (TOC sticky) | `top-[var(--layout-sticky-offset)]` |
| `top-0` (page top) | keep as-is (page baseline, not a dimension token) |

**Z-index → `--z-*`:**
| Before | After |
|---|---|
| `z-50` (Header) | `z-[var(--z-header)]` |
| `z-50` (SettingsFab) | `z-[var(--z-fab)]` |
| `z-50` (SettingsPanel) | `z-[var(--z-panel)]` |
| `z-50` (popover) | `z-[var(--z-popover)]` |
| `z-50` (select content) | `z-[var(--z-popover)]` |
| `z-10` (PostCardTimeline bullets) | `z-[var(--z-nav)]` |
| `z-[100]` (HeroIntro) | `z-[var(--z-hero)]` |

**Radius → semantic aliases:**
| Role | Token |
|---|---|
| Tag chips, small pills | `rounded-[var(--radius-chip)]` |
| Post cards, inputs, buttons | `rounded-[var(--radius-card)]` |
| Callouts, popovers, SettingsPanel | `rounded-[var(--radius-panel)]` |
| Hero overlay, large modals | `rounded-[var(--radius-overlay)]` |

**Keep as-is (do NOT migrate):**
- Tailwind default spacing: `p-4`, `gap-2`, `mt-8`, `space-y-4`, etc.
- Tailwind default radius: `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`
- Tailwind default positions: `top-0`, `left-0`, `inset-0` (baseline positions, not dimension tokens)
- Border widths: `border`, `border-2`, `border-[1.5px]` (these are design refinement, PR2 out of scope per spec)
- Icon dimensions: `h-4 w-4`, `h-5 w-5` (Tailwind scale)
- Arbitrary pixel icons: `h-[22px] w-[22px]` — these are geometric icon sizes, not layout. **Decision: keep arbitrary** since they're one-off icon constants without a semantic role in the token system.

This is a reference task — no code change.

---

### Task 5: Migrate `DocShell.tsx` (primary layout)

**File:** `components/layout/DocShell.tsx`

- [ ] **Step 1: Grep and inspect**

Run: `grep -n 'w-\[\|h-\[\|top-\|z-' components/layout/DocShell.tsx`

The key hardcodes are the 3-col grid column widths (288px, 224px) and possibly `minmax(0, 1fr)` central column. The grid template may live in `style` or in a Tailwind arbitrary value like `grid-cols-[288px_minmax(0,1fr)_224px]`.

- [ ] **Step 2: Replace grid literals**

If grid template is in a Tailwind class:
```tsx
// Before
<div className="grid grid-cols-[288px_minmax(0,1fr)_224px] gap-8">

// After
<div className="grid grid-cols-[var(--layout-nav-width)_minmax(0,1fr)_var(--layout-toc-width)] gap-8">
```

If grid template is inline (unlikely — CLAUDE.md §5 forbids inline style), migrate accordingly.

Keep all `gap-*`, `px-*`, `py-*` Tailwind classes unchanged.

- [ ] **Step 3: Replace sticky offsets**

The TOC column uses `sticky top-20`. Replace with:

```tsx
// Before
<aside className="sticky top-20 ...">

// After
<aside className="sticky top-[var(--layout-sticky-offset)] ...">
```

Do the same for the left CategoryNav rail if it also uses `sticky top-20`.

- [ ] **Step 4: Verify + commit**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5` → both succeed. Visual: dev server `http://blog.localhost:3010/posts/<any>` — 3-col grid renders identically; TOC sticks at the same visual position.

```bash
git add components/layout/DocShell.tsx
git commit -m "refactor(shell): migrate DocShell grid widths and sticky offset to tokens

grid-cols-[288px_minmax(0,1fr)_224px] → var(--layout-nav-width) +
var(--layout-toc-width). sticky top-20 → var(--layout-sticky-offset).
CLAUDE.md §6 DocShell 3-col invariant preserved bit-for-bit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Migrate `Header.tsx` + `HeaderActions.tsx` + `MobileOverlays.tsx` + `ThemeToggle.tsx`

**Files:** 4 files under `components/blog/`

- [ ] **Step 1: Grep**

```bash
for f in components/blog/Header.tsx components/blog/HeaderActions.tsx components/blog/MobileOverlays.tsx components/blog/ThemeToggle.tsx; do
  echo "=== $f ==="
  grep -n 'w-\[\|h-\[\|top-\|z-\|rounded-\[' "$f"
done
```

- [ ] **Step 2: Apply mappings**

**`Header.tsx`:**
- `sticky top-0 z-50` → `sticky top-0 z-[var(--z-header)]`
  - `top-0` stays (page baseline, not a token)

**`HeaderActions.tsx`:**
- Any icon `h-[Npx] w-[Npx]` — **keep arbitrary** (per Task 4 decision on icons)
- Any `z-*` — map per table

**`MobileOverlays.tsx`:**
- `z-40` or `z-50` on overlay containers → `z-[var(--z-overlay)]`
- Icon dimensions stay

**`ThemeToggle.tsx`:**
- Icon dimensions stay
- Any `z-*` → map per table

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5` → both succeed.

- [ ] **Step 4: Commit**

```bash
git add components/blog/Header.tsx components/blog/HeaderActions.tsx components/blog/MobileOverlays.tsx components/blog/ThemeToggle.tsx
git commit -m "refactor(header): migrate header region z-index and sticky to tokens

Header sticky z-50 → var(--z-header). MobileOverlays z-40 →
var(--z-overlay). Icon sizes kept arbitrary (geometric constants,
not layout).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Migrate Settings — `SettingsFab.tsx` + `SettingsPanel.tsx`

**Files:** 2 files under `components/layout/`

- [ ] **Step 1: Grep**

```bash
for f in components/layout/SettingsFab.tsx components/layout/SettingsPanel.tsx; do
  echo "=== $f ==="
  grep -n 'w-\[\|h-\[\|top-\|bottom-\|right-\|z-\|rounded-\[' "$f"
done
```

- [ ] **Step 2: Mappings**

**`SettingsFab.tsx`:**
- `fixed bottom-6 right-6` — stays (Tailwind defaults, layout edges)
- `z-50` → `z-[var(--z-fab)]`
- `h-12 w-12` (button size) — stays (Tailwind scale)
- `h-[22px] w-[22px]` (Settings icon) — stays (geometric icon constant)
- `rounded-xl` — stays (Tailwind default)

**`SettingsPanel.tsx`:**
- `fixed bottom-20 right-6` — stays
- `z-50` → `z-[var(--z-panel)]`
- `w-[300px]` → `w-[var(--layout-panel-width)]`
- `rounded-2xl` — stays (Tailwind default; outside our radius semantic scale)
- Inner: `h-7 w-7`, `h-4 w-4`, `h-2.5 w-2.5`, mini-icon `h-7 w-9` — all stay (Tailwind/geometric)
- Mini-icon arbitrary: `w-[3px]`, `h-[3px]`, `h-[2px]` — these are internal wireframe-mini-icon geometry; **keep arbitrary** (not a layout concern)

- [ ] **Step 3: Verify + commit**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5` → both succeed.

```bash
git add components/layout/SettingsFab.tsx components/layout/SettingsPanel.tsx
git commit -m "refactor(settings): migrate Settings FAB/Panel z-index + panel width to tokens

z-50 → var(--z-fab) / var(--z-panel). w-[300px] →
var(--layout-panel-width). Icon dimensions and mini-wireframe
geometry stay arbitrary (non-layout constants).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Migrate post cards — `PostCardTimeline.tsx` + `PostCardEditorial.tsx` + `PostCardFloating.tsx` + `RelatedPost.tsx`

**Files:** 4 card files under `components/blog/`

- [ ] **Step 1: Grep**

```bash
for f in components/blog/PostCardTimeline.tsx components/blog/PostCardEditorial.tsx components/blog/PostCardFloating.tsx components/blog/RelatedPost.tsx; do
  echo "=== $f ==="
  grep -n 'w-\[\|h-\[\|top-\|left-\|right-\|bottom-\|z-\|rounded-\[' "$f"
done
```

- [ ] **Step 2: Mappings**

**`PostCardTimeline.tsx`:**
- `z-10` (on relative bullet containers) → `z-[var(--z-nav)]`
- `h-10 w-10` (timeline bullet circle) — stays
- `mt-[15px]` (magic offset for bullet alignment) — **keep arbitrary** (visual alignment constant, not layout role)
- `rounded-full`, `rounded-2xl`, `rounded-[10px]` — `rounded-full` stays; `rounded-[10px]` → `rounded-[var(--radius-card)]` if it's the card body

**`PostCardEditorial.tsx`:**
- Any `rounded-[Npx]` → map per role
- Position/dimension: apply mapping table

**`PostCardFloating.tsx`:**
- Similar treatment

**`RelatedPost.tsx`:**
- Similar treatment

Note: per grep, these cards have radius hardcodes. For each `rounded-[Npx]`, determine role:
- Card body (usually 10-14px) → `rounded-[var(--radius-card)]` or `rounded-[var(--radius-panel)]`
- Chip-like elements (4-6px) → `rounded-[var(--radius-chip)]`

- [ ] **Step 3: Verify + commit**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5` → both succeed. Visual: homepage with all 3 card layouts toggled via Settings.

```bash
git add components/blog/PostCardTimeline.tsx components/blog/PostCardEditorial.tsx components/blog/PostCardFloating.tsx components/blog/RelatedPost.tsx
git commit -m "refactor(cards): migrate post card z-index and radius to tokens

PostCardTimeline bullet z-10 → var(--z-nav). Card body radius
hardcodes → var(--radius-card) or --radius-panel by role. Small
alignment offsets kept arbitrary (non-layout).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Migrate `HeroIntro.tsx`

**File:** `components/blog/HeroIntro.tsx`

- [ ] **Step 1: Grep**

```bash
grep -n 'w-\[\|h-\[\|top-\|left-\|right-\|bottom-\|z-\|rounded-\[' components/blog/HeroIntro.tsx
```

- [ ] **Step 2: Mappings**

- `fixed inset-0 z-[100]` → `fixed inset-0 z-[var(--z-hero)]`
- `inset-0` stays (baseline position)
- `overflow-hidden overscroll-contain` — unrelated to tokens, stays
- Any arbitrary `w-[Npx]` / `h-[Npx]` on internal overlay content — **evaluate each**:
  - If it's a layout constraint (e.g., max content width) → map to `--layout-content-max` or keep
  - If it's a visual design constant (e.g., progress bar width) → keep arbitrary

**CAUTION: Do NOT touch** animation constants, `sessionStorage['deep-hero-seen']` key, burst-detector timings (`IDLE_GAP`, `COMMIT_DELTA`, `COOLDOWN`), `dismissScheduledRef` or `dismissing` deps. CLAUDE.md §6 invariant — Hero Intro burst-protected one-shot must remain intact.

- [ ] **Step 3: Verify + commit**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5` → both succeed. Visual: first visit (or `sessionStorage.clear(); location.reload()`) → HeroIntro appears once, dismisses normally.

```bash
git add components/blog/HeroIntro.tsx
git commit -m "refactor(hero): migrate HeroIntro z-index to token

z-[100] → var(--z-hero). Animation constants, burst-detector timings,
and session-once dismiss logic untouched per CLAUDE.md §6 invariants.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Migrate MDX + UI primitives — `Callout.tsx` + `components.tsx` + `TabsView.tsx` + `popover.tsx` + `select.tsx`

**Files:** 3 MDX files + 2 UI primitives

- [ ] **Step 1: Grep**

```bash
for f in components/mdx/Callout.tsx components/mdx/components.tsx components/mdx/TabsView.tsx components/ui/popover.tsx components/ui/select.tsx; do
  echo "=== $f ==="
  grep -n 'w-\[\|h-\[\|top-\|left-\|right-\|bottom-\|z-\|rounded-\[' "$f"
done
```

- [ ] **Step 2: Mappings**

**`Callout.tsx`:**
- Any `rounded-[Npx]` → `rounded-[var(--radius-panel)]` (callout is a panel element)
- Icon dimensions stay

**`components.tsx`:**
- `rounded-[Npx]` → map per role (usually `--radius-card` or keep Tailwind name)

**`TabsView.tsx`:**
- `rounded-[Npx]` on tablist wrapper → `rounded-[var(--radius-card)]` (outer container) or `rounded-[var(--radius-panel)]`
- Icon-size constants stay

**`popover.tsx`:** (shadcn primitive)
- `z-50` → `z-[var(--z-popover)]`
- `w-72` — **decision:** keep as-is (Tailwind's `w-72` = 18rem = common popover default; migrating to `--layout-popover-width` is possible but popovers are consumer-configurable via `className` override, so the default is not "layout"). **Keep `w-72`**.
- `rounded-md` — stays (Tailwind default)

**`select.tsx`:** (shadcn primitive)
- `z-50` → `z-[var(--z-popover)]`
- `max-h-[--radix-select-content-available-height]` — keep (Radix CSS custom prop, not a token concern)
- `min-w-[8rem]` — keep (Tailwind spacing, not a semantic layout role)
- `rounded-md` — stays

- [ ] **Step 3: Verify + commit**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5` → both succeed. Visual: Open a keyword-link popover, open a `<SortSelect>` dropdown, open a Tabs block.

```bash
git add components/mdx/Callout.tsx components/mdx/components.tsx components/mdx/TabsView.tsx components/ui/popover.tsx components/ui/select.tsx
git commit -m "refactor(mdx+ui): migrate MDX and shadcn primitive z-index/radius to tokens

Callout/Tabs rounded radii → --radius-panel / --radius-card by role.
popover + select z-50 → var(--z-popover). Tailwind-default widths
(w-72, min-w-[8rem]) kept as-is — consumer-configurable.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Migrate remaining — `KeywordLink.tsx` + `SortSelect.tsx` + `VisualContainer.tsx` + `StepController.tsx`

**Files:** 4 misc files

- [ ] **Step 1: Grep**

```bash
for f in components/blog/KeywordLink.tsx components/blog/SortSelect.tsx components/visualizations/common/VisualContainer.tsx components/visualizations/common/StepController.tsx; do
  echo "=== $f ==="
  grep -n 'w-\[\|h-\[\|top-\|left-\|right-\|bottom-\|z-\|rounded-\[' "$f"
done
```

- [ ] **Step 2: Mappings**

**`KeywordLink.tsx`:**
- Any `w-[Npx]` on popover content wrapper → evaluate: if it's the layout width → `w-[var(--layout-popover-width)]`; if decorative → keep
- `rounded-[Npx]` → `rounded-[var(--radius-panel)]` (popover role)

**`SortSelect.tsx`:**
- `w-[Npx]` on trigger → evaluate; usually keep if it's button sizing
- `rounded-[Npx]` → map per role

**`VisualContainer.tsx`:**
- Outer container `rounded-[Npx]` → `rounded-[var(--radius-panel)]`

**`StepController.tsx`:**
- `rounded-[10px]` on progress bar wrapper → `rounded-[var(--radius-card)]`
- `top-[0]`, `left-[0]` etc — keep

- [ ] **Step 3: Verify + commit**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5` → both succeed.

```bash
git add components/blog/KeywordLink.tsx components/blog/SortSelect.tsx components/visualizations/common/VisualContainer.tsx components/visualizations/common/StepController.tsx
git commit -m "refactor(misc): migrate remaining dimension/radius hardcodes to tokens

KeywordLink popover → --radius-panel. SortSelect trigger radius →
--radius-card. VisualContainer/StepController wrapper radii →
semantic tokens. Internal SVG/geometric constants untouched.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Verification

### Task 12: Full project verification

- [ ] **Step 1: Lint**

Run: `pnpm lint 2>&1 | tail -20`
Expected: exit 0 or pre-existing warnings only. No new errors.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 3: Tests**

Run: `pnpm test 2>&1 | tail -5`
Expected: all pass (PR2 has no new test files; PR1's `normalizeFontSize` and existing tests remain green).

- [ ] **Step 4: Build**

Run: `pnpm build 2>&1 | tail -20`
Expected: `✓ Compiled successfully`. No CSS parse errors. All 23 pages prerendered.

- [ ] **Step 5: Final diagnostic grep**

Run to see what's left:
```bash
# Layout widths still hardcoded in non-viz files
grep -rn '\(w\|h\|min-w\|min-h\|max-w\|max-h\)-\[\(288\|224\|300\)px\]' --include="*.tsx" app components 2>&1 | grep -v 'components/visualizations/[A-Z]' | grep -v 'components/visualizations/common'

# z-index hardcodes still present
grep -rn '\bz-\(10\|20\|40\|50\|60\)\b\|z-\[' --include="*.tsx" app components 2>&1 | grep -v 'components/visualizations/[A-Z]' | grep -v 'z-\[var(' | head -30
```
Expected: first grep empty (layout widths fully tokenized). Second grep: only justified leftovers — document each remaining one.

---

### Task 13: Manual smoke matrix

Dev server: `PORT=3010 pnpm dev` in background.

- [ ] **Step 1: Layout integrity**

Navigate to `http://blog.localhost:3010/posts/<any-post>`:
- **Desktop (1280px):** DocShell 3-col grid renders with exactly 288px left rail, 224px right rail, fluid center
- **TOC:** Sticky at visual `top-20` position when scrolling
- **CategoryNav:** Sticky at same offset
- Compare before/after visually — **pixel-identical** outcome expected (token values match old literals)

- [ ] **Step 2: Z-index stacking**

- Click SettingsFab → panel appears above page content (z-fab + z-panel)
- Open SearchDialog via ⌘K (or header search) → appears above page (z-overlay)
- First-visit HeroIntro (or `sessionStorage.clear()` + reload) → appears above everything including settings (z-hero = 100)
- Click a keyword link → popover appears above (z-popover)
- Confirm no unexpected z-index conflicts (e.g., panel hidden behind overlay)

- [ ] **Step 3: Radius visual**

- Post cards: rounded corners identical to before
- Callout: panel radius preserved
- Settings panel: same rounding
- Keyword popover: same rounding

- [ ] **Step 4: Responsive**

Test at 375px (mobile), 768px (tablet), 1280px (desktop):
- Page padding transitions (mobile `--layout-page-pad` 1rem → md `--layout-page-pad-md` 1.5rem) if migrated in DocShell/layout
- Grid collapses correctly on mobile (DocShell's responsive logic preserved)

- [ ] **Step 5: Invariants smoke**

Confirm CLAUDE.md §6 invariants still hold:
- `DocShell` 3-col `[288px, 1fr, 224px]` maintained (now via tokens)
- TOC grid-cell sticky (no `position: fixed` regression)
- HeroIntro burst detector + one-shot behavior intact
- Tabs (both visible, Server/Client boundary preserved)
- Keyword link popover still opens

---

### Task 14: Merge PR2 to `feature/style-token-system`

- [ ] **Step 1: Working tree clean**

Run: `git status`
Expected: no uncommitted changes.

- [ ] **Step 2: Switch to integration branch (in main repo, NOT worktree)**

Work from `/Users/ing9990/Document/backend-notes`:
```bash
cd /Users/ing9990/Document/backend-notes
git checkout feature/style-token-system
```

- [ ] **Step 3: Merge PR2 with `--no-ff`**

```bash
git merge --no-ff feature/pr2-spacing-dimension-tokens -m "$(cat <<'EOF'
Merge PR2: Spacing + dimension tokens

Integrates the second of four style-token-system PRs. PR2 delivers:
- --layout-* (10 tokens: nav/toc widths, sticky offsets, page pads,
  content caps, panel/popover widths)
- --z-* (9 tokens: named z-index layers)
- --radius-chip/card/panel/overlay semantic aliases
- 21 components migrated from hardcoded w-[Npx], top-20, z-50,
  rounded-[Npx] to token references

PR3 (color consolidation) and PR4 (enforcement + docs) merge next.

Spec: docs/superpowers/specs/2026-04-18-style-token-system-design.md
Plan: docs/superpowers/plans/2026-04-18-pr2-spacing-dimension-tokens.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify integration branch state**

Run:
```bash
pnpm type-check && pnpm build 2>&1 | tail -10
```
Expected: both green.

Run: `git log --oneline --graph -15` — confirm PR1 and PR2 merge commits both visible in history.

---

## Post-PR follow-ups (not part of this plan)

- **PR3:** Color consolidation (Callout state tokens, arbitrary hex hunt).
- **PR4:** ESLint + stylelint enforcement; expand CLAUDE.md §2/§4 with new invariants and new-token protocol.

## Rollback

If PR2 needs to be reverted after merge:
- Token definitions in `globals.css` can stay (harmless — no consumers left).
- Component-level migrations can be reverted incrementally (each commit in Phase 2 is self-contained).
- `git revert` the merge commit on `feature/style-token-system` is safe — PR1 changes remain.
