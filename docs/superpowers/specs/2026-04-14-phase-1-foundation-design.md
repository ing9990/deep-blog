# Phase 1 — Foundation (Next.js + Velite + MDX Pipeline) Design Spec

> **Status:** Approved design (brainstorming complete). Next step: writing-plans.
> **Scope:** Phase 1 only — foundation layer of Backend Notes. Phases 2–6 are out of scope.
> **Parent context:** `CLAUDE.md` at repo root defines the overall project vision.

---

## 1. Goal

Stand up the minimum vertical slice of the blog pipeline so that writing a single `.mdx` file in `content/posts/` results in that file being rendered at `/posts/[slug]` with type-safe frontmatter and Shiki-highlighted code blocks.

**Explicitly deferred to later phases:**
- Designed index page, TOC, related posts, tag pages (Phase 2)
- Custom MDX components (Callout, custom CodeBlock with copy button, Diagram) (Phase 2)
- Keyword auto-linking via remark plugin (Phase 3)
- Visualization framework (Phase 4)
- FlexSearch client-side search (Phase 5)
- Dark mode, responsive polish, perf optimization (Phase 6)

---

## 2. Architecture Overview

```
[작성]                          [빌드 타임]                        [런타임]
content/posts/*.mdx    ─►  Velite (Zod 검증 + MDX 컴파일)   ─►   .velite/posts.json
                                │                                        │
                                │                                        ▼
                                ▼                             Next.js RSC
                        .velite/index.d.ts                    app/posts/[slug]/page.tsx
                        (자동 타입)                           ↓ reads json
                                                              MDX 렌더 + Shiki
```

**Principles:**
- **Build-time processing.** All MDX compilation, frontmatter validation, and syntax highlighting happens at build time. Runtime reads prebuilt JSON — zero parser overhead on first paint.
- **100% RSC in Phase 1.** No `'use client'` files. Client bundle contribution is 0 KB beyond Next.js framework baseline.
- **Single content tool (Velite).** Velite owns frontmatter schema validation (Zod), MDX → JSX compilation, Shiki integration, and TypeScript type emission. No `@next/mdx`, no Contentlayer.
- **Progressive spec.** The `velite.config.ts` schema implements the *complete* frontmatter specified in `CLAUDE.md` (including `keywords`, `series`, etc.) even though Phase 1 doesn't consume all fields. This avoids schema churn in later phases.

**Tool choice — Velite over Contentlayer:** Contentlayer has been unmaintained by its original author for over a year; the community fork (`contentlayer2`) has intermittent support and known issues with Next.js 15 + React 19. Velite is actively maintained, uses Zod for schema (runtime validation + automatic type inference), and its build output is plain JSON + generated `.d.ts` — simpler to debug. Velite's `superRefine` hook also makes Phase 3 keyword uniqueness checks straightforward.

---

## 3. System Boundaries

| In scope (Phase 1) | Out of scope (later phases) |
|---|---|
| Next.js 15 project initialization (App Router, TypeScript strict) | Designed index page, PostCard, SearchBar (Phase 2) |
| Velite configuration with complete Zod schema | TOC sidebar, related posts (Phase 2) |
| `app/posts/[slug]/page.tsx` minimal renderer | Custom Callout, CodeBlock, Diagram components (Phase 2) |
| `app/page.tsx` minimal `<ul>` post list (for dev convenience, not design) | Keyword auto-linking remark plugin (Phase 3) |
| Shiki via `rehype-pretty-code` | Visualization framework (Phase 4) |
| Tailwind CSS v4 + `@tailwindcss/typography` (temporary `prose` styling) | FlexSearch (Phase 5) |
| `lib/posts.ts` helpers (`getAllPosts`, `getPostBySlug`, `getAllSlugs`) | Dark mode (Phase 6) |
| Vitest setup + schema/helper/build-output tests | Playwright E2E (Phase 6) |
| Sample `content/posts/hello-world.mdx` exercising the pipeline | Real content migration (ongoing, post-Phase 1) |
| Git repo initialization (currently not a repo) | |

---

