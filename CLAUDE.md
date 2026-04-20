# CLAUDE.md — DEEP

This file captures invariants that are not obvious from reading the code. For everything else, inspect the current design system, post structure, and styles before writing — the codebase is the source of truth.

## 0. Every-session checklist

- Run the dev server in the background via Bash `run_in_background`: `PORT=3010 pnpm dev`. The `PORT=` prefix avoids pnpm's `--` parser.
- Browse at `http://blog.localhost:3010/`. Include the `http://` and the trailing slash so Safari does not treat the host as a search query.
- Confirm port ownership at session start with `lsof -nP -iTCP:3010 -sTCP:LISTEN`. After UI changes, read the background dev log with `BashOutput`.

## 1. Identity & motto

- **DEEP** — a personal tech blog. Both the local directory and the repo are named `deep-blog`.
- **Motto**: *"Explain technical topics as clearly as possible."* Posts cover how things work internally, why the technology exists, and the trade-offs.
- **Production domain**: `https://ing9990.com` (Vercel). SEO metadata, sitemap, robots.txt, and Open Graph are active.
- **New posts go through the `blog-writer` skill.** When the user says something like "write a blog post" or "make a post", hand control to the skill — it owns `content/posts/*.mdx`.
- Detailed authoring rules (philosophy, frontmatter, tags, keywords, visualization judgment, MDX component reference) live in `.claude/skills/blog-writer/references/*.md`.

## 2. Stack

Next.js 15 App Router · TypeScript strict · Velite (MDX → type-safe collections) · Tailwind v4 + shadcn/ui · Shiki · KaTeX · Vitest · **Stylelint** (token enforcement) · ESLint `no-restricted-syntax` (className token enforcement) · pnpm 9.15.4 (corepack-pinned; works around a Node 23.5 keyid bug).

## 3. Directory layout (top-level)

```
app/                  # App Router routes + globals.css
content/posts/        # MDX posts (owned by the blog-writer skill)
components/{ui,blog,mdx,visualizations,layout,providers}/
lib/                  # utilities + lib/generated/keyword-map.ts (committed)
plugins/remark-auto-link.ts
public/fonts/         # Paperlogy (9 weights) + Pretendard + JetBrains Mono
velite.config.ts      # Zod schema + build pipeline
```

## 4. Commands & verification

```bash
pnpm dev                   # predev: emphasis guard + keyword map regen
pnpm build                 # prebuild: emphasis guard + keyword map + Velite
pnpm type-check            # tsc --noEmit
pnpm lint                  # next lint + stylelint (token enforcement)
pnpm lint:fix              # auto-fix (next lint --fix + stylelint --fix)
pnpm test                  # pretest: emphasis guard + keyword map → velite + vitest
pnpm generate-keyword-map  # regenerate after frontmatter edits
pnpm check-mdx-emphasis    # standalone check for `**"…"**` / `**(…)**`
pnpm check-mdx-tilde       # standalone check for 2+ unescaped `~` on one line/cell
```

- After code changes, run `pnpm type-check` (required) and `pnpm lint`. For large changes, run `pnpm build` too.
- After MDX or frontmatter changes, rerun `pnpm generate-keyword-map`.
- After UI changes, verify light/dark themes, 375px mobile width, keyword link wiring, and the background dev log.
- For new MDX, let the blog-writer skill run its own validation loop (`references/validation-loop.md`).

## 5. House rules

Keep these in mind while coding. Each rule includes where to look when you need the current pattern.

