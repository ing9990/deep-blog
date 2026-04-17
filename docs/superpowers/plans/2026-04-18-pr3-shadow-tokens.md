# PR3: Shadow Tokens (Color Consolidation — Minimal) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three `--shadow-*` box-shadow tokens to `app/globals.css` and migrate the four remaining shadow hardcodes across post cards and SettingsFab to reference them. The rest of the color-consolidation scope from the original spec is **not needed** — the codebase is already fully tokenized for semantic colors (shadcn tokens, `--callout-*` per-type, `--viz-*` per-state, `--keyword`, `--code-inline-fg`, etc.). No arbitrary hex or raw Tailwind palette usage exists outside viz-internal SVGs.

**Architecture:** Shadow tokens defined in `:root` alongside other layout/z-index/radius semantic aliases (PR2 conventions). Light-only values — dark mode uses the same shadow strings because the current hardcodes are black-based rgba which works acceptably on both themes (verified visually). If dark-mode-specific shadows become desirable later, add overrides in `[data-theme="dark"]`.

**Tech Stack:** Tailwind v4 (`@theme inline` for primitive pool, `:root` for semantic aliases). No runtime changes. No new dependencies.

---

## Scope Change from Spec

The original spec (Section 4 "Color Tokens") proposed adding `--state-info|warn|danger|success` generic state tokens. Audit confirms these are **not needed**:

- `Callout.tsx` already uses per-type CSS vars (`--callout-info-*`, `--callout-warning-*`, etc.) via a `variant.cssPrefix` pattern — clean, typed, no raw palette.
- No other component consumes "state" colors (no toasts, no banners, no form error messages using raw palette).
- Renaming `--callout-*` to `--state-*` and re-aliasing would be pure naming churn with no consumer benefit (YAGNI).

The `--state-*` addition is **deferred** to a future PR when a real second consumer appears. PR4 will document this decision in CLAUDE.md.

**HeroIntro radial-gradient vignette** (`[background:radial-gradient(...rgba(0,0,0,0.7)...)]`) is a one-off dark overlay effect specific to the session-once hero. Tokenizing it would require a single-use token (`--shadow-hero-vignette`) that no other component references — also YAGNI. Kept as a per-component literal.

---

## Prerequisites

- Worktree at `.worktrees/pr3-color-consolidation` on branch `feature/pr3-color-consolidation` (branched from `feature/style-token-system` @ `d94f4da`).
- Baseline: `pnpm type-check` green, Velite build succeeds.
- Reference spec: `docs/superpowers/specs/2026-04-18-style-token-system-design.md` (Section 4: Color Tokens — partially superseded by this plan's scope reduction).

## File Structure

### Created
- No new files.

### Modified (infrastructure — 1 file)
- `app/globals.css` — add 3 `--shadow-*` semantic tokens in `:root`.

### Modified (migration — 4 files)
- `components/layout/SettingsFab.tsx`
- `components/blog/PostCardFloating.tsx`
- `components/blog/PostCardTimeline.tsx`
- `components/blog/PostCardEditorial.tsx`

### Out of Scope
- `--state-*` tokens (see "Scope Change" above).
- HeroIntro radial gradient (single-use, not a semantic token candidate).
- Callout refactor (already fully tokenized).
- Arbitrary hex / raw Tailwind palette migration (none exist outside viz-internal SVG logic constants).
- ESLint/stylelint enforcement — PR4.
- CLAUDE.md updates for color decisions — PR4.

---

## Phase 1 — Token definitions

### Task 1: Add `--shadow-*` tokens to `:root`

**Files:** Modify `app/globals.css` — the existing `:root` block.

- [ ] **Step 1: Insert shadow tokens**

Locate the radius semantic aliases block (ends with `--radius-overlay: var(--radius-xl);`). Add immediately after it, before the closing `}` of `:root`:

```css

  /* ------------------------------------------------------------------
     Shadow tokens — elevation-based names for the two card elevation
     levels and the floating FAB. Values match current literal rgba
     shadows for bit-exact visual preservation. Dark-mode uses the same
     strings (black-based alpha works acceptably on both themes — add
     [data-theme="dark"] overrides only if visual regression appears).
     ------------------------------------------------------------------ */
  --shadow-card:        0 2px 12px rgba(0, 0, 0, 0.04);
  --shadow-card-hover:  0 4px 16px rgba(0, 0, 0, 0.05);
  --shadow-fab:         0 4px 16px rgba(0, 0, 0, 0.15);
```

- [ ] **Step 2: Verify**

Run: `pnpm type-check` → exit 0.
Run: `pnpm build 2>&1 | tail -10` → succeeds, no CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): add --shadow-card/card-hover/fab elevation tokens