## 4. Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| `next` | `^15` | Framework, includes React 19 support |
| `react` | `^19` | |
| `react-dom` | `^19` | |
| `velite` | `^0.2` | Content pipeline: Zod schema + MDX compile |
| `zod` | `^3` | Schema (Velite peer dep) |
| `@mdx-js/react` | `^3` | Runtime provider for compiled MDX |
| `rehype-pretty-code` | `^0.14` | Shiki-based code highlighting |
| `shiki` | `^1` | Syntax theme engine |
| `tailwindcss` | `^4` | Styling |
| `@tailwindcss/postcss` | `^4` | Tailwind v4 PostCSS plugin |
| `@tailwindcss/typography` | `^0.5` | `prose` class (temporary Phase 1 styling; removed in Phase 2) |

### Dev

| Package | Version | Purpose |
|---|---|---|
| `typescript` | `^5` | |
| `@types/node`, `@types/react`, `@types/react-dom` | latest | |
| `vitest` | `^2` | Unit tests |
| `@vitejs/plugin-react` | latest | Vitest React plugin |
| `eslint` | `^9` | Linting |
| `eslint-config-next` | latest | Next.js lint preset |

### Intentionally excluded

- `@next/mdx` — Velite owns MDX compilation
- `contentlayer`, `contentlayer2` — replaced by Velite
- `framer-motion`, `d3`, `three`, `visx` — deferred to Phase 4
- `@playwright/test` — deferred to Phase 6
- `@testing-library/*` — deferred; Phase 1 has no interactive component tests

---

## 5. File Structure (Phase 1 state)

```
/
├── .velite/                         # (gitignored) Velite build output
├── app/
│   ├── layout.tsx                   # minimal: html/body + globals.css import
│   ├── page.tsx                     # minimal: <ul> of posts for dev convenience
│   ├── posts/
│   │   └── [slug]/
│   │       └── page.tsx             # post detail (main Phase 1 page)
│   └── globals.css                  # Tailwind import
├── content/
│   └── posts/
│       └── hello-world.mdx          # sample post exercising the pipeline
├── components/
│   └── mdx/
│       ├── MDXContent.tsx           # runtime wrapper for Velite-compiled MDX
│       └── index.ts                 # base components map (Phase 1: empty)
├── lib/
│   └── posts.ts                     # helpers reading from #site/content
├── tests/
│   ├── posts.test.ts                # helpers unit test (mocks #site/content)
│   ├── velite-schema.test.ts        # Zod schema unit test
│   └── velite-build.test.ts         # build output smoke test
├── velite.config.ts                 # ⭐ schema + plugins + mdx options
├── next.config.mjs                  # Velite build hook
├── tsconfig.json                    # strict: true, paths: { "@/*", "#site/content" }
├── tailwind.config.ts               # minimal (typography plugin only)
├── postcss.config.mjs               # Tailwind v4 plugin
├── vitest.config.ts                 # Vitest + alias config
├── .gitignore                       # .next, .velite, node_modules, coverage
├── package.json                     # pnpm scripts
├── CLAUDE.md                        # existing (updated during brainstorming)
└── SUMMARY.md                       # existing (preserved; Phase 2 input)
```

### To delete (before Phase 1 work starts)

Empty placeholder folders left over from an earlier Gitbook plan:

- `architecture/`
- `cache/`
- `concurrency/`
- `data-structure/`
- `database/`
- `network/`
- `os/`
- `rate-limiting/`
- `security/`
- `spring/`

`SUMMARY.md` is preserved — it serves as input to Phase 2 index page design.

### Intentionally NOT created in Phase 1

These appear in `CLAUDE.md`'s overall file structure (§3) but are deferred:

- `components/blog/*` (Phase 2)
- `components/mdx/CodeBlock.tsx`, `Diagram.tsx` (Phase 2+)
- `components/visualizations/*` (Phase 4)
- `lib/keyword-map.ts`, `lib/search-index.ts` (Phases 3, 5)
- `plugins/remark-auto-link.ts` (Phase 3)

---

## 6. Velite Configuration