1. **Library accuracy** — confirm unfamiliar APIs via `context7` before using them. Prefer the real API to a plausible-sounding guess.
2. **Types** — express unknown shapes with `unknown` + type guards. Avoid `any`.
3. **Styling surface** — put all styles in Tailwind utilities or component CSS. The design tokens in `docs/design-tokens.md` cover typography, layout widths, z-index, radius, color, and shadow; reach for the semantic token first.
4. **Keyword map** — generated at build time by `scripts/generate-keyword-map.ts` into `lib/generated/keyword-map.ts` (committed). Runtime code reads from that file.
5. **Post authoring** — route new `content/posts/*.mdx` through the blog-writer skill.
6. **Conceptual clarity** — when a concept hinges on behavior or state change, pair prose with a visualization (see `blog-writer/references/visualization-rules.md`).
7. **Git safety** — use non-destructive flows. If `push --force`, `reset --hard`, `clean -f`, or hook-bypass flags (`--no-verify`) seem necessary, confirm with the user first.
8. **Style tokens** — `.eslintrc.json` (`no-restricted-syntax`, 7 regexes) and `.stylelintrc.json` (`declaration-property-value-disallowed-list`) enforce token usage at lint time. The mapping is:
   - Typography sizes → `--text-*`
   - Letter-spacing / line-height → `--tracking-*` / `--leading-*`
   - Layout widths and offsets → `--layout-*`
   - Z-index stacking → `--z-*`
   - Radius → `--radius-{chip,card,panel,overlay}` (Tailwind named `rounded-{md,lg,xl,2xl,full}` is fine)
   - Colors → shadcn semantic tokens or `--keyword` / `--callout-*` / `--code-*` / `--viz-*`
   - Shadows → `--shadow-{card,card-hover,fab}`

   Whitelisted exceptions live in the lint configs: visualization SVG logic constants, `em`/`%` relative units, primitive definition blocks (`@theme inline`, `:root`, `[data-theme="dark"]`, `html[data-font-size="..."]`), icon pixel sizes, and one-off literals. When an exception is genuinely needed, add it to the whitelist rather than sprinkling disables. The full token table lives in `docs/design-tokens.md`.
9. **MDX emphasis and ranges** — the prebuild/predev/pretest guards catch two rendering pitfalls.
   - Bold + adjacent punctuation: use `"**X**"` and `**X**(Y)` (punctuation outside the bold), because `**"…"**` and `**(…)**` render unstably when combined with Korean particles. The guard is `scripts/check-mdx-emphasis.ts`.
   - Numeric/label ranges: write them as en-dash `0–100`, natural language `0에서 100` / `수백에서 수천`, or `1번부터 4번까지`. Two or more unescaped `~` on a single line or table cell get parsed as GFM strikethrough. A standalone approximation (e.g. `~10ms`) is fine. The guard is `scripts/check-mdx-tilde.ts`.

## 6. Load-bearing invariants

These are non-obvious decisions baked into the code. Read the source they reference before changing behavior in the area; each exists because of a past regression.

### Next.js / Velite pipeline

- `MDXContent` stays a Server Component. Velite emits the body through the `arguments[0]` destructuring helper pattern; switching to `'use client'` breaks it.
- `/posts/[slug]` omits `dynamicParams` export. Next 15 only accepts a literal there, so the default (`true`) is what enables dev HMR and sends unknown slugs to `notFound()`.
- Page components unwrap `params: Promise<{slug}>` with `await`.
- The `draft: true` filter lives in `lib/posts.ts`. Keep it out of the Velite schema — filtering there fails the whole build.
- Frontmatter validation is duplicated on purpose: a regex (`postFrontmatterShape`) for tests, plus the collection's `.extend({ slug: s.slug('post') })` for runtime. Keep both in sync.

### UI layout & design system

