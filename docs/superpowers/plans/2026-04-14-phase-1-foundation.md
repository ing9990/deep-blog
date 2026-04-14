# Phase 1 — Foundation (Next.js + Velite + MDX Pipeline) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the minimum vertical slice of a Next.js + Velite + MDX pipeline so that `content/posts/hello-world.mdx` renders at `/posts/hello-world` with type-safe frontmatter and Shiki-highlighted code blocks.

**Architecture:** Velite compiles MDX and validates frontmatter (via Zod) at build time, emitting a JSON data file plus TypeScript types under `.velite/`. Next.js 15 App Router pages import this data through a `#site/content` alias and render in 100% RSC — no client JavaScript beyond the Next.js framework baseline. Tailwind v4 with `@tailwindcss/typography` provides temporary `prose` styling that Phase 2 will replace.

**Tech Stack:** Next.js 15, React 19, TypeScript 5 (strict), Velite, Zod, rehype-pretty-code, Shiki, Tailwind CSS v4, Vitest, pnpm.

**Spec reference:** `docs/superpowers/specs/2026-04-14-phase-1-foundation-design.md`

---

## File Structure (what this plan creates)

| File | Responsibility | Task |
|---|---|---|
| `.gitignore` | Ignore `.next`, `.velite`, `node_modules`, coverage | Task 1 |
| `package.json` | pnpm scripts, dependencies | Tasks 1–4 |
| `tsconfig.json` | TypeScript strict + path aliases (`@/*`, `#site/content`) | Task 2 |
| `next.config.mjs` | Velite build hook for `next dev` / `next build` | Task 6 |
| `postcss.config.mjs` | Tailwind v4 PostCSS plugin | Task 3 |
| `tailwind.config.ts` | Content globs + typography plugin | Task 3 |
| `app/globals.css` | Tailwind `@import` | Task 3 |
| `vitest.config.ts` | Vitest config + path aliases | Task 4 |
| `velite.config.ts` | Collections, Zod schemas, MDX options, Shiki plugin | Task 5 |
| `tests/velite-schema.test.ts` | Unit test for `postFrontmatterSchema` | Task 5 |
| `content/posts/hello-world.mdx` | Sample MDX exercising the pipeline | Task 7 |
| `tests/velite-build.test.ts` | Integration test: Velite build output | Task 8 |
| `lib/posts.ts` | `getAllPosts`, `getPostBySlug`, `getAllSlugs` | Task 9 |
| `tests/posts.test.ts` | Unit test for helpers (mocks `#site/content`) | Task 9 |
| `app/layout.tsx` | Root layout, imports `globals.css` | Task 10 |
| `components/mdx/MDXContent.tsx` | Runtime wrapper for Velite-compiled MDX | Task 11 |
| `components/mdx/index.ts` | Shared MDX components map (Phase 1: empty) | Task 11 |
| `app/posts/[slug]/page.tsx` | Post detail page | Task 12 |
| `app/page.tsx` | Dev-convenience post list | Task 13 |

### Deleted in Task 1

Empty placeholder folders left over from an earlier plan: `architecture/`, `cache/`, `concurrency/`, `data-structure/`, `database/`, `network/`, `os/`, `rate-limiting/`, `security/`, `spring/`.

### Preserved

`CLAUDE.md` (vision document, updated during brainstorming), `SUMMARY.md` (Phase 2 input).

---

## Conventions for this plan

- **pnpm only.** Never use `npm` or `yarn`. If `pnpm` is missing, install it via `corepack enable && corepack prepare pnpm@latest --activate` before starting.
- **Every task ends with a commit.** Small, focused commits make review easy and rollback trivial.
- **Commit message format:** `<type>: <subject>` where type ∈ `chore`, `feat`, `test`, `build`. No scopes needed for Phase 1.
- **Working directory for all commands:** `/Users/ing9990/Document/Computer-Science`
- **When a step says "Run X and expect Y":** do not proceed until you actually see Y. If you see something else, STOP and investigate — do not handwave or "fix forward".

---

## Task 1: Initialize repo, pnpm, and strip placeholders

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Delete: `architecture/`, `cache/`, `concurrency/`, `data-structure/`, `database/`, `network/`, `os/`, `rate-limiting/`, `security/`, `spring/`

- [ ] **Step 1: Verify you are in the project root and the repo is not yet initialized**

Run:
```bash
pwd
ls -la
```

Expected: `pwd` prints `/Users/ing9990/Document/Computer-Science`. `ls -la` shows `CLAUDE.md`, `SUMMARY.md`, the placeholder folders, but NO `.git` directory.

