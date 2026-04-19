# DEEP

> *"Explaining technical topics as clearly as possible."*

DEEP is a personal technical blog that focuses on **how things work internally**, **why a technology exists**, and **trade-offs between alternatives**. Posts cover backend, computer science, data structures, databases, frameworks, and adjacent topics.

- **Live site**: <https://ing9990.com>
- **Local**: <http://blog.localhost:3010/>
- **한국어 README**: [README.ko.md](./README.ko.md)

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Velite** — MDX → type-safe collections (Zod schema)
- **Tailwind CSS v4** + **shadcn/ui** primitives
- **Shiki** code highlighting (`one-light` / `one-dark-pro`) + line highlight transformer
- **KaTeX** for math
- **Vitest** for unit tests, **Stylelint** + **ESLint** for token enforcement
- **pnpm 9.15.4** (pinned via Corepack to avoid Node 23.5 keyid bug)
- Deployed on **Vercel**

## Project layout

```
app/                  # App Router routes + globals.css
content/posts/        # MDX posts (created only via blog-writer skill)
components/
  blog/               # Header, Footer, post layout
  layout/             # DocShell, FABs, hydration gate
  mdx/                # MDXContent, Tabs, Callout, table override
  ui/                 # shadcn primitives
  visualizations/     # Interactive React components used in posts
  providers/          # Theme, settings, mobile UI providers
lib/                  # Utilities + lib/generated/keyword-map.ts (committed)
plugins/
  remark-auto-link.ts # Keyword auto-linking remark plugin
public/fonts/         # Paperlogy (9 weights) + Pretendard + JetBrains Mono
scripts/
  generate-keyword-map.ts  # Builds keyword → slug map from frontmatter
  check-mdx-emphasis.ts    # Guards against `**"…"**` / `**(…)**` patterns
velite.config.ts      # Frontmatter Zod schema + MDX pipeline
```

## Getting started

### Prerequisites

- Node.js (LTS recommended)
- Corepack enabled (`corepack enable`) — pnpm version is pinned in `package.json`

### Install & run

```bash
pnpm install
PORT=3010 pnpm dev
```

Open <http://blog.localhost:3010/>.

> Use `blog.localhost`, not bare `blog`. Safari treats bare `blog` as a search query and forces HTTPS.

> The `dev` script auto-runs `predev`: emphasis guard + keyword map generation. The first boot takes a few seconds longer because Velite compiles all MDX.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next dev server (predev: emphasis guard + keyword map) |
| `pnpm build` | Production build (prebuild: emphasis guard + keyword map + Velite) |
| `pnpm start` | Serve the production build |
| `pnpm type-check` | `tsc --noEmit` |
| `pnpm lint` | `next lint` + Stylelint (token rules) |
| `pnpm lint:fix` | Auto-fix lint and Stylelint issues |
| `pnpm test` | `velite build` then `vitest run` |
| `pnpm test:unit` | `vitest run` only |
| `pnpm generate-keyword-map` | Manual keyword-map regen after frontmatter edits |
| `pnpm check-mdx-emphasis` | One-shot emphasis-guard check |

## Authoring posts

**Posts are MDX files in `content/posts/` with strict frontmatter.** Every post declares `title`/`summary` as `{ ko, en }` objects, lowercase-hyphen `tags`, a `keywords` list (used for keyword auto-linking), and a `category` from the `CATEGORY_IDS` enum (`computer-science`, `data-structure`, `language`, `database`, `frameworks`, `library`, `ai`, `knowledge`, `etc`).

Frontmatter shape (excerpt — see `velite.config.ts` for the full Zod schema):

```yaml
---
title:
  ko: "퀵 정렬"
  en: "Quick Sort"
slug: "quick-sort"
date: 2026-04-15
tags:
  - algorithm
  - cs
keywords:
  - Quick Sort
  - 퀵 정렬
summary:
  ko: "분할 정복 기반 비교 정렬 알고리즘…"
  en: "The classic divide-and-conquer comparison sort…"
category: computer-science
---
```

After editing any frontmatter, regenerate the keyword map:

```bash
pnpm generate-keyword-map
```

The generated file `lib/generated/keyword-map.ts` is **committed**. It powers the build-time keyword auto-linker (`plugins/remark-auto-link.ts`), which turns mentions of registered keywords into `<KeywordLink>` Popovers. **One keyword maps to exactly one post** — collisions abort the build.

### MDX features available in posts

- Fenced code blocks with Shiki (`one-light` / `one-dark-pro`)
- KaTeX math (`$inline$`, `$$block$$`)
- Custom components: `<Callout>`, `<Tabs>` / `<Tab>`, plus interactive visualizations under `components/visualizations/`
- Auto-linked keywords (Popover preview)
- Auto-wrapped table containers (horizontal scroll on overflow)

### Emphasis guard

`scripts/check-mdx-emphasis.ts` runs in `predev`, `prebuild`, and `pretest` and **fails the build** if it finds:

- `**"…"**` (bold around quoted text)
- `**(…)**` (bold around parenthesized text)

These patterns render unreliably with the Remark/Shiki pipeline when combined with Korean particles. Move the punctuation outside the bold: `"**X**"`, `**X**(Y)`.

## Design tokens

CSS variables in `app/globals.css` are split into a 2-tier system:

1. **Primitives** in `@theme inline` (typography scale `--text-*`, `--leading-*`, `--weight-*`, `--tracking-*`, shadcn `--radius-*`).
2. **Semantic aliases** in `:root` (`--layout-*`, `--z-*`, `--callout-*`, `--keyword`, `--code-*`, `--viz-*`, `--shadow-*`).

Hard-coded values (arbitrary `text-[Npx]`, `z-[N]`, `bg-[#...]`, `tracking-[Nem]`, etc.) are blocked by `eslint` (`no-restricted-syntax`) and `stylelint` (`declaration-property-value-disallowed-list`). The full token table lives in [`docs/design-tokens.md`](./docs/design-tokens.md).

User-adjustable font scale is exposed via `html[data-font-size="small|normal|large"]` and synced through `SettingsProvider`. FOUC is prevented by `next/script strategy="beforeInteractive"`.

## Testing

Vitest is configured with **`node` as the default environment**. DOM-touching specs must declare:

```ts
// @vitest-environment jsdom
```

at the top of the file. The suite focuses on pure utilities (`lib/filters.ts`, `lib/posts.ts`, frontmatter schema). UI regressions are caught by `pnpm build` plus a manual pass at the dev URL.

## Deployment

The repository deploys to Vercel against the `main` branch. SEO metadata, `sitemap.ts`, `robots.ts`, and Open Graph are all wired against `https://ing9990.com`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) (한국어: [CONTRIBUTING.ko.md](./CONTRIBUTING.ko.md)) for branch conventions, commit messages, and the post authoring workflow.

## License

Private personal blog — no license granted for content reuse. Code is provided as a reference implementation; please open an issue before reusing substantial portions.