### 6.1 Schema

```typescript
// velite.config.ts
import { defineConfig, defineCollection, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'

// Frontmatter-only schema — unit-testable without a Velite build,
// because it has no fields that depend on MDX compilation.
export const postFrontmatterSchema = s
  .object({
    title: s.string().max(120),
    slug: s.slug('post'),
    date: s.isodate(),
    updatedAt: s.isodate().optional(),
    tags: s.array(s.string()).min(1).max(5),
    keywords: s.array(s.string()).min(1),
    summary: s.string().min(10).max(300),
    series: s.string().optional(),
    seriesOrder: s.number().int().positive().optional(),
    draft: s.boolean().default(false),
  })
  .refine((data) => data.slug === data.slug.toLowerCase(), {
    message: 'slug must be lowercase',
    path: ['slug'],
  })

// Full collection schema — extends frontmatter with Velite-only fields
// (body compiled from MDX, toc extracted at build time) and a derived url.
const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.mdx',
  schema: postFrontmatterSchema
    .extend({
      body: s.mdx(),
      toc: s.toc(),
    })
    .transform((data) => ({
      ...data,
      url: `/posts/${data.slug}`,
    })),
})

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    clean: true,
  },
  collections: { posts },
  mdx: {
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: { light: 'github-light', dark: 'github-dark' },
          keepBackground: false,
          defaultLang: 'plaintext',
        },
      ],
    ],
  },
})
```

### 6.2 Design choices

| Choice | Reason |
|---|---|
| `postFrontmatterSchema` split from the full collection schema | The frontmatter-only schema has no Velite-specific fields, so Vitest can import it and run synchronous unit tests without needing a prior `velite` build step |
| `s.slug('post')` | Velite built-in: URL-safe check + duplicate detection across the collection (free) |
| `s.isodate()` | Only accepts `YYYY-MM-DD` strings. Avoids `new Date()` parsing ambiguity |
| `s.mdx()` on `body` | Velite compiles MDX to a function-component source string stored in JSON. Runtime evaluates it via Velite's documented MDX runtime pattern |
| `s.toc()` on `toc` | Build-time TOC extraction. Unused in Phase 1 but costs nothing and Phase 2 uses it immediately |
| `url` transform | Precomputes `/posts/${slug}` so consumers don't recompute |
| Custom refine: lowercase slug | CLAUDE.md §4.1 requires URL-safe slugs |
| Both light + dark themes prewarmed | Phase 6 dark mode will flip a CSS var, no code block rewrite |
| `draft` default `false` | Matches CLAUDE.md §4.1 optional field semantics |
| `draft` filtering **not** in schema | Done in `lib/posts.ts` so `draft: true` posts still pass schema validation during `pnpm build` |

### 6.3 Deferred validations (Phase 3)

- Global keyword uniqueness (one keyword → one post across the entire collection). Implemented via Velite's `onSuccess` hook in Phase 3.
- Tag casing normalization (PascalCase enforcement).

---

## 7. Runtime Rendering

### 7.1 `app/posts/[slug]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import { getAllSlugs, getPostBySlug } from '@/lib/posts'
import { MDXContent } from '@/components/mdx/MDXContent'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <article className="prose prose-neutral mx-auto max-w-[720px] px-4 py-12">
      <header className="not-prose mb-8">
        <div className="mb-3 flex gap-2 text-xs text-neutral-500">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <time className="mt-2 block text-sm text-neutral-500">{post.date}</time>
      </header>
      <MDXContent code={post.body} />
    </article>
  )
}
```

### 7.2 `components/mdx/MDXContent.tsx`

The compiled MDX stored in `post.body` is a function-component source string produced by Velite's `s.mdx()`. `MDXContent` is a thin wrapper that evaluates that source against `react/jsx-runtime` and renders the resulting component with the `sharedComponents` map (Phase 1: empty; Phase 2+ populates it with Callout, CodeBlock, etc.).

Follow Velite's official MDX runtime helper pattern exactly — see the Velite docs "Use in React" section and the canonical `useMDXComponent` utility they publish. Do not hand-roll a different evaluation mechanism; Velite's compiled output format is tightly coupled to the documented runtime.

Interface:

```tsx
interface MDXContentProps {
  code: string  // post.body from Velite output
}