If `.git` already exists, STOP — the repo is already initialized and this task's assumptions are wrong.

- [ ] **Step 2: Initialize git**

Run:
```bash
git init
git branch -m main
```

Expected:
```
Initialized empty Git repository in /Users/ing9990/Document/Computer-Science/.git/
```

- [ ] **Step 3: Delete the empty placeholder directories**

Run:
```bash
rmdir architecture cache concurrency data-structure database network os rate-limiting security spring
```

Expected: command succeeds silently. If any directory is non-empty, `rmdir` will fail — in that case STOP and ask the user whether its contents matter.

Verify:
```bash
ls -la
```

Expected output includes `CLAUDE.md`, `SUMMARY.md`, `docs/`, `.git/` and nothing else in the project root.

- [ ] **Step 4: Write `.gitignore`**

Create `.gitignore` with this exact content:

```gitignore
# dependencies
node_modules/
.pnpm-store/

# build output
.next/
.velite/
out/

# test artifacts
coverage/

# environment
.env
.env.local
.env*.local

# editor / OS
.DS_Store
*.log
.vscode/*
!.vscode/settings.json
.idea/
```

- [ ] **Step 5: Initialize pnpm and write `package.json`**

Run:
```bash
pnpm init
```

Expected: creates a bare `package.json`. Then replace its contents with this exact content:

```json
{
  "name": "backend-notes",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "velite build && vitest run",
    "test:unit": "vitest run",
    "velite": "velite build",
    "velite:dev": "velite dev"
  }
}
```

- [ ] **Step 6: Verify pnpm is working**

Run:
```bash
pnpm --version
```

Expected: a version number like `9.x.x` or `10.x.x`. If the command is not found, run `corepack enable && corepack prepare pnpm@latest --activate` and retry.

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json
git commit -m "chore: initialize repo with pnpm and gitignore"
```

---

## Task 2: Install Next.js 15 + React 19 + TypeScript, write tsconfig

**Files:**
- Modify: `package.json` (adds dependencies)
- Create: `tsconfig.json`
- Create: `next-env.d.ts` (auto-generated by tsc on first run)

- [ ] **Step 1: Install runtime and type dependencies**

Run:
```bash
pnpm add next@^15 react@^19 react-dom@^19
pnpm add -D typescript@^5 @types/node @types/react @types/react-dom eslint@^9 eslint-config-next
```

Expected: `package.json` now lists these in `dependencies` and `devDependencies`. `pnpm-lock.yaml` is created.

- [ ] **Step 2: Write `tsconfig.json`**

Create `tsconfig.json` with this exact content:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "#site/content": ["./.velite"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".velite/index.d.ts"
  ],
  "exclude": ["node_modules"]
}
```

Key points about this config:
- `"strict": true` enforces TypeScript strict mode (CLAUDE.md §9.1).
- `"@/*"` resolves repo-root imports (e.g. `@/lib/posts`).
- `"#site/content"` points to `./.velite`, which Velite will populate in Task 5. Until then, the alias target does not exist — that is expected and handled in later tasks.

- [ ] **Step 3: Run the TypeScript compiler to generate `next-env.d.ts`**

Run:
```bash
pnpm type-check
```

Expected: `next-env.d.ts` appears in the project root. The command may report errors like `Cannot find module '#site/content'` or about missing files — that is EXPECTED right now because we have no source files yet. The point of this step is just to generate `next-env.d.ts`.

If you see an error that stops `tsc` from running at all (e.g. a syntax error in `tsconfig.json`), STOP and fix it.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next-env.d.ts
git commit -m "chore: install next 15, react 19, typescript strict"
```

---

## Task 3: Tailwind CSS v4 + typography plugin

**Files:**
- Modify: `package.json` (adds Tailwind deps)
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `app/globals.css`

- [ ] **Step 1: Install Tailwind v4 packages**

Run:
```bash
pnpm add -D tailwindcss@^4 @tailwindcss/postcss@^4 @tailwindcss/typography@^0.5
```

Expected: all three packages added to `devDependencies`.

- [ ] **Step 2: Write `postcss.config.mjs`**

Create `postcss.config.mjs` with this exact content:

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

- [ ] **Step 3: Write `tailwind.config.ts`**

Create `tailwind.config.ts` with this exact content:

```typescript
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './.velite/**/*.json',
  ],
  plugins: [typography],
}

