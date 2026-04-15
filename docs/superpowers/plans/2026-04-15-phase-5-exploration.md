# Phase 5 — Exploration Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver three discovery features — FlexSearch full-body search (fetch-on-demand), a "최근 글" section on post detail pages, and `/tags/[tag]` SSG pages — so readers can find and relate content beyond the current substring-only search.

**Architecture:** Build-time script generates `public/search-index.json` from raw MDX bodies. The client `SearchBar` lazy-loads the index on first interaction and enriches the existing URL-driven filter flow by writing a `matched=slug1,slug2` query parameter; the server-rendered `PostList` consumes that list (or falls back to substring search for shared URLs). The recent-posts section and tag pages reuse existing `PostCard` / `PostList` components with focused server logic in `lib/related-posts.ts` and `app/tags/[tag]/page.tsx`.

**Tech Stack:** Next.js 15 (App Router), Velite 0.2, FlexSearch 0.7 (dynamic import + Document index), TypeScript strict, Vitest 2, Tailwind CSS v4.

**Related spec:** `docs/superpowers/specs/2026-04-15-phase-5-exploration-design.md`

---

## File Structure

**New files:**
- `scripts/generate-search-index.ts` — build-time index generation from raw MDX, run via `prebuild`/`predev`/`pretest` hooks.
- `lib/search-index.ts` — types (`SearchDoc`, `SearchIndexEntry`), `SEARCH_INDEX_CONFIG`, `loadAndBuildIndex()` client helper, `extractPlainText()` shared by script + tests.
- `lib/related-posts.ts` — `getRecentPosts(excludeSlug, n)` pure function over `getAllPosts()`.
- `components/blog/RecentPostsSection.tsx` — server component rendering 4-card grid below the post article.
- `components/blog/TagPageHeader.tsx` — server component rendering `#Tag` + count + back-link on tag pages.
- `app/tags/[tag]/page.tsx` — tag SSG route with `generateStaticParams`, `dynamicParams = false`.
- `tests/search-index-text.test.ts` — tests for `extractPlainText()` (pure, runs in node env).
- `tests/search-index-roundtrip.test.ts` — tests for `loadAndBuildIndex()` with mocked `fetch` + in-memory storage (jsdom pragma).
- `tests/related-posts.test.ts` — unit tests for `getRecentPosts()`.
- `tests/filters-matched.test.ts` — unit tests for the new `matched?: string[]` param on `applyFilters()`.

**Modified files:**
- `package.json` — add `flexsearch` dependency (not devDependency — used at runtime).
- `.gitignore` — add `/public/search-index.json`.
- `lib/filters.ts` — extend `PostFilters` with `matched?: readonly string[]`, intersect during `applyFilters`.
- `lib/utils.ts` — extend `buildPostsUrl` to include `matched` in URL encoding.
- `app/page.tsx` — read `matched` search param, pass through to `applyFilters`.
- `components/blog/SearchBar.tsx` — lazy-load FlexSearch on first focus/input, compute `matched` slug list, push to URL alongside existing `q`.
- `app/posts/[slug]/page.tsx` — import `getRecentPosts`, render `<RecentPostsSection>` below article.
- `components/blog/PostMeta.tsx` — tag chips now link to `/tags/[tag]` instead of `/?tag=...`.
- `velite.config.ts` — add refine on `tags` to block `/ ? #` characters at build time.
- `CLAUDE.md` — §6.2 related-posts rule, §12 phase priorities, new §18 Phase 5 current state.

---

## Task 1: Install flexsearch dependency

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (automatic)

FlexSearch is a runtime dependency (loaded dynamically in the browser), not a devDependency. Version pinned to `^0.7` per spec §2.7.

- [ ] **Step 1: Install flexsearch**

Run: `pnpm add flexsearch@^0.7 && pnpm add -D @types/flexsearch`
Expected: Adds `flexsearch` to `dependencies` and `@types/flexsearch` to `devDependencies`. Updates lockfile. No breaking output.

- [ ] **Step 2: Verify package.json**

Read `package.json` and confirm both entries.

- [ ] **Step 3: Verify existing tests still pass**

Run: `pnpm test`
Expected: All 103 existing tests still green.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore(deps): add flexsearch for Phase 5 full-body search

Pinned to ^0.7 per spec §2.7. Loaded via dynamic import in the
browser, so stays out of the initial client bundle.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create `lib/search-index.ts` (types + config)

**Files:**
- Create: `lib/search-index.ts`

Defines the `SearchDoc` shape, the FlexSearch `Document` config, and the serialization entry type. No runtime logic yet — this file is consumed by both the build-time script (Task 3) and the client helper (Task 5).

- [ ] **Step 1: Create the file**

```typescript
// lib/search-index.ts
import type { IndexOptionsForDocumentSearch } from 'flexsearch'

/**
 * One document indexed by FlexSearch. `body` is the plain-text extraction
 * from the raw MDX content; `tags` and `keywords` are joined with spaces
 * so FlexSearch treats them as a single tokenized field.
 */
export interface SearchDoc {
  slug: string
  title: string
  summary: string
  body: string
  tags: string
  keywords: string
}

/**
 * FlexSearch Document configuration shared by the build-time generator
 * and the client-side loader. Field weights reflect relevance signal
 * strength: title match is the strongest, body match is the weakest
 * (long text, noisy).
 *
 * See spec §4.1 for the weighting rationale.
 */
export const SEARCH_INDEX_CONFIG: IndexOptionsForDocumentSearch<SearchDoc> = {
  document: {
    id: 'slug',
    index: [
      { field: 'title', tokenize: 'forward', resolution: 9, weight: 10 },
      { field: 'summary', tokenize: 'forward', resolution: 7, weight: 5 },
      { field: 'tags', tokenize: 'forward', resolution: 5, weight: 8 },
      { field: 'keywords', tokenize: 'forward', resolution: 5, weight: 7 },
      { field: 'body', tokenize: 'forward', resolution: 5, weight: 1 },
    ],
    store: ['slug', 'title', 'summary', 'tags'],
  },
}

/**
 * Serialized FlexSearch index — what `public/search-index.json` contains.
 * FlexSearch's `Document.export(callback)` emits a key/value pair per
 * internal index chunk; we collect them into this flat map.
 */
export type SerializedIndex = Record<string, string>

/**
 * Strip all MDX syntax to produce a plain-text string suitable for
 * FlexSearch. Removes frontmatter, JSX tags, code blocks, inline code,
 * KaTeX math, images, and markdown markup — leaves only human-readable
 * body text and link anchor text.
 *
 * Used by both the build-time script and its unit tests. Keeping it in
 * this shared module avoids duplication and lets tests run without
 * touching the filesystem.
 */
export function extractPlainText(mdxContent: string): string {
  return mdxContent
    .replace(/^---[\s\S]*?\n---\n/, '')
    .replace(/<[A-Z][^>]*\/?>|<\/[A-Z][^>]*>/g, ' ')
    .replace(/<[a-z][^>]*>|<\/[a-z][^>]*>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: No errors. `IndexOptionsForDocumentSearch<SearchDoc>` comes from `@types/flexsearch` installed in Task 1.

- [ ] **Step 3: Commit**

```bash
git add lib/search-index.ts
git commit -m "$(cat <<'EOF'
feat(search): add lib/search-index.ts (types + config + extractPlainText)