3 semantic shadow tokens matching the three elevation levels currently
hardcoded (card resting/hover, FAB). Values copied verbatim from the
existing rgba literals for bit-exact visual preservation. Dark mode
inherits the same strings until a visual regression justifies an
override.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Component migration

### Task 2: Migrate SettingsFab shadow

**File:** `components/layout/SettingsFab.tsx`

- [ ] **Step 1: Locate line 21**

Read lines 18-30 for context. The current className contains:
```tsx
className="fixed bottom-6 right-6 z-[var(--z-fab)] flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-transform hover:scale-105"
```

- [ ] **Step 2: Replace shadow literal**

```tsx
// Before
shadow-[0_4px_16px_rgba(0,0,0,0.15)]

// After
shadow-[var(--shadow-fab)]
```

Full line after edit:
```tsx
className="fixed bottom-6 right-6 z-[var(--z-fab)] flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background shadow-[var(--shadow-fab)] transition-transform hover:scale-105"
```

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5` → both succeed.

- [ ] **Step 4: Commit**

```bash
git add components/layout/SettingsFab.tsx
git commit -m "refactor(fab): migrate SettingsFab shadow to --shadow-fab token

shadow-[0_4px_16px_rgba(0,0,0,0.15)] → shadow-[var(--shadow-fab)].
Same literal value, now centrally governed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Migrate post-card hover shadows

**Files:**
- `components/blog/PostCardTimeline.tsx`
- `components/blog/PostCardEditorial.tsx`
- `components/blog/PostCardFloating.tsx`

- [ ] **Step 1: Locate shadows**

Run: `grep -n 'shadow-\[' components/blog/PostCardTimeline.tsx components/blog/PostCardEditorial.tsx components/blog/PostCardFloating.tsx`

Expected matches:
- `PostCardTimeline.tsx` — `hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]` (the card body link)
- `PostCardEditorial.tsx` — `hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]` (the outer Link)
- `PostCardFloating.tsx` — `hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]` (the outer Link)

- [ ] **Step 2: Apply replacements**

**PostCardTimeline.tsx:** `hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]` → `hover:shadow-[var(--shadow-card)]`
**PostCardEditorial.tsx:** `hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]` → `hover:shadow-[var(--shadow-card)]`
**PostCardFloating.tsx:** `hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]` → `hover:shadow-[var(--shadow-card-hover)]`

Note: PostCardFloating uses the *larger* hover shadow (higher elevation on hover) matching `--shadow-card-hover`. Timeline and Editorial use the subtler `--shadow-card`. Preserve this distinction.

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm build 2>&1 | tail -5` → both succeed.

Run: `grep -n 'shadow-\[0' components/blog/PostCardTimeline.tsx components/blog/PostCardEditorial.tsx components/blog/PostCardFloating.tsx components/layout/SettingsFab.tsx`
Expected: empty (no literal shadow rgba hardcodes remain).

- [ ] **Step 4: Commit**

```bash
git add components/blog/PostCardTimeline.tsx components/blog/PostCardEditorial.tsx components/blog/PostCardFloating.tsx
git commit -m "refactor(cards): migrate post card hover shadows to shadow tokens