export default config
```

Note: Tailwind v4 is primarily CSS-first; this config file mostly exists so the `@tailwindcss/typography` plugin is registered. Including `.velite/**/*.json` in the content globs ensures class names that appear inside compiled MDX output are also detected by Tailwind's purge.

- [ ] **Step 4: Write `app/globals.css`**

Run:
```bash
mkdir -p app
```

Create `app/globals.css` with this exact content:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

html {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

The `@plugin` directive is the Tailwind v4 way of registering a plugin directly from CSS. It works alongside the `tailwind.config.ts` registration; having both is redundant but harmless, and the CSS-side `@plugin` is what Tailwind v4's docs recommend.

- [ ] **Step 5: Verify no build errors from the Tailwind setup**

Run:
```bash
pnpm type-check
```

Expected: no errors from `tailwind.config.ts` or `postcss.config.mjs`. (You may still see "Cannot find module '#site/content'" and similar — expected.)

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml postcss.config.mjs tailwind.config.ts app/globals.css
git commit -m "build: add tailwind v4 with typography plugin"
```

---

## Task 4: Vitest setup with a smoke test

**Files:**
- Modify: `package.json` (adds Vitest)
- Create: `vitest.config.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Install Vitest**

Run:
```bash
pnpm add -D vitest@^2 @vitejs/plugin-react
```

- [ ] **Step 2: Write `vitest.config.ts`**

Create `vitest.config.ts` with this exact content:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '#site/content': path.resolve(__dirname, './.velite'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: false,
  },
})
```

The `alias` block mirrors `tsconfig.json`'s `paths` so imports behave identically in tests and application code.

- [ ] **Step 3: Write a smoke test that verifies Vitest itself runs**

Run:
```bash
mkdir -p tests
```

Create `tests/smoke.test.ts` with this exact content:

```typescript
import { describe, it, expect } from 'vitest'

describe('vitest smoke', () => {
  it('runs a trivial assertion', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Run the smoke test**

Run:
```bash
pnpm test:unit
```

Expected:
```
 ✓ tests/smoke.test.ts (1)
   ✓ vitest smoke (1)
     ✓ runs a trivial assertion

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

If the test fails or Vitest cannot find the file, STOP and fix the config before moving on.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts tests/smoke.test.ts
git commit -m "test: add vitest with smoke test"
```

---

## Task 5: Velite config + frontmatter schema (TDD)

**Files:**
- Modify: `package.json` (adds Velite deps)
- Create: `tests/velite-schema.test.ts`
- Create: `velite.config.ts`

This task is TDD: test first, then config.

- [ ] **Step 1: Install Velite and related packages**

Run:
```bash
pnpm add velite@^0.2 zod@^3 @mdx-js/react@^3 rehype-pretty-code@^0.14 shiki@^1
```

- [ ] **Step 2: Write the failing schema unit test**

Create `tests/velite-schema.test.ts` with this exact content:

```typescript
import { describe, it, expect } from 'vitest'
import { postFrontmatterSchema } from '../velite.config'

const validFrontmatter = {
  title: 'Test Post',
  slug: 'test-post',
  date: '2026-04-14',
  tags: ['Database'],
  keywords: ['Index'],
  summary: 'A short summary for testing the frontmatter schema.',
}