Shared types/config module consumed by the build-time generator
(Task 3) and the client loader (Task 5). extractPlainText strips
frontmatter, MDX JSX, code blocks, KaTeX math, and markdown markup
so the index holds human-readable text only.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Write `extractPlainText` unit tests (RED → GREEN already covered)

**Files:**
- Create: `tests/search-index-text.test.ts`

`extractPlainText()` was added in Task 2 and already works; this task is the retroactive test suite. It runs in the default node environment (no jsdom needed).

- [ ] **Step 1: Create the test file**

```typescript
import { describe, it, expect } from 'vitest'
import { extractPlainText } from '@/lib/search-index'

describe('extractPlainText', () => {
  it('strips frontmatter block at the start', () => {
    const input = `---\ntitle: Hello\ndate: 2026-04-15\n---\n\n본문입니다.`
    expect(extractPlainText(input)).toBe('본문입니다.')
  })

  it('removes JSX components (capitalized tag names)', () => {
    const input = '텍스트 <Callout type="info">안쪽</Callout> 뒤에 <QuickSort /> 끝'
    expect(extractPlainText(input)).toBe('텍스트 안쪽 뒤에 끝')
  })

  it('removes HTML tags (lowercase tag names)', () => {
    const input = '텍스트 <div>안쪽</div> 끝'
    expect(extractPlainText(input)).toBe('텍스트 안쪽 끝')
  })

  it('removes fenced code blocks entirely', () => {
    const input = '설명\n```python\nprint("hello")\n```\n뒤에'
    expect(extractPlainText(input)).toBe('설명 뒤에')
  })

  it('removes inline code spans', () => {
    const input = 'foo `bar` baz'
    expect(extractPlainText(input)).toBe('foo baz')
  })

  it('removes inline and block KaTeX math', () => {
    const input = '평균 $O(n \\log n)$ 이며\n\n$$T(n) = 2T(n/2) + O(n)$$\n\n최악 $O(n^2)$'
    expect(extractPlainText(input)).toBe('평균 이며 최악')
  })

  it('removes image markdown', () => {
    const input = '앞 ![alt text](/img.png) 뒤'
    expect(extractPlainText(input)).toBe('앞 뒤')
  })

  it('preserves link anchor text but drops URLs', () => {
    const input = '[B-Tree 글](/posts/b-tree-structure)을 참고'
    expect(extractPlainText(input)).toBe('B-Tree 글 을 참고')
  })

  it('strips markdown emphasis/heading markers', () => {
    const input = '## 제목\n\n**굵게** _기울임_ ~취소선~'
    expect(extractPlainText(input)).toBe('제목 굵게 기울임 취소선')
  })

  it('collapses whitespace runs to single spaces', () => {
    const input = 'a   b\n\n\nc\t\td'
    expect(extractPlainText(input)).toBe('a b c d')
  })

  it('returns empty string for empty input', () => {
    expect(extractPlainText('')).toBe('')
  })
})
```

- [ ] **Step 2: Run tests**

Run: `pnpm test:unit tests/search-index-text.test.ts`
Expected: All 11 cases PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/search-index-text.test.ts
git commit -m "$(cat <<'EOF'
test(search): add extractPlainText unit tests

11 cases covering frontmatter stripping, JSX/HTML tag removal,
code block removal, KaTeX stripping, link anchor extraction,
markdown marker removal, and whitespace normalization.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Build-time index generator + hooks + gitignore

**Files:**
- Create: `scripts/generate-search-index.ts`
- Modify: `package.json` (scripts)
- Modify: `.gitignore`

- [ ] **Step 1: Create the generator script**

```typescript
// scripts/generate-search-index.ts
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { Document } from 'flexsearch'
import {
  SEARCH_INDEX_CONFIG,
  extractPlainText,
  type SearchDoc,
  type SerializedIndex,
} from '../lib/search-index'

const POSTS_DIR = path.resolve(process.cwd(), 'content/posts')
const OUTPUT_PATH = path.resolve(process.cwd(), 'public/search-index.json')

interface Frontmatter {
  slug: string
  title: string
  summary: string
  tags: string[]
  keywords: string[]
  draft?: boolean
}

async function scanMdxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await scanMdxFiles(full)))
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(full)
    }
  }
  return files
}

async function toSearchDoc(filePath: string): Promise<SearchDoc | null> {
  const raw = await readFile(filePath, 'utf8')
  const parsed = matter(raw)
  const fm = parsed.data as Frontmatter
  if (fm.draft) return null
  return {
    slug: fm.slug,
    title: fm.title,
    summary: fm.summary,
    body: extractPlainText(parsed.content),
    tags: fm.tags.join(' '),
    keywords: fm.keywords.join(' '),
  }
}

async function main(): Promise<void> {
  const files = await scanMdxFiles(POSTS_DIR)
  const docs: SearchDoc[] = []
  for (const file of files) {
    const doc = await toSearchDoc(file)
    if (doc) docs.push(doc)
  }

  const index = new Document<SearchDoc>(SEARCH_INDEX_CONFIG)
  for (const doc of docs) index.add(doc)

  const exported: SerializedIndex = {}
  await new Promise<void>((resolve) => {
    let waiting = 1
    const done = (): void => {
      if (--waiting === 0) resolve()
    }
    index.export((key, data) => {
      waiting++
      exported[String(key)] = data as string
      queueMicrotask(done)
    })
    queueMicrotask(done)
  })

  const outDir = path.dirname(OUTPUT_PATH)
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(exported))

  console.log(
    `[search-index] indexed ${docs.length} posts → ${path.relative(process.cwd(), OUTPUT_PATH)}`,
  )
}

main().catch((err) => {
  console.error('[search-index] generation failed:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Add .gitignore entry**

Append to `.gitignore` after the existing build-output block:

```
# Phase 5 search index — generated by scripts/generate-search-index.ts
/public/search-index.json
```

- [ ] **Step 3: Wire prebuild / predev / pretest hooks**

In `package.json`, replace the three existing hook scripts so they also run the new generator after the keyword-map generator:

```json
"prebuild": "tsx scripts/generate-keyword-map.ts && tsx scripts/generate-search-index.ts",
"predev": "tsx scripts/generate-keyword-map.ts && tsx scripts/generate-search-index.ts",
"pretest": "tsx scripts/generate-keyword-map.ts && tsx scripts/generate-search-index.ts",
```

Also add a `generate-search-index` script for manual runs:

```json
"generate-search-index": "tsx scripts/generate-search-index.ts",
```

- [ ] **Step 4: Run manually to verify**

Run: `pnpm generate-search-index`
Expected: `[search-index] indexed 5 posts → public/search-index.json` (or whatever the current post count is). File exists at `public/search-index.json`.

- [ ] **Step 5: Verify full test suite still runs (pretest now includes both hooks)**

Run: `pnpm test`
Expected: All 114 tests green (103 existing + 11 from Task 3).

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-search-index.ts package.json .gitignore
git commit -m "$(cat <<'EOF'
feat(search): build-time index generator + prebuild hook

scripts/generate-search-index.ts reads raw MDX files via gray-matter,
runs extractPlainText over each body, and emits
public/search-index.json using FlexSearch's Document.export. Wired
into prebuild/predev/pretest after the existing keyword-map script.
public/search-index.json is now gitignored.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Client-side index loader + round-trip tests

**Files:**
- Modify: `lib/search-index.ts` (append `loadAndBuildIndex` function)
- Create: `tests/search-index-roundtrip.test.ts`

The client loader is factored to take `fetch` and a storage interface as parameters so it can be tested without a real network or real `sessionStorage`.

- [ ] **Step 1: Append the loader to `lib/search-index.ts`**

Add at the bottom of the existing `lib/search-index.ts` file:

```typescript
import { Document } from 'flexsearch'

