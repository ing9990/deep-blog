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

--tracking-tightest: -0.02em
--tracking-tighter:  -0.015em
--tracking-tight:    -0.01em
--tracking-wide:      0.08em
--tracking-wider:     0.2em
--tracking-widest:    0.3em
--tracking-display:   0.35em
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
| `--radius-chip` | `var(--radius-sm)` (6px) | Tag chips, small pills |
| `--radius-card` | `var(--radius)` (10px) | Post cards, inputs, small panels |
| `--radius-panel` | `var(--radius-lg)` (14px) | Callouts, popovers, settings panel |
| `--radius-overlay` | `var(--radius-xl)` (20px) | Hero, large modals |

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

- **ESLint** (`.eslintrc.json` `no-restricted-syntax`): blocks `text-[Npx]`, `leading-[Nem]`, `tracking-[Nem]`, `z-[N]`/`z-50`, `rounded-[Npx]`, `bg/text/border-[#...]`, `shadow-[0_...rgba...]` at classname literal level. Whitelists `components/visualizations/**` (except `common/`).
- **Stylelint** (`.stylelintrc.json`): blocks `font-size: Npx`, `color: #hex`, `z-index: N` in CSS files outside `app/globals.css`.
- Both run via `pnpm lint` (paired with `pnpm lint:fix`).