describe('postFrontmatterSchema', () => {
  it('accepts a valid frontmatter object', () => {
    expect(() => postFrontmatterSchema.parse(validFrontmatter)).not.toThrow()
  })

  it('rejects an uppercase slug', () => {
    expect(() =>
      postFrontmatterSchema.parse({ ...validFrontmatter, slug: 'Test-Post' }),
    ).toThrow()
  })

  it('rejects an empty tags array', () => {
    expect(() =>
      postFrontmatterSchema.parse({ ...validFrontmatter, tags: [] }),
    ).toThrow()
  })

  it('rejects summary shorter than 10 characters', () => {
    expect(() =>
      postFrontmatterSchema.parse({ ...validFrontmatter, summary: 'too short' }),
    ).toThrow()
  })

  it('rejects tags arrays longer than 5', () => {
    expect(() =>
      postFrontmatterSchema.parse({
        ...validFrontmatter,
        tags: ['a', 'b', 'c', 'd', 'e', 'f'],
      }),
    ).toThrow()
  })

  it('defaults draft to false when omitted', () => {
    const parsed = postFrontmatterSchema.parse(validFrontmatter)
    expect(parsed.draft).toBe(false)
  })
})
```

- [ ] **Step 3: Run the schema test to confirm it fails**

Run:
```bash
pnpm test:unit
```

Expected: the schema test file fails to import because `velite.config.ts` does not exist yet. You should see an error like:
```
Failed to resolve import "../velite.config" from "tests/velite-schema.test.ts"
```

This is the expected failure mode for the RED step of TDD. Do NOT proceed until you see it — if you see anything else (like a passing test), you have a bug.

- [ ] **Step 4: Write `velite.config.ts` with the schema**

Create `velite.config.ts` with this exact content:

```typescript
import { defineConfig, defineCollection, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'

// Frontmatter-only schema — unit-testable without a Velite build.
// No fields that depend on MDX compilation.
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

- [ ] **Step 5: Run the schema test again — expect it to pass**

Run:
```bash
pnpm test:unit
```

Expected:
```
 ✓ tests/velite-schema.test.ts (6)
   ✓ postFrontmatterSchema (6)
     ✓ accepts a valid frontmatter object
     ✓ rejects an uppercase slug
     ✓ rejects an empty tags array
     ✓ rejects summary shorter than 10 characters
     ✓ rejects tags arrays longer than 5
     ✓ defaults draft to false when omitted
 ✓ tests/smoke.test.ts (1)

 Test Files  2 passed (2)
      Tests  7 passed (7)
```

If any test fails, the schema is wrong. Compare against the code in Step 4 character-by-character before touching the test file.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml velite.config.ts tests/velite-schema.test.ts
git commit -m "feat: add velite config with zod frontmatter schema"
```

---

## Task 6: Wire Velite into Next.js build

**Files:**
- Create: `next.config.mjs`

- [ ] **Step 1: Write `next.config.mjs`**

Create `next.config.mjs` with this exact content:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.plugins.push(new VeliteWebpackPlugin())
    return config
  },
}

class VeliteWebpackPlugin {
  static started = false
  apply(compiler) {
    compiler.hooks.beforeCompile.tapPromise('VeliteWebpackPlugin', async () => {
      if (VeliteWebpackPlugin.started) return
      VeliteWebpackPlugin.started = true
      const dev = compiler.options.mode === 'development'
      const { build } = await import('velite')
      await build({ watch: dev, clean: !dev })
    })
  }
}

export default nextConfig
```

This is the standard Velite + Next.js App Router integration: on `beforeCompile`, Velite runs once, then stays in watch mode during `next dev` and one-shot builds during `next build`. The `started` guard prevents infinite rebuild loops.

- [ ] **Step 2: Manually verify Velite runs by building the content**

Run:
```bash
pnpm velite
```

Expected output (approximately):
```
╭──────────────────────╮
│   Velite v0.2.x      │
╰──────────────────────╯

No MDX files found matching pattern 'posts/**/*.mdx'
```

Velite should exit successfully (exit code 0) even though no posts exist yet. The `.velite/` directory should now exist and contain `index.js`, `index.d.ts`, and an empty `posts.json` (or similar — the exact file names depend on Velite's output).

Verify with:
```bash
ls .velite
```

Expected: shows at least `index.js` and `index.d.ts`. If the `.velite/` directory does not exist at all, STOP — the Velite config is broken.

- [ ] **Step 3: Verify TypeScript picks up the generated types**

Run:
```bash
pnpm type-check
```

Expected: fewer errors than before (the `#site/content` alias now resolves). There may still be type errors in files we haven't written yet — that is fine.

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs
git commit -m "build: integrate velite into next.js webpack pipeline"
```

---

## Task 7: Sample MDX content

**Files:**
- Create: `content/posts/hello-world.mdx`

- [ ] **Step 1: Create the content directory**

Run:
```bash
mkdir -p content/posts
```

- [ ] **Step 2: Write the sample MDX file**

Create `content/posts/hello-world.mdx` with this exact content:

````mdx
---
title: "Hello, World"
slug: "hello-world"
date: 2026-04-14
tags:
  - Meta
keywords:
  - Hello World
summary: "Phase 1 파이프라인이 정상 동작하는지 확인하는 샘플 글입니다."
---

이 글은 Velite + Next.js + Shiki 파이프라인을 검증하기 위한 샘플입니다.

## 마크다운 기본

일반 문단, **강조**, *이탤릭*, [예시 링크](https://example.com), 그리고 `인라인 코드`를 사용합니다.

## 코드 블록

```typescript title="example.ts"
export function greet(name: string): string {
  return `Hello, ${name}!`
}
```

## 리스트

- 항목 1
- 항목 2
  - 중첩된 항목

1. 순서 있는 첫 번째
2. 순서 있는 두 번째
````

This sample covers every Phase 1 rendering concern listed in spec §8: full frontmatter, two `##` headings, bold/italic/inline-code/link, fenced code block with `typescript` language and `title="example.ts"`, nested unordered list, ordered list.

- [ ] **Step 3: Run Velite to compile the sample**

Run:
```bash
pnpm velite
```

Expected output includes something like:
```
build finished in ... with 1 posts, 0 warnings, 0 errors
```

If Velite reports a Zod validation error on the frontmatter, STOP and re-check the MDX file character-by-character against the content in Step 2.

- [ ] **Step 4: Inspect the build output**

Run:
```bash
ls .velite
cat .velite/posts.json | head -c 500
```

Expected: `posts.json` exists and its first 500 characters show an array starting with `[{"title":"Hello, World",...`. The exact structure depends on Velite's output format; what matters is that the file is not empty and contains your post's data.

- [ ] **Step 5: Commit**

```bash
git add content/posts/hello-world.mdx
git commit -m "feat: add hello-world sample post"
```

---

## Task 8: Velite build output integration test

**Files:**
- Create: `tests/velite-build.test.ts`

- [ ] **Step 1: Write the build smoke test**

Create `tests/velite-build.test.ts` with this exact content:

```typescript
import { describe, it, expect } from 'vitest'
import { posts } from '#site/content'

describe('velite build output', () => {
  it('produces at least one post', () => {
    expect(posts.length).toBeGreaterThan(0)
  })

  it('first post has all required frontmatter fields', () => {
    const post = posts[0]
    expect(post).toMatchObject({
      title: expect.any(String),
      slug: expect.any(String),
      date: expect.any(String),
      tags: expect.any(Array),
      keywords: expect.any(Array),
      summary: expect.any(String),
    })
    expect(post.tags.length).toBeGreaterThan(0)
    expect(post.keywords.length).toBeGreaterThan(0)
  })

  it('first post has a derived url starting with /posts/', () => {
    expect(posts[0].url).toMatch(/^\/posts\//)
  })

  it('first post has a non-empty compiled body', () => {
    expect(typeof posts[0].body).toBe('string')
    expect(posts[0].body.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the full test suite**

Run:
```bash
pnpm test
```

This script chains `velite build && vitest run`, so Velite builds the content first (regenerating `.velite/`), then Vitest runs.

Expected:
```
 ✓ tests/smoke.test.ts (1)
 ✓ tests/velite-schema.test.ts (6)
 ✓ tests/velite-build.test.ts (4)

 Test Files  3 passed (3)
      Tests  11 passed (11)
```

If `tests/velite-build.test.ts` fails with a resolution error on `#site/content`, the vitest config alias is missing or wrong — re-check `vitest.config.ts` from Task 4 Step 2.

- [ ] **Step 3: Commit**

```bash
git add tests/velite-build.test.ts
git commit -m "test: add velite build output integration test"
```

---

## Task 9: `lib/posts.ts` helpers with unit tests (TDD)

**Files:**
- Create: `tests/posts.test.ts`
- Create: `lib/posts.ts`

- [ ] **Step 1: Write the failing helper test**

Run:
```bash
mkdir -p lib
```

Create `tests/posts.test.ts` with this exact content:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('#site/content', () => ({
  posts: [
    {
      slug: 'a',
      title: 'Post A',
      date: '2026-04-14',
      tags: ['T'],
      keywords: ['K'],
      summary: 'summary a',
      draft: false,
      body: 'body',
      toc: [],
      url: '/posts/a',
    },
    {
      slug: 'b',
      title: 'Post B',
      date: '2026-04-10',
      tags: ['T'],
      keywords: ['K'],
      summary: 'summary b',
      draft: false,
      body: 'body',
      toc: [],
      url: '/posts/b',
    },
    {
      slug: 'c',
      title: 'Draft C',
      date: '2026-04-12',
      tags: ['T'],
      keywords: ['K'],
      summary: 'summary c',
      draft: true,
      body: 'body',
      toc: [],
      url: '/posts/c',
    },
  ],
}))

import { getAllPosts, getPostBySlug, getAllSlugs } from '@/lib/posts'

describe('posts helpers', () => {
  it('getAllPosts excludes drafts', () => {
    const slugs = getAllPosts().map((p) => p.slug)
    expect(slugs).toEqual(['a', 'b'])
  })

  it('getAllPosts sorts by date descending', () => {
    const [first, second] = getAllPosts()
    expect(first.date > second.date).toBe(true)
  })

  it('getPostBySlug returns undefined for a draft slug', () => {
    expect(getPostBySlug('c')).toBeUndefined()
  })

  it('getPostBySlug returns the published post for a valid slug', () => {
    expect(getPostBySlug('a')?.title).toBe('Post A')
  })

  it('getPostBySlug returns undefined for an unknown slug', () => {
    expect(getPostBySlug('does-not-exist')).toBeUndefined()
  })

  it('getAllSlugs returns only published slugs', () => {
    expect(getAllSlugs()).toEqual(['a', 'b'])
  })
})
```

`vi.mock('#site/content', ...)` replaces the aliased module with a synthetic fixture so the helper tests do not depend on the real Velite build.

- [ ] **Step 2: Run the tests — expect failure**

Run:
```bash
pnpm test:unit
```

Expected: `tests/posts.test.ts` fails because `@/lib/posts` does not exist yet. The error should be:
```
Failed to resolve import "@/lib/posts" from "tests/posts.test.ts"
```

- [ ] **Step 3: Write the helper**

Create `lib/posts.ts` with this exact content:

```typescript
import { posts as rawPosts } from '#site/content'

export type Post = (typeof rawPosts)[number]

export function getAllPosts(): Post[] {
  return rawPosts
    .filter((p) => !p.draft)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug)
}
```

The `.slice()` before `.sort()` makes sure we do not mutate the imported array — Velite's output is an imported module and mutating it could cause surprising cross-test pollution.

- [ ] **Step 4: Run the tests — expect all passing**

Run:
```bash
pnpm test:unit
```

Expected:
```
 ✓ tests/posts.test.ts (6)
 ✓ tests/smoke.test.ts (1)
 ✓ tests/velite-schema.test.ts (6)

 Test Files  3 passed (3)
      Tests  13 passed (13)
```

(Note: `tests/velite-build.test.ts` is excluded from `test:unit` because `test:unit` runs `vitest run` without the `velite build` prefix. The build test will be re-verified in Task 14.)

Actually — if `tests/velite-build.test.ts` still runs via `pnpm test:unit` (because the include glob catches it), it may fail because `.velite` isn't regenerated. If this happens: run `pnpm velite` first, then `pnpm test:unit`. If you consistently want to skip the build test in `test:unit`, add `--exclude 'tests/velite-build.test.ts'` to the `test:unit` script in `package.json`. For now, just run `pnpm velite && pnpm test:unit` and expect all 13 tests to pass.

- [ ] **Step 5: Commit**

```bash
git add lib/posts.ts tests/posts.test.ts
git commit -m "feat: add posts helper with draft filtering and date sort"
```

---

## Task 10: Root layout

**Files:**
- Create: `app/layout.tsx`

- [ ] **Step 1: Write `app/layout.tsx`**

Create `app/layout.tsx` with this exact content:

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

No OpenGraph / Twitter / sitemap metadata — spec §7.4 and CLAUDE.md §2 explicitly exclude external-facing SEO for a local-only blog. Do not add any.

- [ ] **Step 2: Verify type check passes**

Run:
```bash
pnpm type-check
```

Expected: no errors in `app/layout.tsx`. (Other files may still have errors until Tasks 11–13 land.)

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add root layout importing globals.css"
```

---

## Task 11: `MDXContent` runtime wrapper

**Files:**
- Create: `components/mdx/index.ts`
- Create: `components/mdx/MDXContent.tsx`

- [ ] **Step 1: Create the directory**

Run:
```bash
mkdir -p components/mdx
```

- [ ] **Step 2: Write the shared components map (currently empty)**

Create `components/mdx/index.ts` with this exact content:

```typescript
// Shared MDX component map. Phase 1 renders vanilla HTML only.
// Phase 2+ populates this with Callout, custom CodeBlock, Diagram, etc.
export const mdxComponents = {}
```

- [ ] **Step 3: Write `MDXContent.tsx` following Velite's documented runtime pattern**

Create `components/mdx/MDXContent.tsx`. This component must follow the Velite "Use in React" documentation exactly — specifically the canonical `useMDXComponent` helper Velite publishes. Before writing this file, open Velite's official docs and copy their `useMDXComponent` implementation verbatim into the file, then compose it with `mdxComponents` from `./index`.

The file's shape must be:

```tsx
import * as runtime from 'react/jsx-runtime'
import { mdxComponents } from './index'

// useMDXComponent helper: copy from Velite's "Use in React" documentation.
// The helper takes the compiled `body` string (a function-component source)
// and produces a React component. Do not hand-roll an alternative —
// Velite's compiled output is tightly coupled to this specific helper.
const useMDXComponent = (code: string) => {
  // ... implementation per Velite docs ...
}

interface MDXContentProps {
  code: string
}

export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={mdxComponents} />
}
```

**Security note (already audited in spec §7.2):** the helper evaluates a string produced by Velite's compiler. The string is a deterministic compilation output from version-controlled MDX files, never user input. This is the pattern Velite itself publishes.

To find the canonical implementation:
1. Open https://velite.js.org/guide/using-in-react (or whatever the latest Velite docs URL is)
2. Locate the `useMDXComponent` example
3. Copy it verbatim into the placeholder comment above

If the docs have moved, search the Velite GitHub repo (`zce/velite`) for `useMDXComponent` — the `examples/` directory or README always contains a current reference implementation.

- [ ] **Step 4: Verify type check passes**

Run:
```bash
pnpm type-check
```

Expected: no errors in `components/mdx/MDXContent.tsx` or `components/mdx/index.ts`.

- [ ] **Step 5: Commit**

```bash
git add components/mdx/index.ts components/mdx/MDXContent.tsx
git commit -m "feat: add MDXContent wrapper using velite runtime helper"
```

---

## Task 12: Post detail page `app/posts/[slug]/page.tsx`

**Files:**
- Create: `app/posts/[slug]/page.tsx`

- [ ] **Step 1: Create the directory**

Run:
```bash
mkdir -p app/posts/\[slug\]
```

- [ ] **Step 2: Write the detail page**

Create `app/posts/[slug]/page.tsx` with this exact content:

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

Key behaviors:
- `dynamicParams = false`: unknown slugs return 404 immediately, no SSR fallback.
- `params: Promise<{ slug: string }>`: Next.js 15 async params API.
- `getPostBySlug` excludes drafts, so `draft: true` posts 404 even if accessed directly.

- [ ] **Step 3: Verify type check passes**

Run:
```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/posts/[slug]/page.tsx"
git commit -m "feat: add post detail page with static params and 404 for drafts"
```

---

## Task 13: Minimal dev-convenience index `app/page.tsx`

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Write the index page**

Create `app/page.tsx` with this exact content:

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

This is explicitly a dev-navigation aid, not a designed index page. Phase 2 rewrites this file entirely.

- [ ] **Step 2: Verify type check passes**

Run:
```bash
pnpm type-check
```

Expected: no errors. If you see type errors about `post.url`, the `posts` collection type did not pick up the `transform` — re-run `pnpm velite` and retry.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add minimal dev-convenience index page"
```

---

## Task 14: Acceptance verification

This task is not a commit — it is the verification pass against spec §10.

- [ ] **Step 1: Full build**

Run:
```bash
pnpm build
```

Expected: build succeeds. Output ends with a table showing `/` and `/posts/hello-world` as prerendered static routes. No errors or warnings (other than standard Next.js noise).

If you see a build error, fix it and re-run. Do not proceed with stale artifacts.

- [ ] **Step 2: Type check clean**

Run:
```bash
pnpm type-check
```

Expected: exit code 0 and no output (or only informational lines). Zero errors.

- [ ] **Step 3: Lint clean**

Run:
```bash
pnpm lint
```

Expected: `✔ No ESLint warnings or errors`. If ESLint has not been initialized yet, Next.js will prompt you to choose a config — choose "Strict" to match CLAUDE.md §9. Then re-run lint.

- [ ] **Step 4: All tests pass**

Run:
```bash
pnpm test
```

Expected: 13 tests across 3 files pass (schema: 6, posts: 6 → wait, total 12 unit + 4 build = 16... let me recount):

Actually the running total after all tasks is:
- `tests/smoke.test.ts`: 1
- `tests/velite-schema.test.ts`: 6
- `tests/velite-build.test.ts`: 4
- `tests/posts.test.ts`: 6

Total: **17 tests across 4 files**, all passing.

- [ ] **Step 5: Dev server functional check**

Start the dev server:
```bash
pnpm dev
```

In another terminal (or your browser), load each URL below and verify the expected result.

| URL | Expected |
|---|---|
| `http://localhost:3000/` | Minimal page showing "Backend Notes (Phase 1)", "Phase 2에서 인덱스 페이지..." subtitle, and a bullet list containing one link labeled "Hello, World" |
| `http://localhost:3000/posts/hello-world` | The sample post renders: `#Meta` tag chip, "Hello, World" title, `2026-04-14` date, markdown body with bold/italic/link/inline-code, a Shiki-highlighted code block showing colored tokens, and a visible `example.ts` file-name label above the code block |
| `http://localhost:3000/posts/nonexistent` | Next.js 404 page |

- [ ] **Step 6: Draft 404 check**

Edit `content/posts/hello-world.mdx` and temporarily add `draft: true` to the frontmatter. Save and let the dev server HMR pick it up (Velite will re-run automatically because of the `watch: dev` flag in `next.config.mjs`).

Reload `http://localhost:3000/posts/hello-world` — expected: Next.js 404 page.

Revert the change:
```bash
git checkout content/posts/hello-world.mdx
```

Reload `http://localhost:3000/posts/hello-world` — expected: the post renders again.

- [ ] **Step 7: Zod frontmatter error check**

Edit `content/posts/hello-world.mdx` and remove the `title:` line entirely. Save.

Expected: the terminal running `pnpm dev` shows a Velite build error referencing `title` as a required field, with a clear Zod message. The exact wording is produced by Velite/Zod and may vary, but "title" must appear in the error.

Revert:
```bash
git checkout content/posts/hello-world.mdx
```

- [ ] **Step 8: HMR check for a new MDX file**

With the dev server still running, create a second file `content/posts/second.mdx`:

```mdx
---
title: "Second Post"
slug: "second"
date: 2026-04-13
tags:
  - Meta
keywords:
  - Second
summary: "HMR 검증용 두 번째 글입니다."
---

두 번째 글의 본문입니다.
```

Expected: within a few seconds, the terminal shows Velite re-running and Next.js picking up the change. Reload `http://localhost:3000/` — you should see two links (one for `Hello, World`, one for `Second Post`). Click the second link and verify `/posts/second` renders.

Delete the test file:
```bash
rm content/posts/second.mdx
```

Reload — the index should be back to one entry.

- [ ] **Step 9: Code-quality audit**

Run:
```bash
grep -rn "use client" app components lib
grep -rn ": any" app components lib velite.config.ts
grep -rn "openGraph\|twitter\|sitemap\|robots" app components lib next.config.mjs
```

Expected: every grep returns **zero matches**. Any match is a spec violation:
- `'use client'` → Phase 1 is 100% RSC.
- `: any` → CLAUDE.md §9.1 forbids `any`.
- SEO keywords → spec §7.4 and CLAUDE.md §2 forbid external-facing metadata.

If any grep returns matches, STOP and remove them.

- [ ] **Step 10: Stop dev server and make a final "Phase 1 complete" commit**

Stop `pnpm dev` (Ctrl-C).

Run:
```bash
git status
```

Expected: working tree clean. If there are untracked files, investigate before committing.

If the tree is clean, the work is fully committed across Tasks 1–13. No additional commit is needed for this task — Task 14 is verification only.

Optionally, tag the milestone:
```bash
git tag phase-1-complete
```

---

## Self-review summary (performed by plan author)

**Spec coverage:** Every subsection of the spec maps to at least one task —
- §2 architecture → Tasks 5, 6
- §3 boundaries → entire plan stays within boundaries
- §4 dependencies → Tasks 2, 3, 4, 5
- §5 file structure → every file accounted for
- §5 deletions → Task 1 Step 3
- §6 Velite schema → Task 5
- §7 runtime rendering → Tasks 10, 11, 12, 13
- §8 sample content → Task 7
- §9 test strategy → Tasks 4 (smoke), 5 (schema), 8 (build), 9 (helpers)
- §10 acceptance criteria → Task 14

**Placeholder scan:** No "TBD" / "TODO" / "add appropriate" / "similar to" phrases remain. Task 11 instructs the implementer to copy Velite's canonical `useMDXComponent` verbatim from docs — this is a deliberate handoff because the exact implementation is coupled to Velite's output format and pinning it here risks drift if Velite updates.

**Type consistency:** `postFrontmatterSchema` (exported from `velite.config.ts`) is referenced only in Task 5's test and nowhere else by that name — consistent. `getAllPosts`, `getPostBySlug`, `getAllSlugs` signatures are identical in Task 9 helper and Tasks 12–13 consumers. `MDXContent` props `{ code: string }` match between Task 11 and Task 12. `post.url`, `post.tags`, `post.title`, `post.date`, `post.slug`, `post.body` all match the Velite schema collection output from Task 5.

**Open issue called out in plan:** Task 9 Step 4 notes that `pnpm test:unit` may also run the build test depending on glob behavior. The running note tells the implementer to run `pnpm velite && pnpm test:unit` if this happens. Not worth adding CLI flags just for this.