const STORAGE_KEY = 'backend-notes:search-index:v1'

/**
 * Minimal Storage interface — enough to test with an in-memory object.
 * sessionStorage satisfies this in the browser.
 */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * Load the serialized FlexSearch index (from storage cache or fetch),
 * rebuild a Document instance, and return it. Keeps the dependency on
 * the global `fetch` and `sessionStorage` injectable so the function is
 * unit-testable.
 *
 * - First call fetches `/search-index.json`, caches the JSON blob in
 *   storage, and rebuilds the FlexSearch Document.
 * - Subsequent calls in the same session skip the fetch.
 *
 * Throws if fetch fails and no cache is available; callers should
 * catch and fall back to the substring search in lib/filters.ts.
 */
export async function loadAndBuildIndex(
  options: {
    fetchFn?: typeof fetch
    storage?: StorageLike
    url?: string
  } = {},
): Promise<Document<SearchDoc>> {
  const fetchFn = options.fetchFn ?? fetch
  const storage = options.storage ?? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
  const url = options.url ?? '/search-index.json'

  let serialized: SerializedIndex

  const cached = storage?.getItem(STORAGE_KEY)
  if (cached) {
    serialized = JSON.parse(cached) as SerializedIndex
  } else {
    const res = await fetchFn(url)
    if (!res.ok) {
      throw new Error(`search-index fetch failed: ${res.status}`)
    }
    serialized = (await res.json()) as SerializedIndex
    storage?.setItem(STORAGE_KEY, JSON.stringify(serialized))
  }

  const index = new Document<SearchDoc>(SEARCH_INDEX_CONFIG)
  for (const [key, data] of Object.entries(serialized)) {
    index.import(key, data)
  }
  return index
}
```

- [ ] **Step 2: Create the round-trip test file**

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Document } from 'flexsearch'
import {
  SEARCH_INDEX_CONFIG,
  loadAndBuildIndex,
  type SearchDoc,
  type SerializedIndex,
  type StorageLike,
} from '@/lib/search-index'

function makeInMemoryStorage(): StorageLike {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

async function exportIndex(docs: SearchDoc[]): Promise<SerializedIndex> {
  const index = new Document<SearchDoc>(SEARCH_INDEX_CONFIG)
  for (const doc of docs) index.add(doc)
  const exported: SerializedIndex = {}
  await new Promise<void>((resolve) => {
    let waiting = 1
    const done = (): void => {
      if (--waiting === 0) resolve()
    }
    index.export((key, data) => {
      waiting++
      exported[String(key)] = data as string
      queueMicrotask(done)
    })
    queueMicrotask(done)
  })
  return exported
}

const SAMPLE_DOCS: SearchDoc[] = [
  {
    slug: 'quick-sort',
    title: 'Quick Sort 완전 정복',
    summary: '분할 정복 기반 정렬 알고리즘',
    body: '피벗을 기준으로 배열을 분할하는 알고리즘입니다',
    tags: 'Algorithm Sorting',
    keywords: 'QuickSort Pivot Partition',
  },
  {
    slug: 'b-tree-structure',
    title: 'B-Tree 구조와 동작',
    summary: 'B-Tree의 노드 분할과 병합 원리',
    body: '데이터베이스 인덱스에 널리 쓰이는 자료구조',
    tags: 'Database Index',
    keywords: 'B-Tree Node Split',
  },
]

describe('loadAndBuildIndex — roundtrip', () => {
  it('fetches and builds index on first call', async () => {
    const exported = await exportIndex(SAMPLE_DOCS)
    const fetchFn = async (_url: string | URL | Request): Promise<Response> =>
      new Response(JSON.stringify(exported), { status: 200 })
    const storage = makeInMemoryStorage()

    const index = await loadAndBuildIndex({ fetchFn, storage })

    const results = index.search('Quick Sort', { limit: 5 })
    expect(results.length).toBeGreaterThan(0)
  })

  it('caches serialized data in storage on first call', async () => {
    const exported = await exportIndex(SAMPLE_DOCS)
    const fetchFn = async (): Promise<Response> =>
      new Response(JSON.stringify(exported), { status: 200 })
    const storage = makeInMemoryStorage()

    await loadAndBuildIndex({ fetchFn, storage })

    const cached = storage.getItem('backend-notes:search-index:v1')
    expect(cached).not.toBeNull()
    const parsed = JSON.parse(cached!)
    expect(Object.keys(parsed).length).toBeGreaterThan(0)
  })

  it('reuses cached data on second call without re-fetching', async () => {
    const exported = await exportIndex(SAMPLE_DOCS)
    let fetchCount = 0
    const fetchFn = async (): Promise<Response> => {
      fetchCount++
      return new Response(JSON.stringify(exported), { status: 200 })
    }
    const storage = makeInMemoryStorage()

    await loadAndBuildIndex({ fetchFn, storage })
    await loadAndBuildIndex({ fetchFn, storage })

    expect(fetchCount).toBe(1)
  })

  it('throws when fetch fails and no cache exists', async () => {
    const fetchFn = async (): Promise<Response> =>
      new Response('not found', { status: 404 })
    const storage = makeInMemoryStorage()

    await expect(loadAndBuildIndex({ fetchFn, storage })).rejects.toThrow(
      /search-index fetch failed: 404/,
    )
  })

  it('index can search body text across documents', async () => {
    const exported = await exportIndex(SAMPLE_DOCS)
    const fetchFn = async (): Promise<Response> =>
      new Response(JSON.stringify(exported), { status: 200 })
    const storage = makeInMemoryStorage()

    const index = await loadAndBuildIndex({ fetchFn, storage })
    const results = index.search('분할')

    const allSlugs = new Set<string>()
    for (const fieldResult of results) {
      for (const slug of fieldResult.result) allSlugs.add(String(slug))
    }
    expect(allSlugs.has('quick-sort')).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests**

Run: `pnpm test:unit tests/search-index-roundtrip.test.ts`
Expected: All 5 cases PASS.

- [ ] **Step 4: Full test suite**

Run: `pnpm test`
Expected: All tests green (103 + 11 + 5 = 119).

- [ ] **Step 5: Commit**

```bash
git add lib/search-index.ts tests/search-index-roundtrip.test.ts
git commit -m "$(cat <<'EOF'
feat(search): add loadAndBuildIndex client helper + tests

loadAndBuildIndex takes injectable fetchFn and storage so it can be
tested without a real network or sessionStorage. Caches the
serialized FlexSearch data under backend-notes:search-index:v1 so
only the first interaction pays the fetch cost per session.

5 roundtrip tests cover fetch-and-build, storage caching, cache
reuse, fetch-error handling, and cross-document body search.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Extend `applyFilters` with `matched` intersect