- `DocShell` is always a 3-column grid `[288px, minmax(0,1fr), 224px]`. When `showCategoryNav=false` or `hasToc=false`, a placeholder `<div>` holds the column width. `HeaderActions` mirrors the same grid so edges align across pages. Any `width` prop or `max-w-3xl|5xl` container has been retired.
- TOC is rendered inside its grid cell with `sticky top-20`. Fixed positioning with `calc(50% + …)` is no longer used.
- `CategoryNav` opens every `<details>` by default. The older "only open the current category" behavior has been retired.
- `Hero Intro` (`components/blog/HeroIntro.tsx`) runs at most once per session (`sessionStorage['deep-hero-seen']`) and is strictly one-way: 4-stage progressive highlight with no re-entry path. Trackpad burst detection lives in `createBurstDetector` (`IDLE_GAP=120 / COMMIT_DELTA=220 / COOLDOWN=420`). The dismiss timer uses `dismissScheduledRef` as a guard, and the effect deps are `[stage, show]` only — adding `dismissing` causes cleanup to clear the timer that releases the body scroll lock, producing a permanent scroll freeze.
- Fonts are a 3-way split: `--font-sans` = Paperlogy (9 TTF weights), `.prose-kr` overrides to `--font-pretendard`, `--font-mono` = JetBrains Mono. `app/layout.tsx` holds all three `next/font/local` declarations; they stay distinct.
- The style token system (`app/globals.css`) is 2-tiered. Tier 1 is `@theme inline` primitives — typography scale (`--text-*`, `--leading-*`, `--weight-*`, `--tracking-*`) and shadcn radius (`--radius-*`). Tier 2 is `:root` semantic aliases, redeclared under `@media (min-width: 768px) :root { }` for responsive overrides. Categories: typography, layout (`--layout-nav-width|toc-width|sticky-offset|...`), z-index (`--z-header|fab|panel|popover|hero|...`), radius semantic (`--radius-chip|card|panel|overlay`), shadow (`--shadow-card|card-hover|fab`), colors (shadcn + `--callout-*` + `--keyword` + `--code-*` + `--viz-*`). User-adjustable font scale: `html[data-font-size="small|normal|large"]` sets `--text-scale` to `0.92 / 1 / 1.10`. `SettingsProvider`'s `fontSize` field syncs to `document.documentElement.dataset.fontSize`; FOUC prevention runs via `next/script strategy="beforeInteractive"` in `app/layout.tsx`. Default is `normal`. Workflow for a new token: primitive → semantic alias → update the `docs/design-tokens.md` table → add an invariant here if it becomes load-bearing.
- Category icons live in `lib/category-icons.ts`. Keep `lucide-react` out of `lib/categories.ts` so Velite's server bundle stays lean.
- Dark mode is driven by `next-themes` with `attribute="data-theme"` and Tailwind `darkMode: ['selector', '[data-theme="dark"]']`. Color tokens are shadcn (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, `--accent`) plus extensions (`--keyword`, `--keyword-bg`, `--code-inline-fg`, `--border-strong`, `--viz-*`).
- The inline color scheme is three-way: regular links = blue (`--primary`), keyword links = indigo (`--keyword` + `.keyword-link`), inline code = teal (`--code-inline-fg` text with a 10% tint background). Keep the three surfaces separated.
- `.keyword-link` uses a tinted background plus an animated gradient underline on hover (`background-size: 0→100%`). `.prose-kr .keyword-link` overrides `.prose-kr a`. The older dotted underline (`decoration-dotted`) has been retired.
- Inline code color (`--code-inline-fg`) is teal-600 (light) / teal-300 (dark); the background derives from it via `color-mix(in oklab, var(--code-inline-fg) 10%, var(--background))`. The prior `--muted` gray with border + box-shadow has been retired.
- Long code lines stay contained by the 3-part set: `<article className="min-w-0">` plus `width:100%; max-width:100%; min-width:0` on `figure`/`pre`. Removing any one lets CSS Grid's default `min-width: auto` widen the cell until the layout overflows.
- Shiki line highlighting targets `.prose-kr .highlighted` (className-based from `@shikijs/transformers@4`, not `data-*`).
- MDX tables go through the `table` override in `components/mdx/components.tsx`, which wraps them in a `.table-wrapper` div automatically.
- Every `.prose-kr h2` gets `border-top: 1px solid var(--border)` + `margin-top: 3em` + `padding-top: 1.5em` to mark section transitions. Because the divider is automatic, keep MDX bodies free of manual `---` thematic breaks — the pair would render a double line.
- `<Tabs>` (`components/mdx/Tabs.tsx`) is a Server Component that calls `extractTabs(children)` and forwards the array to `<TabsView tabs={...}>` (`components/mdx/TabsView.tsx`, the Client Component). Keeping this split matters: marking `Tabs` as a Client Component forces children to serialize across the RSC boundary, and when an earlier Shiki code block splits the stream, later `<Tab>`s arrive as `{$$typeof: react.lazy, _payload: Promise<pending>}` — the second tab silently disappears (no trigger or content). `extractTabs` identifies tabs by duck-typing on `props.label` being a string; keep that check rather than swapping to reference equality on the `Tab` type.
- `TabsGroupProvider` has exactly one instance, inside `components/mdx/MDXContent.tsx`. Hoisting it up to `app/layout.tsx` or similar leaks `group` state between posts — one scope per post is the model.