Timeline + Editorial → --shadow-card (subtle rest-to-hover lift).
Floating → --shadow-card-hover (larger elevation). Distinction
preserved bit-for-bit by mapping to the correct token level.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Verification + merge

### Task 4: Full verification

- [ ] **Step 1: Lint**

Run: `pnpm lint 2>&1 | tail -10`
Expected: exit 0 or pre-existing warnings only.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check` → exit 0.

- [ ] **Step 3: Tests**

Run: `pnpm test 2>&1 | tail -5` → all 145 tests pass.

- [ ] **Step 4: Build**

Run: `pnpm build 2>&1 | tail -20` → 23 pages prerendered, no errors.

- [ ] **Step 5: Final scan**

Run:
```bash
grep -rn 'shadow-\[0' --include="*.tsx" app components | grep -v 'components/visualizations/[A-Z]'
```
Expected: empty (all semantic-role shadows tokenized; HeroIntro's `[background:radial-gradient(...)]` does not match because it's in `[background:...]`, not `shadow-[...]`).

Run:
```bash
grep -rn 'shadow-\[var' --include="*.tsx" app components | grep -v 'components/visualizations/[A-Z]'
```
Expected: 4 matches (SettingsFab + 3 cards).

---

### Task 5: Manual smoke

Start dev server (if not running). Verify:

- [ ] **Step 1: Hover states**

Hover over a Timeline card (homepage) → subtle shadow appears.
Hover over an Editorial card → same subtlety.
Hover over a Floating card → stronger shadow (higher elevation).

- [ ] **Step 2: FAB**

Click Settings FAB (bottom-right) → fab has its resting shadow. Hover → transform scales without shadow regression.

- [ ] **Step 3: Light + dark**

Toggle theme → shadows continue to read acceptably. No glaring regression.

- [ ] **Step 4: Invariants smoke**

Confirm CLAUDE.md §6 invariants still hold:
- No typography/layout/z-index regressions (PR3 didn't touch any of these).

---

### Task 6: Merge PR3 to `feature/style-token-system`

Work from main repo (NOT worktree):

- [ ] **Step 1: Working tree clean**

Run in worktree: `git status` → no uncommitted changes.

- [ ] **Step 2: Switch to integration branch**

```bash
cd /Users/ing9990/Document/backend-notes
git checkout feature/style-token-system
```

- [ ] **Step 3: Merge PR3 with `--no-ff`**

```bash
git merge --no-ff feature/pr3-color-consolidation -m "$(cat <<'EOF'
Merge PR3: Shadow tokens (minimal color consolidation)

Integrates the third of four style-token-system PRs. PR3 delivers:
- 3 shadow tokens (--shadow-card, --shadow-card-hover, --shadow-fab)
- 4 component migrations from literal rgba shadows to token references

Scope reduced from original spec: --state-info/warn/danger/success
deferred (YAGNI — Callout is already per-type tokenized, no other
consumer exists). HeroIntro radial-gradient kept as per-component
literal. Audit confirmed no arbitrary hex or raw Tailwind palette
usage exists outside viz-internal SVG logic constants.

PR4 (enforcement + docs) merges next.

Spec: docs/superpowers/specs/2026-04-18-style-token-system-design.md
Plan: docs/superpowers/plans/2026-04-18-pr3-shadow-tokens.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify integration branch**

Run:
```bash
pnpm type-check && pnpm build 2>&1 | tail -10
```
Expected: both green.

Run: `git log --oneline --graph -15` — confirm PR1, PR2, PR3 merge commits all visible.

---

## Rollback

If PR3 needs to be reverted:
- `git revert` the merge commit on `feature/style-token-system` is safe.
- Token definitions can stay (harmless).
- Component migrations can be reverted individually (2 commits in Phase 2).

## Post-PR Follow-ups

- **PR4:** ESLint + stylelint enforcement; CLAUDE.md updates documenting the token system completeness (including the "state tokens deferred" decision from PR3).