**Files:**
- Modify: `lib/filters.ts`
- Create: `tests/filters-matched.test.ts`

The existing `applyFilters(posts, { tag, query, sort })` pipeline adds a new optional `matched?: readonly string[]`. When present, the post list is intersected with that slug set BEFORE the tag/query/sort pipeline runs. This lets the client FlexSearch hand the server a precomputed slug set while preserving the existing tag/sort UX.

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect } from 'vitest'
import { applyFilters } from '@/lib/filters'

type TestPost = {
  slug: string
  title: string
  summary: string
  tags: string[]
  keywords: string[]
  date: string
}

const POSTS: TestPost[] = [
  { slug: 'a', title: 'Alpha', summary: 'first', tags: ['Backend'], keywords: ['k1'], date: '2026-04-10' },
  { slug: 'b', title: 'Beta', summary: 'second', tags: ['Backend'], keywords: ['k2'], date: '2026-04-11' },
  { slug: 'c', title: 'Gamma', summary: 'third', tags: ['Database'], keywords: ['k3'], date: '2026-04-12' },
  { slug: 'd', title: 'Delta', summary: 'fourth', tags: ['Database'], keywords: ['k4'], date: '2026-04-13' },
]

describe('applyFilters — matched intersect', () => {
  it('returns all posts when matched is undefined', () => {
    const out = applyFilters(POSTS, {})
    expect(out.map((p) => p.slug).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('returns only posts whose slug is in the matched list', () => {
    const out = applyFilters(POSTS, { matched: ['a', 'c'] })
    expect(out.map((p) => p.slug).sort()).toEqual(['a', 'c'])
  })

  it('returns empty when matched is an empty array', () => {
    const out = applyFilters(POSTS, { matched: [] })
    expect(out).toEqual([])
  })

  it('ignores matched entries that are not in the post set', () => {
    const out = applyFilters(POSTS, { matched: ['a', 'nonexistent'] })
    expect(out.map((p) => p.slug)).toEqual(['a'])
  })

  it('intersects matched with tag filter', () => {
    const out = applyFilters(POSTS, { matched: ['a', 'c'], tag: 'Backend' })
    expect(out.map((p) => p.slug)).toEqual(['a'])
  })

  it('sorts the matched-filtered set by the sort key', () => {
    const out = applyFilters(POSTS, { matched: ['a', 'd', 'c'], sort: 'latest' })
    expect(out.map((p) => p.slug)).toEqual(['d', 'c', 'a'])
  })
})
```

- [ ] **Step 2: Run tests — expect RED**

Run: `pnpm test:unit tests/filters-matched.test.ts`
Expected: FAIL. The `matched` field on `PostFilters` does not yet exist, so either a TypeScript error or all tests fail.

- [ ] **Step 3: Extend `PostFilters` and `applyFilters`**

Replace `lib/filters.ts` with:

```typescript
// lib/filters.ts
import type { Post } from './posts'

export type SortKey = 'latest' | 'oldest' | 'title'

export interface PostFilters {
  tag?: string
  query?: string
  sort?: SortKey
  matched?: readonly string[]
}

export function filterByTag<T extends Pick<Post, 'tags'>>(
  posts: readonly T[],
  tag?: string,
): T[] {
  if (!tag) return posts.slice()
  const needle = tag.toLowerCase()
  return posts.filter((p) => p.tags.some((t) => t.toLowerCase() === needle))
}

export function filterByMatched<T extends Pick<Post, 'slug'>>(
  posts: readonly T[],
  matched?: readonly string[],
): T[] {
  if (matched === undefined) return posts.slice()
  const allow = new Set(matched)
  return posts.filter((p) => allow.has(p.slug))
}

export function searchPosts<
  T extends Pick<Post, 'title' | 'summary' | 'tags' | 'keywords'>,
>(posts: readonly T[], query?: string): T[] {
  const q = query?.trim().toLowerCase()
  if (!q) return posts.slice()
  return posts.filter((p) => {
    if (p.title.toLowerCase().includes(q)) return true
    if (p.summary.toLowerCase().includes(q)) return true
    if (p.tags.some((t) => t.toLowerCase().includes(q))) return true
    if (p.keywords.some((k) => k.toLowerCase().includes(q))) return true
    return false
  })
}

const koCollator = new Intl.Collator('ko', { sensitivity: 'base' })

export function sortPosts<T extends Pick<Post, 'date' | 'title'>>(
  posts: readonly T[],
  sort?: SortKey,
): T[] {
  const out = posts.slice()
  const key = sort ?? 'latest'
  switch (key) {
    case 'latest':
      return out.sort((a, b) => b.date.localeCompare(a.date))
    case 'oldest':
      return out.sort((a, b) => a.date.localeCompare(b.date))
    case 'title':
      return out.sort((a, b) => koCollator.compare(a.title, b.title))
  }
}

export function applyFilters<
  T extends Pick<Post, 'slug' | 'tags' | 'title' | 'summary' | 'keywords' | 'date'>,
>(posts: readonly T[], filters: PostFilters): T[] {
  const afterMatched = filterByMatched(posts, filters.matched)
  const afterTag = filterByTag(afterMatched, filters.tag)
  const afterSearch = searchPosts(afterTag, filters.query)
  return sortPosts(afterSearch, filters.sort)
}

export function extractAllTags<T extends Pick<Post, 'tags'>>(
  posts: readonly T[],
): Array<{ tag: string; count: number }> {
  const map = new Map<string, number>()
  for (const p of posts) {
    for (const tag of p.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || koCollator.compare(a.tag, b.tag))
}
```

Note: `applyFilters`'s type constraint grew to include `slug`, and `filterByMatched` was added. The pipeline order is `matched → tag → query → sort`.

- [ ] **Step 4: Run tests — expect GREEN**

Run: `pnpm test:unit tests/filters-matched.test.ts`
Expected: All 6 cases PASS.

- [ ] **Step 5: Run existing filters tests**

Run: `pnpm test:unit tests/filters.test.ts`
Expected: All 16 existing cases still green (backward compatible).

- [ ] **Step 6: Commit**

```bash
git add lib/filters.ts tests/filters-matched.test.ts
git commit -m "$(cat <<'EOF'
feat(filters): add matched?: string[] to applyFilters

filterByMatched intersects the post set by slug before the
tag/query/sort pipeline runs. Used by Phase 5 FlexSearch integration
to hand a precomputed relevance-ranked slug set through the existing
server-side filter flow.

6 new tests; 16 existing filters tests unchanged.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Plumb `matched` through `buildPostsUrl` and `app/page.tsx`

**Files:**
- Modify: `lib/utils.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Extend `buildPostsUrl`**

Replace the existing function in `lib/utils.ts`:

```typescript
export function buildPostsUrl(params: {
  tag?: string
  query?: string
  sort?: SortKey
  matched?: readonly string[]
}): string {
  const sp = new URLSearchParams()
  if (params.tag) sp.set('tag', params.tag)
  if (params.query?.trim()) sp.set('q', params.query.trim())
  if (params.sort && params.sort !== 'latest') sp.set('sort', params.sort)
  if (params.matched && params.matched.length > 0) {
    sp.set('matched', params.matched.join(','))
  }
  const qs = sp.toString()
  return qs ? `/?${qs}` : '/'
}
```

- [ ] **Step 2: Update `app/page.tsx` to read the param**

Replace the props/logic at the top of the default export:

```tsx
export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; sort?: string; matched?: string }>
}) {
  const { tag, q, sort, matched } = await searchParams
  const allPosts = getAllPosts()
  const allTags = extractAllTags(allPosts)

  const validSort: SortKey =
    sort === 'oldest' || sort === 'title' ? sort : 'latest'

  const matchedList = matched
    ? matched.split(',').filter((s) => s.length > 0)
    : undefined

  const filtered = applyFilters(allPosts, {
    tag,
    query: q,
    sort: validSort,
    matched: matchedList,
  })

  return (
    // ... existing JSX unchanged ...
```

The rest of the page JSX stays exactly as it was.

- [ ] **Step 3: Type-check + build**

Run: `pnpm type-check && pnpm build`
Expected: No errors. Index page still renders (no functional change — `matched` is always undefined until SearchBar is updated in Task 8).

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: All tests green (119).

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts app/page.tsx
git commit -m "$(cat <<'EOF'
feat(search): plumb matched= URL param through index page

buildPostsUrl serializes a matched slug list into ?matched=a,b,c.
app/page.tsx parses it from searchParams and hands it to
applyFilters. SearchBar will start populating it in Task 8.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: SearchBar lazy-loads FlexSearch and writes `matched`

**Files:**
- Modify: `components/blog/SearchBar.tsx`

The upgraded SearchBar loads `lib/search-index.ts`'s `loadAndBuildIndex()` on first focus or first character typed. Until the index is ready, typing only updates the URL's `q` param (server-side substring fallback runs). Once ready, each query computes the matched slug list and pushes both `q` and `matched` to the URL. Fetch failure silently falls back to `q`-only.

- [ ] **Step 1: Replace `components/blog/SearchBar.tsx`**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Document } from 'flexsearch'
import { Input } from '@/components/ui/input'
import { buildPostsUrl } from '@/lib/utils'
import type { SortKey } from '@/lib/filters'
import { loadAndBuildIndex, type SearchDoc } from '@/lib/search-index'

interface SearchBarProps {
  defaultQuery?: string
  currentTag?: string
  currentSort: SortKey
}

export function SearchBar({ defaultQuery, currentTag, currentSort }: SearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(defaultQuery ?? '')
  const [indexState, setIndexState] = useState<'idle' | 'loading' | 'ready' | 'failed'>(
    'idle',
  )

  const currentTagRef = useRef(currentTag)
  const currentSortRef = useRef(currentSort)
  const defaultQueryRef = useRef(defaultQuery)
  const indexRef = useRef<Document<SearchDoc> | null>(null)

  useEffect(() => {
    currentTagRef.current = currentTag
  }, [currentTag])

  useEffect(() => {
    currentSortRef.current = currentSort
  }, [currentSort])

  useEffect(() => {
    defaultQueryRef.current = defaultQuery
  }, [defaultQuery])

  useEffect(() => {
    setValue(defaultQuery ?? '')
  }, [defaultQuery])

  const ensureIndex = useCallback(async () => {
    if (indexRef.current) return indexRef.current
    if (indexState === 'loading' || indexState === 'failed') return null
    setIndexState('loading')
    try {
      const idx = await loadAndBuildIndex()
      indexRef.current = idx
      setIndexState('ready')
      return idx
    } catch (err) {
      console.warn('[search] index load failed, falling back to substring:', err)
      setIndexState('failed')
      return null
    }
  }, [indexState])

  const computeMatched = useCallback(
    (query: string, idx: Document<SearchDoc>): string[] => {
      const trimmed = query.trim()
      if (!trimmed) return []
      const results = idx.search(trimmed, { limit: 50 })
      const slugs = new Set<string>()
      for (const fieldResult of results) {
        for (const id of fieldResult.result) slugs.add(String(id))
      }
      return Array.from(slugs)
    },
    [],
  )

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = value
      if ((next ?? '') === (defaultQueryRef.current ?? '')) return

      void (async () => {
        const idx = indexRef.current ?? (await ensureIndex())
        const trimmed = next.trim()
        let matched: readonly string[] | undefined
        if (idx && trimmed.length > 0) {
          matched = computeMatched(trimmed, idx)
        }

        router.push(
          buildPostsUrl({
            tag: currentTagRef.current,
            query: next,
            sort: currentSortRef.current,
            matched,
          }),
          { scroll: false },
        )
      })()
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const placeholder =
    indexState === 'loading' ? '검색 준비 중...' : '검색어를 입력하세요...'

  return (
    <div className="mt-8">
      <Input
        type="search"
        inputMode="search"
        placeholder={placeholder}
        value={value}
        onFocus={() => {
          void ensureIndex()
        }}
        onChange={(e) => {
          const ne = e.nativeEvent as InputEvent
          if (ne.isComposing) return
          setValue(e.target.value)
        }}
        onCompositionEnd={(e) => {
          setValue((e.target as HTMLInputElement).value)
        }}
        className="h-11"
        aria-label="글 검색"
      />
    </div>
  )
}
```

**Key behavior changes**:
- `onFocus` kicks off `ensureIndex()` — user sees the placeholder change to "검색 준비 중..." while the fetch runs.
- Each debounced URL push awaits `ensureIndex()` before computing `matched`; if the index isn't ready or failed, `matched` is undefined and the server-side substring fallback handles filtering.
- `indexRef` holds the live `Document` so the `indexState` React state doesn't need to carry it.
- `search({ limit: 50 })` — spec §4.5 cutoff is at the display layer; the internal limit is higher so we don't accidentally lose result diversity.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Run full test suite**

Run: `pnpm test`
Expected: All tests green (still 119; SearchBar is not unit-tested at the component level, only its dependencies).

- [ ] **Step 5: Commit**

```bash
git add components/blog/SearchBar.tsx
git commit -m "$(cat <<'EOF'
feat(search): SearchBar lazy-loads FlexSearch index

Loads /search-index.json on first focus or first character typed,
caches in sessionStorage via loadAndBuildIndex. Once ready, each
debounced query computes the matched slug list and pushes
q= + matched= to the URL. On fetch/parse failure, matched is
omitted and the server-side substring search in lib/filters.ts
continues to handle queries transparently.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `lib/related-posts.ts` with tests

**Files:**
- Create: `lib/related-posts.ts`
- Create: `tests/related-posts.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Velite content module like tests/posts.test.ts does.
vi.mock('#site/content', () => ({
  posts: [
    { slug: 'a', title: 'A', date: '2026-04-10', draft: false, tags: [], keywords: [], summary: '', body: '', toc: [], readingTime: 1, url: '/posts/a' },
    { slug: 'b', title: 'B', date: '2026-04-11', draft: false, tags: [], keywords: [], summary: '', body: '', toc: [], readingTime: 1, url: '/posts/b' },
    { slug: 'c', title: 'C', date: '2026-04-12', draft: false, tags: [], keywords: [], summary: '', body: '', toc: [], readingTime: 1, url: '/posts/c' },
    { slug: 'd', title: 'D', date: '2026-04-13', draft: false, tags: [], keywords: [], summary: '', body: '', toc: [], readingTime: 1, url: '/posts/d' },
    { slug: 'e', title: 'E', date: '2026-04-14', draft: false, tags: [], keywords: [], summary: '', body: '', toc: [], readingTime: 1, url: '/posts/e' },
  ],
}))

import { getRecentPosts } from '@/lib/related-posts'

describe('getRecentPosts', () => {
  beforeEach(() => {
    // noop — each test re-reads via getAllPosts which re-sorts
  })

  it('returns the 4 most recent posts excluding the current slug', () => {
    const result = getRecentPosts('c', 4)
    expect(result.map((p) => p.slug)).toEqual(['e', 'd', 'b', 'a'])
  })

  it('defaults to n=4 when not specified', () => {
    const result = getRecentPosts('a')
    expect(result).toHaveLength(4)
    expect(result.map((p) => p.slug)).toEqual(['e', 'd', 'c', 'b'])
  })

  it('returns fewer than N when the corpus is small', () => {
    const result = getRecentPosts('a', 10)
    expect(result).toHaveLength(4)
    expect(result.map((p) => p.slug)).toEqual(['e', 'd', 'c', 'b'])
  })

  it('preserves date-descending order', () => {
    const result = getRecentPosts('e', 4)
    const dates = result.map((p) => p.date)
    const sorted = [...dates].sort().reverse()
    expect(dates).toEqual(sorted)
  })

  it('returns an empty array when the exclude slug is the only post', () => {
    // Cannot easily re-mock inside a single test; covered by "fewer than N"
    // semantics. We assert that excludeSlug is always absent from result.
    const result = getRecentPosts('a', 4)
    expect(result.every((p) => p.slug !== 'a')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — expect RED**

Run: `pnpm test:unit tests/related-posts.test.ts`
Expected: FAIL — module `@/lib/related-posts` does not exist.

- [ ] **Step 3: Create `lib/related-posts.ts`**

```typescript
// lib/related-posts.ts
import { getAllPosts, type Post } from './posts'

/**
 * Returns the N most recently published posts, excluding the given slug.
 * Relies on getAllPosts() returning draft-free posts sorted latest-first.
 * If fewer than N posts remain after exclusion, returns all available.
 */
export function getRecentPosts(excludeSlug: string, n = 4): Post[] {
  return getAllPosts()
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, n)
}
```

- [ ] **Step 4: Run tests — expect GREEN**

Run: `pnpm test:unit tests/related-posts.test.ts`
Expected: All 5 cases PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/related-posts.ts tests/related-posts.test.ts
git commit -m "$(cat <<'EOF'
feat(blog): add getRecentPosts helper for post footer section

Simple date-descending slice of getAllPosts minus the current slug.
Phase 5 spec §2.3 — no algorithmic scoring, just recency. Consumed
by the upcoming <RecentPostsSection> component.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: `<RecentPostsSection>` component

**Files:**
- Create: `components/blog/RecentPostsSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/blog/RecentPostsSection.tsx
import type { Post } from '@/lib/posts'
import { PostCard } from './PostCard'

interface RecentPostsSectionProps {
  posts: Post[]
}

export function RecentPostsSection({ posts }: RecentPostsSectionProps) {
  if (posts.length === 0) return null
  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="text-[20px] font-semibold text-foreground md:text-[22px]">
        최근 글
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
```

Server component (no `'use client'`); `PostCard` is already a server component that renders a `Link`, so the whole tree is static HTML.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/blog/RecentPostsSection.tsx
git commit -m "$(cat <<'EOF'
feat(blog): add RecentPostsSection component

Server component rendering a 2-column grid of PostCards below the
post article. Returns null when the list is empty so single-post
sites degrade gracefully.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Render `<RecentPostsSection>` on post detail page

**Files:**
- Modify: `app/posts/[slug]/page.tsx`

- [ ] **Step 1: Wire it in**

At the top of `app/posts/[slug]/page.tsx`, add two imports:

```tsx
import { RecentPostsSection } from '@/components/blog/RecentPostsSection'
import { getRecentPosts } from '@/lib/related-posts'
```

Inside the `PostPage` function, right after the `post` null check, add:

```tsx
const recentPosts = getRecentPosts(slug, 4)
```

In the JSX, immediately after the closing `</article>` tag, add:

```tsx
<RecentPostsSection posts={recentPosts} />
```

The section must be INSIDE the `<div className="mx-auto max-w-[1080px] ...">` container (alongside `<article>`) but OUTSIDE `<article>` itself — the TOC's IntersectionObserver is scoped to article headings and should not pick up "최근 글" as a section.

The final JSX structure around the article should look like:

```tsx
<article className="min-w-0">
  <PostMeta tags={post.tags} date={post.date} readingTime={post.readingTime} />
  <h1 className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.015em] md:text-[32px]">
    {post.title}
  </h1>
  <hr className="my-8 border-border" />
  <div className="prose-kr min-w-0">
    <MDXContent code={post.body} />
  </div>
</article>

<RecentPostsSection posts={recentPosts} />
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: Build succeeds, 9 static pages generated.

- [ ] **Step 4: Commit**

```bash
git add app/posts/[slug]/page.tsx
git commit -m "$(cat <<'EOF'
feat(blog): render recent-posts section on post detail pages

getRecentPosts(slug, 4) runs server-side; <RecentPostsSection> is
placed after </article> inside the content column so the TOC's
IntersectionObserver keeps scoping to article h2s only.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Enforce tag-forbidden-char rule in Velite schema

**Files:**
- Modify: `velite.config.ts`
- Modify: `tests/velite-schema.test.ts`

Before we start creating `/tags/[tag]` routes, block tags containing URL-unsafe characters (`/`, `?`, `#`) at the frontmatter schema level so build fails with a clear message rather than generating broken routes.

- [ ] **Step 1: Extend the schema in `velite.config.ts`**

Find the `postFrontmatterShape` declaration. Replace the `tags` field:

```typescript
  tags: s
    .array(
      s
        .string()
        .min(1)
        .regex(/^[^/?#]+$/, 'tag must not contain / ? # (URL-unsafe for /tags/[tag] route)'),
    )
    .min(1)
    .max(5),
```

Everything else in the shape stays identical.

- [ ] **Step 2: Add a schema test**

In `tests/velite-schema.test.ts`, append inside the existing `describe` block (after the last `it(...)` before the closing `})`):

```typescript
  it('rejects tags containing /', () => {
    const result = postFrontmatterSchema.safeParse({
      title: 'Test',
      slug: 'test-post',
      date: '2026-04-15',
      tags: ['Bad/Tag'],
      keywords: ['k1'],
      summary: 'A test post summary here.',
    })
    expect(result.success).toBe(false)
  })

  it('rejects tags containing ?', () => {
    const result = postFrontmatterSchema.safeParse({
      title: 'Test',
      slug: 'test-post',
      date: '2026-04-15',
      tags: ['What?'],
      keywords: ['k1'],
      summary: 'A test post summary here.',
    })
    expect(result.success).toBe(false)
  })

  it('rejects tags containing #', () => {
    const result = postFrontmatterSchema.safeParse({
      title: 'Test',
      slug: 'test-post',
      date: '2026-04-15',
      tags: ['C#'],
      keywords: ['k1'],
      summary: 'A test post summary here.',
    })
    expect(result.success).toBe(false)
  })

  it('accepts tags with dash, space, and Korean characters', () => {
    const result = postFrontmatterSchema.safeParse({
      title: 'Test',
      slug: 'test-post',
      date: '2026-04-15',
      tags: ['B-Tree', 'Spring Boot', '백엔드'],
      keywords: ['k1'],
      summary: 'A test post summary here.',
    })
    expect(result.success).toBe(true)
  })
```

- [ ] **Step 3: Run tests**

Run: `pnpm test:unit tests/velite-schema.test.ts`
Expected: All 10 cases (6 existing + 4 new) PASS.

- [ ] **Step 4: Full Velite build**

Run: `pnpm velite`
Expected: Velite build succeeds (no existing post has forbidden-char tags).

- [ ] **Step 5: Commit**

```bash
git add velite.config.ts tests/velite-schema.test.ts
git commit -m "$(cat <<'EOF'
feat(velite): block URL-unsafe characters in tags

Tags containing /, ?, or # would break /tags/[tag] routing.
Refining the frontmatter schema with a regex surfaces the error
at build time with a clear message. C# is explicitly called out
in the error so authors know why it failed.

4 new schema tests — /, ?, # rejection and Korean/dash/space
acceptance.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: `<TagPageHeader>` + `app/tags/[tag]/page.tsx`

**Files:**
- Create: `components/blog/TagPageHeader.tsx`
- Create: `app/tags/[tag]/page.tsx`

- [ ] **Step 1: Create `TagPageHeader`**

```tsx
// components/blog/TagPageHeader.tsx
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface TagPageHeaderProps {
  tag: string
  count: number
}

export function TagPageHeader({ tag, count }: TagPageHeaderProps) {
  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        전체 글 목록
      </Link>
      <h1 className="mt-6 text-[32px] font-bold tracking-[-0.02em] md:text-[40px]">
        #{tag}
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">{count}개 글</p>
    </div>
  )
}
```

- [ ] **Step 2: Create the tag page route**

```tsx
// app/tags/[tag]/page.tsx
import { notFound } from 'next/navigation'
import { getAllPosts } from '@/lib/posts'
import { extractAllTags, filterByTag, sortPosts } from '@/lib/filters'
import { PostList } from '@/components/blog/PostList'
import { TagPageHeader } from '@/components/blog/TagPageHeader'

export function generateStaticParams(): Array<{ tag: string }> {
  const allTags = extractAllTags(getAllPosts())
  return allTags.map(({ tag }) => ({ tag: encodeURIComponent(tag) }))
}

export const dynamicParams = false

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag: rawTag } = await params
  const tag = decodeURIComponent(rawTag)
  const posts = sortPosts(filterByTag(getAllPosts(), tag), 'latest')
  if (posts.length === 0) notFound()

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-20 md:px-12">
      <TagPageHeader tag={tag} count={posts.length} />
      <div className="mt-8">
        <PostList posts={posts} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 4: Build (generates static tag pages)**

Run: `pnpm build`
Expected: Build succeeds. Output shows additional static pages under `/tags/*`. For the current 5-post corpus, expect 5–10 tag pages depending on unique tag count.

- [ ] **Step 5: Dev-server smoke check**

Run: `pnpm dev` (background) and visit e.g. `http://localhost:3000/tags/Database`
Expected: Header reads `#Database` and `N개 글`, followed by the `PostList`. Clicking a card navigates to the post.

Stop the dev server after verifying.

- [ ] **Step 6: Commit**

```bash
git add components/blog/TagPageHeader.tsx app/tags/[tag]/page.tsx
git commit -m "$(cat <<'EOF'
feat(tags): add /tags/[tag] SSG pages

generateStaticParams emits one entry per unique tag (URL-encoded).
dynamicParams=false so unknown tags 404 at runtime. The page reuses
PostList and adds a lightweight TagPageHeader with a back-link.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Update `<PostMeta>` tag chips to link to `/tags/[tag]`

**Files:**
- Modify: `components/blog/PostMeta.tsx`

- [ ] **Step 1: Change the link target**

Replace the `<Link>` inside the `tags.map` of `components/blog/PostMeta.tsx`:

```tsx
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            #{tag}
          </Link>
        ))}
```

Everything else in the file stays identical.

- [ ] **Step 2: Type-check + build**

Run: `pnpm type-check && pnpm build`
Expected: No errors. 9+ static pages still generated.

- [ ] **Step 3: Commit**

```bash
git add components/blog/PostMeta.tsx
git commit -m "$(cat <<'EOF'
feat(blog): link post detail tag chips to /tags/[tag]

Semantic, bookmarkable tag archive pages. Index page TagFilterBar
chips still use ?tag= for the multi-filter/search/sort UX on the
landing page — the two routes intentionally serve different
intents.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Update CLAUDE.md and blog-writer skill

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update §6.2 related-posts rule**

Find the line `- 관련 글: 동일 태그를 가진 글 중 최대 4개, 태그 겹침 수 기준 정렬` (or similar — the rule was rephrased in Phase 4 polish to mention manual `<RelatedPost>`). Replace with:

```markdown
- 최근 글 섹션: 글 하단에 현재 글을 제외한 최신 4개를 자동 렌더 (알고리즘 기반 추천 없음). 주제 기반 교차 링크는 MDX 본문 내 수동 `<RelatedPost />`로 명시 배치.
```

- [ ] **Step 2: Mark Phase 5 complete in §12**

Find the line starting with `5. **Phase 5 — 탐색 기능**`. Replace with:

```markdown
5. **Phase 5 — 탐색 기능** ✅ **완료** (`phase-5-complete` 태그): FlexSearch 전문 검색(fetch-on-demand), 최근 글 섹션, `/tags/[tag]` 전용 페이지. 세부 내역은 §18 참고.
```

- [ ] **Step 3: Append §18 to CLAUDE.md**

At the very end of CLAUDE.md (after §17), append:

```markdown

---

## 18. Phase 5 구현 현황

> Phase 5 완료 시점(2026-04-15)의 구현 상태. §13–16과 동일 포맷 (frozen phase record).

### 18.1 존재하는 파일 (Phase 5에서 추가·변경)

\`\`\`
scripts/
└── generate-search-index.ts        [신규] pre-build hook으로 실행

lib/
├── filters.ts                      [수정] matched?: string[] 파이프라인 추가
├── utils.ts                        [수정] buildPostsUrl이 matched 직렬화
├── search-index.ts                 [신규] 타입 + 설정 + loadAndBuildIndex + extractPlainText
└── related-posts.ts                [신규] getRecentPosts(excludeSlug, n)

app/
├── page.tsx                        [수정] matched 쿼리 파라미터 파싱
├── posts/[slug]/page.tsx           [수정] <RecentPostsSection> 렌더
└── tags/
    └── [tag]/
        └── page.tsx                [신규] 태그별 SSG 페이지

components/blog/
├── SearchBar.tsx                   [수정] FlexSearch lazy-load + matched URL push
├── PostMeta.tsx                    [수정] 태그 칩 → /tags/[tag] 링크
├── RecentPostsSection.tsx          [신규]
└── TagPageHeader.tsx               [신규]

public/
└── search-index.json               [생성물, gitignored] 빌드 타임 FlexSearch 인덱스

velite.config.ts                    [수정] 태그 금지 문자 regex refine
package.json                        [수정] flexsearch dependency + @types/flexsearch devDep + 훅 스크립트 업데이트
.gitignore                          [수정] /public/search-index.json

tests/
├── search-index-text.test.ts       [신규] extractPlainText 11 케이스
├── search-index-roundtrip.test.ts  [신규] jsdom + mock fetch 5 케이스
├── filters-matched.test.ts         [신규] matched 6 케이스
├── related-posts.test.ts           [신규] getRecentPosts 5 케이스
└── velite-schema.test.ts           [수정] 태그 금지 문자 4 케이스 추가
\`\`\`

### 18.2 핵심 의사결정 (변경 금지)

| 결정 | 이유 | 영향 |
|---|---|---|
| 본문 포함 전문 검색 | 작성자의 지식 베이스 활용이 검색 가치의 핵심 | 인덱스 크기 증가는 fetch-on-demand로 상쇄 |
| FlexSearch fetch-on-demand | 검색 안 하는 대부분 방문자가 비용 지불하지 않음 | 첫 검색 ~100ms 지연(localhost 체감 X), 세션 내 캐시 |
| 관련 글은 최신순 (알고리즘 없음) | 사용자 명시 결정, YAGNI | 주제 기반 교차는 수동 `<RelatedPost />` 유지 |
| `matched=` URL 파라미터로 FlexSearch 결과 전달 | 기존 서버 필터링 플로우 + 공유 가능한 URL 동시 만족 | 클라이언트 인덱스 실패 시 substring fallback 투명 |
| 태그 금지 문자 스키마 레벨 차단 | URL 깨진 라우트 생성 방지 | `/ ? #` 포함 태그는 빌드 타임 실패 |
| `/tags/[tag]`와 `/?tag=...` 공존 | 두 경로는 다른 사용자 의도(아카이브 vs 임시 필터) | URL 구조 2벌 유지 |
| `flexsearch ^0.7` 메이저 고정 | 0.8+ 호환성 미검증 | 업그레이드는 별도 결정 |
| 관련 글이 `<article>` 외부 | TOC IntersectionObserver 오염 방지 | "최근 글"이 TOC에 안 잡힘 |
| 코드/수식은 검색 본문에서 제외 | syntax identifier 노이즈 방지 | `keywords` 필드가 개념 매핑 커버 |

### 18.3 명령어 치트시트

\`\`\`bash
pnpm dev                    # 개발 서버 (prebuild로 자동 인덱스 생성)
pnpm build                  # 프로덕션 빌드 (prebuild 포함)
pnpm test                   # velite + vitest (약 130 테스트)
pnpm test:unit              # vitest만
pnpm generate-search-index  # 수동 인덱스 재생성 (새 글 추가 후)
pnpm type-check             # tsc --noEmit
\`\`\`

### 18.4 알려진 미결 사항 (Phase 6 이후)

- 한국어 tokenizer 최적화 (현재 forward prefix 매칭만 동작)
- 검색 결과 highlight 및 context snippet
- 코드/수식 별도 검색 인덱스
- 시리즈 내비게이션 UI (시리즈 글 등장 시)
- 태그 메타데이터 (설명문, 아이콘)
- HMR 시 새 태그 자동 등록 (현재는 `pnpm dev` 재시작 필요)

### 18.5 리포지토리

- **Phase 5 태그**: `phase-5-complete`
- **브랜치 전략**: 이전 Phase와 동일 (`main` 직접 또는 squash merge)
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: No CLAUDE.md-related errors (doc-only change).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: update CLAUDE.md for Phase 5 completion

- §6.2: 관련 글 rule replaced with recent-4-posts + manual
  <RelatedPost> split (matches final Phase 5 decision)
- §12: Phase 5 marked complete, cross-reference to §18
- §18: new frozen phase record covering files, decisions, command
  cheatsheet, known deferrals, repo info

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Final verification + phase tag

**Files:** none modified

- [ ] **Step 1: Type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: No errors.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: Build succeeds. Output should show additional static pages under `/tags/*` for each unique tag in the corpus.

- [ ] **Step 4: Full test suite**

Run: `pnpm test`
Expected: ~130 tests green (103 pre-existing + 11 extractPlainText + 5 roundtrip + 6 filters-matched + 5 related-posts + 4 schema = ~134).

- [ ] **Step 5: Manual dev server check**

Run: `pnpm dev` (background)

Checklist (visit in browser):
- [ ] `/` — search bar renders, typing an English word (e.g. "pivot") filters the list; index loads on first focus (placeholder briefly reads "검색 준비 중...")
- [ ] `/?q=인덱스` — shared URL renders filtered set on initial paint (substring fallback), then client FlexSearch refines
- [ ] `/posts/quick-sort` — "최근 글" section appears below the article, showing 4 other posts (or fewer if corpus < 5)
- [ ] `/posts/quick-sort` — tag chips at the top link to `/tags/Algorithm`, etc.
- [ ] `/tags/Database` — renders `#Database`, post count, and filtered PostList
- [ ] `/tags/NonExistent` — 404
- [ ] DevTools Network tab: `/search-index.json` only fetched once per session

Stop the dev server after verifying.

- [ ] **Step 6: Tag the phase**

```bash
git tag phase-5-complete
git tag --list 'phase-*'
```
Expected output:
```
phase-1-complete
phase-2-complete
phase-3-complete
phase-4-1-complete
phase-5-complete
```

---

## Definition of Done

- [ ] `flexsearch` runtime dependency installed
- [ ] `scripts/generate-search-index.ts` exists and is wired into `prebuild`/`predev`/`pretest`
- [ ] `public/search-index.json` generated at build time, gitignored
- [ ] `lib/search-index.ts` exports `SearchDoc`, `SEARCH_INDEX_CONFIG`, `extractPlainText`, `loadAndBuildIndex`
- [ ] `lib/filters.ts` `applyFilters` accepts `matched?: readonly string[]`
- [ ] `lib/utils.ts` `buildPostsUrl` serializes `matched`
- [ ] `app/page.tsx` parses `matched` from search params
- [ ] `SearchBar` lazy-loads index on first focus/input, pushes `q=` + `matched=` URL state, falls back on error
- [ ] `lib/related-posts.ts` exports `getRecentPosts(excludeSlug, n = 4)`
- [ ] `components/blog/RecentPostsSection.tsx` exists and renders on `/posts/[slug]`
- [ ] `app/tags/[tag]/page.tsx` exists, uses `generateStaticParams` + `dynamicParams=false`
- [ ] `components/blog/TagPageHeader.tsx` exists
- [ ] `PostMeta` tag chips link to `/tags/[tag]` (index `TagFilterBar` still uses `?tag=`)
- [ ] `velite.config.ts` rejects tags containing `/ ? #`
- [ ] Test count ≈ 134 (103 existing + 31 new), all green
- [ ] `pnpm type-check` / `pnpm lint` / `pnpm build` / `pnpm test` all green
- [ ] Manual dev-server smoke check passes (search, recent posts, tag pages)
- [ ] CLAUDE.md §6.2 updated, §12 Phase 5 complete, §18 added
- [ ] `phase-5-complete` git tag created