export function MDXContent({ code }: MDXContentProps): JSX.Element
```

**Security note:** The runtime evaluates a string produced by Velite's compiler. This is safe because:
1. Content comes exclusively from `content/posts/*.mdx` files under version control — never user-submitted input.
2. Velite controls compilation; the output is deterministic and audited by the Velite project itself.
3. This is the officially documented pattern in Velite's "Use in React" guide; implementation plan tasks must reference that guide when writing the file.

### 7.3 `lib/posts.ts`

```typescript
import { posts as rawPosts } from '#site/content'

export type Post = (typeof rawPosts)[number]

export function getAllPosts(): Post[] {
  return rawPosts
    .filter((p) => !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug)
}
```

### 7.4 `app/layout.tsx`

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Backend Notes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  )
}
```

> No OpenGraph / Twitter / sitemap / robots metadata — CLAUDE.md §2 explicitly excludes external-facing SEO for a local-only blog.

### 7.5 `app/page.tsx` (dev-convenience minimal index)

```tsx
import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'

export default function HomePage() {
  const posts = getAllPosts()
  return (
    <main className="mx-auto max-w-[720px] px-4 py-12">
      <h1 className="text-2xl font-bold">Backend Notes (Phase 1)</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Phase 2에서 인덱스 페이지 디자인이 도입됩니다.
      </p>
      <ul className="mt-6 space-y-2">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={post.url} className="underline">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

**Rationale for including this in Phase 1 despite "no index page":** Developer ergonomics. A bare `<ul><li>` is not a designed index; it's a dev navigation aid. Phase 2 rewrites this file entirely, so the Phase 1 cost is not wasted.

### 7.6 Runtime design choices

| Choice | Reason |
|---|---|
| `dynamicParams = false` | Phase 1 is 100% SSG. Unknown slugs → 404 without SSR attempt |
| `params: Promise<...>` | Next.js 15 async params API |
| Velite's documented MDX runtime helper | Canonical, scope-isolated evaluation of Velite-compiled MDX strings |
| `max-w-[720px]` | CLAUDE.md §6.2: "본문 영역 max-width: 720px" |
| `prose prose-neutral` | Temporary Phase 1 body styling. Phase 2 replaces with custom typography |
| `not-prose` on header | Tags/date excluded from prose styles; only body MDX gets prose treatment |
| Draft filtering in helper | `draft: true` posts 404 even with direct URL access |

---

## 8. Sample Content

### `content/posts/hello-world.mdx` (illustrative)

Frontmatter fields required for Phase 1:

| Field | Value |
|---|---|
| `title` | `"Hello, World"` |
| `slug` | `"hello-world"` |
| `date` | `2026-04-14` |
| `tags` | `["Meta"]` |
| `keywords` | `["Hello World"]` |
| `summary` | `"Phase 1 파이프라인이 정상 동작하는지 확인하는 샘플 글입니다."` |

Body must exercise every Phase 1 rendering concern:

- At least two `##` headings (verifies heading rendering + TOC prewarm)
- A paragraph with **bold**, *italic*, `inline code`, and a Markdown link
- One fenced code block with both a language hint (`typescript`) and a title attribute (`title="example.ts"`) — verifies `rehype-pretty-code` wiring
- One unordered list with a nested sub-item
- One ordered list

The implementation plan's content-authoring task must include a representative MDX file that covers every item above. The exact text is flexible; the coverage is not.

---

## 9. Test Strategy (Vitest)

Phase 1 tests verify *the pipeline is wired*, not component behavior. Three Vitest files plus a TypeScript type-check step:

### 9.1 `tests/velite-schema.test.ts` (unit, no build required)

Imports `postFrontmatterSchema` (the frontmatter-only schema, without `body`/`toc`/`url`) directly from `velite.config.ts`:

- Accepts a valid frontmatter object
- Rejects uppercase slug
- Rejects empty `tags` array
- Rejects `summary` shorter than 10 characters
- Rejects `tags` array with more than 5 elements
- `draft` defaults to `false` when omitted

### 9.2 `tests/posts.test.ts` (unit, `#site/content` mocked)

Uses `vi.mock('#site/content', ...)` with a synthetic post list:

- `getAllPosts()` excludes drafts
- `getAllPosts()` sorts by date descending
- `getPostBySlug(slug)` returns undefined for drafts
- `getPostBySlug(slug)` returns a published post
- `getAllSlugs()` excludes drafts

### 9.3 `tests/velite-build.test.ts` (integration, requires prior Velite build)

Imports from `#site/content` (same alias the runtime uses) so the test exercises the exact module the app consumes:

- At least one post exists in the build output
- First post has all required fields (title, slug, date, tags, keywords, summary, body, url)
- `url` starts with `/posts/`
- Compiled `body` is a non-empty string

`package.json` test script chains: `velite && vitest run`. The initial `velite` step ensures `.velite` and the `#site/content` alias target exist before Vitest starts.

### 9.4 TypeScript type check

`pnpm type-check` runs `tsc --noEmit`. This validates that `.velite/index.d.ts` is generated correctly and that `@/lib/posts` exports the expected types.

### 9.5 Intentionally excluded from Phase 1

| Excluded | Reason |
|---|---|
| RSC rendering tests for `app/posts/[slug]/page.tsx` | Testing Library + RSC is awkward; Phase 1 logic in the page is trivial |
| MDX custom component tests | No custom components in Phase 1 |
| Shiki output snapshot tests | Maintenance cost too high vs manual visual verification |
| Playwright E2E | Deferred to Phase 6 |

---

## 10. Acceptance Criteria

Phase 1 is "done" when every checkbox below passes:

### Build

- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds (runs Velite + `next build`)
- [ ] `pnpm type-check` reports 0 errors
- [ ] `pnpm lint` reports 0 warnings/errors

### Tests

- [ ] `pnpm test` passes all three Vitest files in §9
- [ ] Schema test runs standalone (no Velite build required)

### Functional

- [ ] `pnpm dev` → `http://localhost:3000` shows the minimal post list with `hello-world` linked
- [ ] `http://localhost:3000/posts/hello-world` renders the sample post
- [ ] Code block is highlighted by Shiki (token colors visible)
- [ ] Code block title `example.ts` is visually displayed
- [ ] Unknown slug (e.g. `/posts/nonexistent`) returns 404
- [ ] Direct URL access to a `draft: true` post returns 404

### Developer experience

- [ ] Adding a new MDX file under `content/posts/` is picked up via HMR during `pnpm dev`
- [ ] A post missing a required frontmatter field causes `pnpm build` to fail with a clear Zod error message

### Code quality

- [ ] No violations of CLAUDE.md §11 prohibitions
- [ ] Zero `any` types in Phase 1 source files
- [ ] Zero `'use client'` directives in Phase 1 files (100% RSC)
- [ ] No SEO / OpenGraph / sitemap / `robots.txt` code anywhere

---

## 11. Open Questions / Risks

| Risk | Mitigation |
|---|---|
| Velite + Next.js 15 / React 19 compatibility at the exact versions used | Implementation plan's first task pins specific versions; if a conflict arises, downgrade Next to 14.x as a fallback and document |
| `rehype-pretty-code` dual-theme output structure changes between versions | Pin minor version; write the schema test to not depend on exact HTML markup |
| Velite MDX runtime evaluation of compiled strings | Content is version-controlled, Velite compiles deterministically, and the pattern is Velite's officially documented approach. Documented in §7.2 |
| Tailwind v4 typography plugin compatibility | `@tailwindcss/typography` supports v4 as of `0.5.15`; pin minimum version |

---

## 12. Handoff

Next step: invoke `superpowers:writing-plans` to produce a task-by-task implementation plan based on this spec.

The implementation plan will be saved to `docs/superpowers/plans/2026-04-14-phase-1-foundation.md`.