### Search & filter

- The header's `SearchDialog` owns the search UI. `BlogHomeClient` does not hold query state or URL params, and `buildPostsUrl` does not have a `query` field. The index-level `SearchBar` has been removed.
- Index has two modes: `category === null` renders `CategoryGroupedFeed`; `category !== null` renders a flat `PostList` with a scoped `TagFilterBar` (only tags that appear in that category). Switching scope auto-resets `tag`.
- Filter state lives on `BlogHomeClient`. URL sync uses `history.replaceState` so keystrokes don't trigger RSC round-trips; `router.push` here would regress that.
- `SearchDialog`'s input is a plain controlled input. React 19 handles Korean IME composition correctly, so `isComposing` guards and `onCompositionEnd` flushes are unnecessary — adding them causes mid-composition characters to disappear.

### Keyword auto-linking

- Pipeline: prebuild `scripts/generate-keyword-map.ts` → `lib/generated/keyword-map.ts` (**committed**) → `plugins/remark-auto-link.ts` (Remark replacement) → MDX `a[data-keyword-link]` → `mdxComponents.a` → `<KeywordLink>` Popover.
- Conflicts exit with `process.exit(1)` — one keyword per post. Normalization is lowercase (`B-Tree` == `b-tree`).
- Self-link avoidance uses `currentSlug = file basename`. Keep filename and slug aligned.
- Boundary rules: strict before English/Korean; relaxed after Korean (allows particles `를/가/의/는`).

### Utilities & tests

- `formatDate` reads UTC getters. Velite's `s.isodate()` parses as midnight UTC; local getters would shift the date by a day.
- `lib/filters.ts` shares a module-level `koCollator = new Intl.Collator('ko', { sensitivity: 'base' })`. `sortPosts('title')` and `extractAllTags` both rely on it for consistent tie-breaking.
- Vitest default env is `node`. DOM-dependent test files declare `// @vitest-environment jsdom` at the top.
- Tests focus on pure functions. UI regressions are caught via `pnpm build` + manual dev verification; `@testing-library/react` is not in use.

### Frontmatter / post data

- Frontmatter `title` and `summary` are nested `{ ko, en }` objects. Consumers access `post.title[lang]` / `post.summary[lang]`. Server Components that render without a lang (e.g. `generateMetadata`) pin to `.ko` for now; hreflang is a future PR.
- Frontmatter `tags` use lowercase-hyphen form: `backend`, `data-structure`, `distributed-systems`. The `app/tags/[tag]/page.tsx` `generateStaticParams` reads tags directly from frontmatter, so casing drives the URL (`/tags/Backend` ≠ `/tags/backend`). Global normalization landed on 2026-04-19.

## 7. Code conventions

- Default to Server Components. Mark leaves that truly need client state with `'use client'`.
- Component props use `interface` (not `type`). Component files are `PascalCase.tsx`; utilities are `kebab-case.ts`.
- Styles are mobile-first. Combine conditional classNames with `cn()` from `clsx + tailwind-merge`.
- Accessibility: interactive elements carry `aria-label`, support keyboard navigation, images have `alt`, and information is conveyed by more than color alone.
- `next/image` always receives explicit `width` and `height`.
