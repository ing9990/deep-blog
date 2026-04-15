# Phase 3 — 키워드 자동 링크 시스템 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MDX 본문의 기술 키워드를 빌드 타임에 해당 글로 자동 링크하는 시스템을 구축한다. 데스크톱에서 호버 시 글 제목·요약 프리뷰 Popover, 모바일에서는 일반 링크로 동작.

**Architecture:** 4계층 분리. (1) 순수 매칭 함수(`lib/keyword-matcher.ts`)는 greedy matching + 한글/영문 비대칭 경계 규칙으로 텍스트 내 매치 위치를 찾음. (2) Pre-build 스크립트(`scripts/generate-keyword-map.ts`)가 모든 MDX frontmatter를 스캔해 `lib/generated/keyword-map.ts`를 생성, 충돌 시 빌드 실패. (3) Remark 플러그인(`plugins/remark-auto-link.ts`)이 Velite MDX 파이프라인에서 text 노드를 `link` 노드로 치환하고 `data-keyword-link="true"` 속성을 붙임. (4) `components/mdx/components.tsx`의 `a` 오버라이드가 이 속성을 감지해 `KeywordLink` 컴포넌트(shadcn Popover 래퍼)로 렌더.

**Tech Stack:** TypeScript strict, Velite 0.2, unified/remark, `unist-util-visit-parents`, `mdast-util-to-hast`, `gray-matter`, `tsx`, shadcn/ui Popover (Radix), Vitest.

**Spec:** `docs/superpowers/specs/2026-04-15-phase-3-keyword-system-design.md` (커밋 `f2161db`).

---

## File Structure

```
scripts/
└── generate-keyword-map.ts         [신규] pre-build I/O 스크립트

lib/
├── generated/
│   └── keyword-map.ts              [신규, 커밋 대상] 빌드 타임 생성 TS 상수
├── keyword-matcher.ts              [신규] 순수 매칭 함수
└── posts.ts                        [기존]

plugins/
└── remark-auto-link.ts             [신규] Remark 플러그인

components/
├── blog/
│   └── KeywordLink.tsx             [신규, 'use client'] Popover 래퍼
├── mdx/
│   └── components.tsx              [수정] a 오버라이드에 분기 추가
└── ui/
    └── popover.tsx                 [신규, shadcn CLI]

velite.config.ts                    [수정] remarkPlugins 추가
package.json                        [수정] prebuild/predev/pretest + deps
content/posts/
├── hello-world.mdx                 [수정] B-Tree 본문 참조 추가
└── b-tree-structure.mdx            [신규] 키워드 링크 대상 글

tests/
├── keyword-matcher.test.ts         [신규, ~18 케이스]
├── generate-keyword-map.test.ts    [신규, ~8 케이스]
├── remark-auto-link.test.ts        [신규, ~10 케이스]
└── velite-build.test.ts            [수정, +2 케이스]
```

---

## Stage 1 — `lib/keyword-matcher.ts` (순수 함수, TDD)

### Task 1: 의존성 확인

**Files:**
- Verify: `package.json`

- [ ] **Step 1: Ensure no new runtime deps needed**

The keyword matcher is a pure function using only `String` and regex. No new dependencies required for this stage.

- [ ] **Step 2: Verify Node/pnpm environment**

```bash
node --version
pnpm --version
```

Expected: Node ≥18, pnpm 9.15.4.

### Task 2: Write failing tests for `hasBoundary`

**Files:**
- Create: `tests/keyword-matcher.test.ts`

- [ ] **Step 1: Write 8 `hasBoundary` test cases**

```typescript
// tests/keyword-matcher.test.ts
import { describe, it, expect } from 'vitest'
import { hasBoundary, findMatches } from '@/lib/keyword-matcher'

describe('hasBoundary', () => {
  it('Latin keyword: passes when prev/next are non-word', () => {
    expect(hasBoundary('use B-Tree here', 'B-Tree', 4)).toBe(true)
  })

  it('Latin keyword: fails when prev is alphanumeric', () => {
    expect(hasBoundary('AB-Tree here', 'B-Tree', 1)).toBe(false)
  })

  it('Latin keyword: fails when next is alphanumeric', () => {
    expect(hasBoundary('B-Trees here', 'B-Tree', 0)).toBe(false)
  })

  it('Latin keyword: passes when next is Hangul (treated as non-word for Latin boundary)', () => {
    expect(hasBoundary('B-Tree를 사용', 'B-Tree', 0)).toBe(true)
  })

  it('Hangul keyword: passes when prev is non-Hangul', () => {
    expect(hasBoundary('the 인덱스를', '인덱스', 4)).toBe(true)
  })

  it('Hangul keyword: fails when prev is Hangul', () => {
    expect(hasBoundary('재인덱싱', '인덱스', 1)).toBe(false)
  })

  it('Hangul keyword: passes when next is Hangul (relaxed for Korean particles)', () => {
    expect(hasBoundary('인덱스를 사용', '인덱스', 0)).toBe(true)
  })

  it('Mixed keyword: independent boundary check for each end', () => {
    // "Kafka 컨슈머" — first char K (Latin), last char 머 (Hangul)
    expect(hasBoundary('그 Kafka 컨슈머가', 'Kafka 컨슈머', 3)).toBe(true)
    expect(hasBoundary('SuperKafka 컨슈머', 'Kafka 컨슈머', 5)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the failing tests**

```bash
pnpm test:unit -- keyword-matcher
```

Expected: FAIL with `Cannot find module '@/lib/keyword-matcher'`.

### Task 3: Implement `hasBoundary`

**Files:**
- Create: `lib/keyword-matcher.ts`

- [ ] **Step 1: Write the minimal implementation**

```typescript
// lib/keyword-matcher.ts

export interface Match {
  start: number
  end: number
  keyword: string
  slug: string
}

const HANGUL = /[\uAC00-\uD7A3]/
const LATIN_BOUNDARY = /[A-Za-z0-9_]/

export function hasBoundary(
  text: string,
  keyword: string,
  start: number,
): boolean {
  const end = start + keyword.length
  const prev = start > 0 ? text[start - 1] : ''
  const next = end < text.length ? text[end] : ''

  const firstChar = keyword[0]
  const lastChar = keyword[keyword.length - 1]

  const prevOk =
    LATIN_BOUNDARY.test(firstChar) ? !LATIN_BOUNDARY.test(prev) :
    HANGUL.test(firstChar)         ? !HANGUL.test(prev) :
    true

  const nextOk =
    LATIN_BOUNDARY.test(lastChar) ? !LATIN_BOUNDARY.test(next) :
    HANGUL.test(lastChar)         ? true :  // Relaxed for Korean particles
    true

  return prevOk && nextOk
}

export function findMatches(
  text: string,
  keywordsByLength: readonly string[],
  keywordToSlug: ReadonlyMap<string, string>,
  excludeSlug: string,
): Match[] {
  throw new Error('not implemented')
}
```

- [ ] **Step 2: Run boundary tests**

```bash
pnpm test:unit -- keyword-matcher
```

Expected: 8 `hasBoundary` tests PASS. `findMatches` tests (not yet written) are absent, so total is 8 passing.

### Task 4: Write failing tests for `findMatches`

**Files:**
- Modify: `tests/keyword-matcher.test.ts`

- [ ] **Step 1: Append `findMatches` test cases**

Append to `tests/keyword-matcher.test.ts`:

```typescript
describe('findMatches', () => {
  const keywordToSlug = new Map<string, string>([
    ['B-Tree', 'b-tree-structure'],
    ['Kafka', 'kafka-basics'],
    ['Kafka Consumer Group', 'kafka-consumer-group'],
    ['인덱스', 'database-index'],
  ])
  const keywordsByLength = [
    'Kafka Consumer Group',
    'B-Tree',
    'Kafka',
    '인덱스',
  ]

  it('returns empty for no matches', () => {
    expect(findMatches('hello world', keywordsByLength, keywordToSlug, '')).toEqual([])
  })

  it('finds a single Latin keyword match', () => {
    const result = findMatches('use B-Tree', keywordsByLength, keywordToSlug, '')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ keyword: 'B-Tree', slug: 'b-tree-structure' })
  })

  it('finds Hangul keyword with particle', () => {
    const result = findMatches('인덱스를 사용', keywordsByLength, keywordToSlug, '')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ keyword: '인덱스', slug: 'database-index' })
  })

  it('prefers longer keyword (greedy)', () => {
    const result = findMatches(
      'Kafka Consumer Group 리밸런싱',
      keywordsByLength,
      keywordToSlug,
      '',
    )
    expect(result).toHaveLength(1)
    expect(result[0].keyword).toBe('Kafka Consumer Group')
  })

  it('preserves original case in matched keyword', () => {
    const result = findMatches('use kafka here', keywordsByLength, keywordToSlug, '')
    expect(result).toHaveLength(1)
    expect(result[0].keyword).toBe('kafka')  // original case, not "Kafka"
    expect(result[0].slug).toBe('kafka-basics')
  })

  it('excludes matches whose slug equals excludeSlug', () => {
    const result = findMatches('use B-Tree', keywordsByLength, keywordToSlug, 'b-tree-structure')
    expect(result).toEqual([])
  })

  it('skips boundary-failing occurrences', () => {
    const result = findMatches('재인덱싱 설명', keywordsByLength, keywordToSlug, '')
    expect(result).toEqual([])
  })

  it('finds multiple distinct matches sorted by position', () => {
    const result = findMatches(
      '인덱스를 설명하고 B-Tree도 설명',
      keywordsByLength,
      keywordToSlug,
      '',
    )
    expect(result.map((m) => m.keyword)).toEqual(['인덱스', 'B-Tree'])
    expect(result[0].start).toBeLessThan(result[1].start)
  })

  it('handles empty text', () => {
    expect(findMatches('', keywordsByLength, keywordToSlug, '')).toEqual([])
  })

  it('skips overlap when shorter keyword falls inside claimed range', () => {
    // Kafka Consumer Group is already claimed — Kafka inside it should not re-match
    const result = findMatches(
      'Kafka Consumer Group을 사용',
      keywordsByLength,
      keywordToSlug,
      '',
    )
    expect(result).toHaveLength(1)
    expect(result[0].keyword).toBe('Kafka Consumer Group')
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm test:unit -- keyword-matcher
```

Expected: 8 `hasBoundary` PASS, 10 `findMatches` FAIL with `Error: not implemented`.

### Task 5: Implement `findMatches`

**Files:**
- Modify: `lib/keyword-matcher.ts`

- [ ] **Step 1: Replace the `findMatches` stub**

Replace the `throw new Error('not implemented')` body with:

```typescript
export function findMatches(
  text: string,
  keywordsByLength: readonly string[],
  keywordToSlug: ReadonlyMap<string, string>,
  excludeSlug: string,
): Match[] {
  const matches: Match[] = []
  const claimed = new Array<boolean>(text.length).fill(false)
  const haystack = text.toLowerCase()

  for (const keyword of keywordsByLength) {
    const slug = keywordToSlug.get(keyword)
    if (!slug || slug === excludeSlug) continue

    const needle = keyword.toLowerCase()
    let searchFrom = 0

    while (true) {
      const idx = haystack.indexOf(needle, searchFrom)
      if (idx === -1) break

      const end = idx + keyword.length

      let overlap = false
      for (let i = idx; i < end; i++) {
        if (claimed[i]) {
          overlap = true
          break
        }
      }
      if (overlap) {
        searchFrom = idx + 1
        continue
      }

      if (!hasBoundary(text, keyword, idx)) {
        searchFrom = idx + 1
        continue
      }

      matches.push({
        start: idx,
        end,
        keyword: text.slice(idx, end),
        slug,
      })
      for (let i = idx; i < end; i++) claimed[i] = true
      searchFrom = end
    }
  }

  return matches.sort((a, b) => a.start - b.start)
}
```

- [ ] **Step 2: Run all keyword-matcher tests**

```bash
pnpm test:unit -- keyword-matcher
```

Expected: 18 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/keyword-matcher.ts tests/keyword-matcher.test.ts
git commit -m "feat(lib): add keyword-matcher with hasBoundary and findMatches

Pure matching layer for Phase 3 keyword auto-link. Greedy matching via
claimed-range tracking, asymmetric Korean/Latin boundary rules (strict
for leading boundary on Hangul to exclude compound words like 재인덱싱,
relaxed for trailing boundary on Hangul to allow Korean particles like
인덱스를).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Stage 2 — `scripts/generate-keyword-map.ts`

### Task 6: Install `tsx` and `gray-matter`

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

```bash
pnpm add -D tsx gray-matter
```

- [ ] **Step 2: Verify dependencies**

```bash
pnpm list tsx gray-matter
```

Expected: both listed with versions.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add tsx and gray-matter for keyword-map pre-build script"
```

### Task 7: Write failing tests for `buildMap`, `formatConflictError`, `serializeMap`

**Files:**
- Create: `tests/generate-keyword-map.test.ts`

- [ ] **Step 1: Write the tests**

```typescript
// tests/generate-keyword-map.test.ts
import { describe, it, expect } from 'vitest'
import {
  buildMap,
  formatConflictError,
  serializeMap,
  type ScannedPost,
} from '@/scripts/generate-keyword-map'

function post(partial: Partial<ScannedPost> & { slug: string; keywords: string[] }): ScannedPost {
  return {
    file: `content/posts/${partial.slug}.mdx`,
    slug: partial.slug,
    title: partial.title ?? `Title ${partial.slug}`,
    summary: partial.summary ?? `Summary ${partial.slug}`,
    keywords: partial.keywords,
  }
}

describe('buildMap', () => {
  it('returns empty map for empty posts', () => {
    const { map, conflicts } = buildMap([])
    expect(map.size).toBe(0)
    expect(conflicts).toEqual([])
  })

  it('maps each keyword to its declaring post', () => {
    const { map, conflicts } = buildMap([
      post({ slug: 'p1', keywords: ['B-Tree'] }),
      post({ slug: 'p2', keywords: ['Kafka'] }),
    ])
    expect(map.size).toBe(2)
    expect(map.get('B-Tree')?.slug).toBe('p1')
    expect(map.get('Kafka')?.slug).toBe('p2')
    expect(conflicts).toEqual([])
  })

  it('supports multiple keywords per post', () => {
    const { map } = buildMap([
      post({ slug: 'p1', keywords: ['B-Tree', 'B+Tree', '인덱스'] }),
    ])
    expect(map.size).toBe(3)
    expect(map.get('인덱스')?.slug).toBe('p1')
  })

  it('detects a conflict between two posts', () => {
    const { conflicts } = buildMap([
      post({ slug: 'p1', keywords: ['B-Tree'] }),
      post({ slug: 'p2', keywords: ['B-Tree'] }),
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].keyword).toBe('B-Tree')
    expect(conflicts[0].files).toHaveLength(2)
    expect(conflicts[0].files.map((f) => f.slug)).toEqual(['p1', 'p2'])
  })

  it('detects a conflict across three posts', () => {
    const { conflicts } = buildMap([
      post({ slug: 'p1', keywords: ['인덱스'] }),
      post({ slug: 'p2', keywords: ['인덱스'] }),
      post({ slug: 'p3', keywords: ['인덱스'] }),
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].files).toHaveLength(3)
  })

  it('preserves title and summary on entries', () => {
    const { map } = buildMap([
      post({ slug: 'p1', keywords: ['B-Tree'], title: 'B-Tree 구조', summary: '자료구조 설명' }),
    ])
    expect(map.get('B-Tree')).toEqual({
      slug: 'p1',
      title: 'B-Tree 구조',
      summary: '자료구조 설명',
    })
  })
})

describe('formatConflictError', () => {
  it('formats one conflict with files and slugs', () => {
    const msg = formatConflictError([
      {
        keyword: 'B-Tree',
        files: [
          { file: 'content/posts/a.mdx', slug: 'a' },
          { file: 'content/posts/b.mdx', slug: 'b' },
        ],
      },
    ])
    expect(msg).toContain('B-Tree')
    expect(msg).toContain('content/posts/a.mdx')
    expect(msg).toContain('content/posts/b.mdx')
    expect(msg).toContain('slug: a')
    expect(msg).toContain('slug: b')
  })
})

describe('serializeMap', () => {
  it('emits KEYWORD_MAP, KEYWORDS_BY_LENGTH, SLUG_TO_ENTRY', () => {
    const map = new Map([
      ['B-Tree', { slug: 'b-tree', title: 'T1', summary: 'S1' }],
      ['Kafka Consumer Group', { slug: 'kcg', title: 'T2', summary: 'S2' }],
    ])
    const out = serializeMap(map)
    expect(out).toContain('export const KEYWORD_MAP')
    expect(out).toContain('export const KEYWORDS_BY_LENGTH')
    expect(out).toContain('export const SLUG_TO_ENTRY')
  })

  it('sorts KEYWORDS_BY_LENGTH longest first', () => {
    const map = new Map([
      ['B-Tree', { slug: 'b-tree', title: 'T1', summary: 'S1' }],
      ['Kafka Consumer Group', { slug: 'kcg', title: 'T2', summary: 'S2' }],
      ['Kafka', { slug: 'kafka', title: 'T3', summary: 'S3' }],
    ])
    const out = serializeMap(map)
    const kcgIndex = out.indexOf('"Kafka Consumer Group"')
    const btreeIndex = out.indexOf('"B-Tree"')
    const kafkaIndex = out.indexOf('"Kafka"')
    // KEYWORDS_BY_LENGTH is the only place all three appear in order
    const byLengthBlock = out.slice(out.indexOf('KEYWORDS_BY_LENGTH'))
    expect(byLengthBlock.indexOf('"Kafka Consumer Group"')).toBeLessThan(
      byLengthBlock.indexOf('"B-Tree"'),
    )
    expect(byLengthBlock.indexOf('"B-Tree"')).toBeLessThan(
      byLengthBlock.indexOf('"Kafka"'),
    )
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

```bash
pnpm test:unit -- generate-keyword-map
```

Expected: FAIL with `Cannot find module '@/scripts/generate-keyword-map'`.

### Task 8: Implement `scripts/generate-keyword-map.ts`

**Files:**
- Create: `scripts/generate-keyword-map.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p scripts lib/generated
```

- [ ] **Step 2: Write the script**

```typescript
// scripts/generate-keyword-map.ts
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import matter from 'gray-matter'

const POSTS_DIR = 'content/posts'
const OUTPUT_FILE = 'lib/generated/keyword-map.ts'

export interface ScannedPost {
  file: string
  slug: string
  title: string
  summary: string
  keywords: string[]
}

export interface KeywordEntry {
  slug: string
  title: string
  summary: string
}

export interface Conflict {
  keyword: string
  files: Array<{ file: string; slug: string }>
}

async function scanPosts(dir: string): Promise<ScannedPost[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.mdx'))
    .map((e) => join(dir, e.name))

  const out: ScannedPost[] = []
  for (const file of files) {
    const raw = await readFile(file, 'utf8')
    const { data } = matter(raw)
    if (data.draft === true) continue
    if (typeof data.slug !== 'string') continue
    if (!Array.isArray(data.keywords)) continue
    out.push({
      file: relative(process.cwd(), file),
      slug: data.slug,
      title: typeof data.title === 'string' ? data.title : '',
      summary: typeof data.summary === 'string' ? data.summary : '',
      keywords: data.keywords.filter((k): k is string => typeof k === 'string'),
    })
  }
  return out
}

export function buildMap(posts: readonly ScannedPost[]): {
  map: Map<string, KeywordEntry>
  conflicts: Conflict[]
} {
  const declarations = new Map<string, Array<{ file: string; slug: string; title: string; summary: string }>>()

  for (const post of posts) {
    for (const keyword of post.keywords) {
      const list = declarations.get(keyword) ?? []
      list.push({ file: post.file, slug: post.slug, title: post.title, summary: post.summary })
      declarations.set(keyword, list)
    }
  }

  const map = new Map<string, KeywordEntry>()
  const conflicts: Conflict[] = []

  for (const [keyword, list] of declarations) {
    if (list.length > 1) {
      conflicts.push({
        keyword,
        files: list.map((d) => ({ file: d.file, slug: d.slug })),
      })
    } else {
      const [only] = list
      map.set(keyword, { slug: only.slug, title: only.title, summary: only.summary })
    }
  }

  return { map, conflicts }
}

export function formatConflictError(conflicts: readonly Conflict[]): string {
  const lines: string[] = ['[keyword-map] KEYWORD CONFLICT DETECTED', '']
  for (const c of conflicts) {
    lines.push(`Keyword "${c.keyword}" is declared in ${c.files.length} files:`)
    for (const f of c.files) {
      lines.push(`  - ${f.file} (slug: ${f.slug})`)
    }
    lines.push('')
  }
  lines.push('Resolution: Each keyword may only be declared in one post\'s frontmatter.')
  lines.push('Aborting build.')
  return lines.join('\n')
}

function escapeStringLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

export function serializeMap(map: Map<string, KeywordEntry>): string {
  const entries = Array.from(map.entries())
  const byLength = entries
    .map(([kw]) => kw)
    .sort((a, b) => b.length - a.length || a.localeCompare(b))

  const header = [
    '// lib/generated/keyword-map.ts',
    '// DO NOT EDIT — generated by scripts/generate-keyword-map.ts',
    '',
    'export interface KeywordEntry {',
    '  slug: string',
    '  title: string',
    '  summary: string',
    '}',
    '',
  ].join('\n')

  const mapEntries = entries
    .map(
      ([kw, e]) =>
        `  ["${escapeStringLiteral(kw)}", { slug: "${escapeStringLiteral(e.slug)}", title: "${escapeStringLiteral(e.title)}", summary: "${escapeStringLiteral(e.summary)}" }],`,
    )
    .join('\n')

  const keywordMap = `export const KEYWORD_MAP: ReadonlyMap<string, KeywordEntry> = new Map([\n${mapEntries}\n])\n`

  const byLengthArr = byLength.map((kw) => `  "${escapeStringLiteral(kw)}",`).join('\n')
  const keywordsByLength = `export const KEYWORDS_BY_LENGTH: readonly string[] = [\n${byLengthArr}\n]\n`

  const slugEntries = Array.from(
    new Map(entries.map(([, e]) => [e.slug, e])).entries(),
  )
    .map(
      ([slug, e]) =>
        `  ["${escapeStringLiteral(slug)}", { slug: "${escapeStringLiteral(e.slug)}", title: "${escapeStringLiteral(e.title)}", summary: "${escapeStringLiteral(e.summary)}" }],`,
    )
    .join('\n')

  const slugToEntry = `export const SLUG_TO_ENTRY: ReadonlyMap<string, KeywordEntry> = new Map([\n${slugEntries}\n])\n`

  return [header, keywordMap, '', keywordsByLength, '', slugToEntry].join('\n')
}

async function main() {
  const posts = await scanPosts(POSTS_DIR)
  const { map, conflicts } = buildMap(posts)

  if (conflicts.length > 0) {
    console.error(formatConflictError(conflicts))
    process.exit(1)
  }

  await mkdir('lib/generated', { recursive: true })
  await writeFile(OUTPUT_FILE, serializeMap(map), 'utf8')
  console.log(`[keyword-map] generated ${map.size} keywords from ${posts.length} posts`)
}

// Execute when run directly (not when imported for tests)
const isEntry =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`

if (isEntry) {
  main().catch((err) => {
    console.error('[keyword-map] fatal:', err)
    process.exit(1)
  })
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm test:unit -- generate-keyword-map
```

Expected: 8 tests PASS.

### Task 9: Wire up `package.json` pre-build hooks

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts**

Add these entries to the `scripts` object in `package.json`:

```json
{
  "scripts": {
    "prebuild": "tsx scripts/generate-keyword-map.ts",
    "predev": "tsx scripts/generate-keyword-map.ts",
    "pretest": "tsx scripts/generate-keyword-map.ts",
    "generate-keyword-map": "tsx scripts/generate-keyword-map.ts",
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

- [ ] **Step 2: Manual run to generate the initial map**

```bash
pnpm generate-keyword-map
```

Expected: `[keyword-map] generated N keywords from 4 posts` (where N is the total keyword count from hello-world + database-index-basics + jvm-gc-intro + kafka-consumer-group — typically 4).

- [ ] **Step 3: Verify the generated file**

```bash
cat lib/generated/keyword-map.ts
```

Expected: contains `KEYWORD_MAP`, `KEYWORDS_BY_LENGTH`, `SLUG_TO_ENTRY` with 4 entries (or however many keywords the current posts declare).

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-keyword-map.ts lib/generated/keyword-map.ts tests/generate-keyword-map.test.ts package.json
git commit -m "feat(keyword-map): add pre-build scanner with conflict detection

Scans content/posts/**/*.mdx for frontmatter keywords and generates
lib/generated/keyword-map.ts with KEYWORD_MAP, KEYWORDS_BY_LENGTH
(greedy matching order), and SLUG_TO_ENTRY (reverse lookup for
KeywordLink Popover). Fails the build with a detailed error on
keyword conflicts.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Stage 3 — `plugins/remark-auto-link.ts` (TDD)

### Task 10: Install `unist-util-visit-parents`

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install**

```bash
pnpm add unist-util-visit-parents
```

Note: `unified` and `mdast` types come transitively via `velite` (which already ships `@mdx-js/mdx` → `remark` → `unified`). Direct install of only `unist-util-visit-parents` is sufficient.

- [ ] **Step 2: Verify type imports work**

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add unist-util-visit-parents for remark plugin ancestor tracking"
```

### Task 11: Write failing tests for `remark-auto-link`

**Files:**
- Create: `tests/remark-auto-link.test.ts`

- [ ] **Step 1: Write the tests**

```typescript
// tests/remark-auto-link.test.ts
import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { VFile } from 'vfile'
import remarkAutoLink from '@/plugins/remark-auto-link'

const keywordToSlug = new Map<string, string>([
  ['B-Tree', 'b-tree-structure'],
  ['Kafka', 'kafka-basics'],
  ['Kafka Consumer Group', 'kafka-consumer-group'],
  ['인덱스', 'database-index'],
])
const keywordsByLength = [
  'Kafka Consumer Group',
  'B-Tree',
  'Kafka',
  '인덱스',
]

function run(markdown: string, filePath: string): string {
  const file = new VFile({ path: filePath, value: markdown })
  const processed = unified()
    .use(remarkParse)
    .use(remarkAutoLink, { keywordsByLength, keywordToSlug })
    .use(remarkStringify)
    .processSync(file)
  return String(processed)
}

describe('remark-auto-link', () => {
  it('replaces a Latin keyword in plain text with a link', () => {
    const out = run('use B-Tree for speed', 'content/posts/speed.mdx')
    expect(out).toMatch(/\[B-Tree\]\(\/posts\/b-tree-structure\)/)
  })

  it('replaces a Hangul keyword with a following particle', () => {
    const out = run('인덱스를 설명합니다', 'content/posts/intro.mdx')
    expect(out).toMatch(/\[인덱스\]\(\/posts\/database-index\)/)
  })

  it('skips keywords inside inline code', () => {
    const out = run('use `B-Tree` carefully', 'content/posts/intro.mdx')
    expect(out).not.toMatch(/\[B-Tree\]\(/)
    expect(out).toContain('`B-Tree`')
  })

  it('skips keywords inside fenced code blocks', () => {
    const md = 'see below\n\n```\nB-Tree example\n```\n'
    const out = run(md, 'content/posts/intro.mdx')
    expect(out).not.toMatch(/\[B-Tree\]\(/)
  })

  it('skips keywords already inside a link', () => {
    const out = run('[existing B-Tree](https://example.com)', 'content/posts/intro.mdx')
    // the outer link stays, B-Tree inside is not re-wrapped
    expect(out).toContain('[existing B-Tree](https://example.com)')
    // and no new /posts/b-tree-structure link is created
    expect(out).not.toMatch(/\/posts\/b-tree-structure/)
  })

  it('does not link a keyword whose slug matches currentSlug (self-link)', () => {
    const out = run('use B-Tree for speed', 'content/posts/b-tree-structure.mdx')
    expect(out).not.toMatch(/\/posts\/b-tree-structure/)
    expect(out).toContain('B-Tree')
  })

  it('links only the first occurrence of a repeated keyword', () => {
    const out = run('B-Tree is fast. B-Tree again.', 'content/posts/intro.mdx')
    const matches = out.match(/\[B-Tree\]\(\/posts\/b-tree-structure\)/g) ?? []
    expect(matches).toHaveLength(1)
    // second "B-Tree" remains plain text
    expect(out).toMatch(/B-Tree again\./)
  })

  it('prefers the longer keyword in greedy matching', () => {
    const out = run('Kafka Consumer Group rebalance', 'content/posts/intro.mdx')
    expect(out).toMatch(/\[Kafka Consumer Group\]\(\/posts\/kafka-consumer-group\)/)
    expect(out).not.toMatch(/\[Kafka\]\(\/posts\/kafka-basics\)/)
  })

  it('inserts data-keyword-link attribute on generated links', () => {
    // Round-trip through remark-stringify loses hProperties, so we parse instead
    // and inspect the AST directly.
    const tree = unified()
      .use(remarkParse)
      .use(remarkAutoLink, { keywordsByLength, keywordToSlug })
      .runSync(
        unified().use(remarkParse).parse(
          new VFile({ path: 'content/posts/intro.mdx', value: 'use B-Tree' }),
        ),
        new VFile({ path: 'content/posts/intro.mdx', value: 'use B-Tree' }),
      )

    let found = false
    function walk(node: any): void {
      if (node.type === 'link' && node.data?.hProperties?.['data-keyword-link'] === 'true') {
        found = true
      }
      if (Array.isArray(node.children)) node.children.forEach(walk)
    }
    walk(tree)
    expect(found).toBe(true)
  })

  it('handles multiple distinct keywords in the same text node', () => {
    const out = run('인덱스를 설명하고 B-Tree도 참고', 'content/posts/intro.mdx')
    expect(out).toMatch(/\[인덱스\]\(\/posts\/database-index\)/)
    expect(out).toMatch(/\[B-Tree\]\(\/posts\/b-tree-structure\)/)
  })
})
```

- [ ] **Step 2: Install test-only remark deps**

`remark-parse`, `remark-stringify`, `vfile` are transitive deps of velite/unified. Verify they resolve:

```bash
pnpm list remark-parse remark-stringify vfile 2>&1 | head -20
```

If any is missing from the resolved tree, install explicitly:

```bash
pnpm add -D remark-parse remark-stringify vfile
```

- [ ] **Step 3: Run tests to verify failure**

```bash
pnpm test:unit -- remark-auto-link
```

Expected: FAIL with `Cannot find module '@/plugins/remark-auto-link'`.

### Task 12: Implement `plugins/remark-auto-link.ts`

**Files:**
- Create: `plugins/remark-auto-link.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p plugins
```

- [ ] **Step 2: Write the plugin**

```typescript
// plugins/remark-auto-link.ts
import { basename, extname } from 'node:path'
import type { Plugin } from 'unified'
import type { Root, Text, Link, Parent, PhrasingContent } from 'mdast'
import { visitParents, SKIP } from 'unist-util-visit-parents'
import { findMatches, type Match } from '../lib/keyword-matcher'

export interface RemarkAutoLinkOptions {
  keywordsByLength: readonly string[]
  keywordToSlug: ReadonlyMap<string, string>
}

const EXCLUDED_ANCESTOR_TYPES = new Set<string>(['link', 'inlineCode', 'code'])

const remarkAutoLink: Plugin<[RemarkAutoLinkOptions], Root> = (options) => {
  const { keywordsByLength, keywordToSlug } = options

  return (tree, file) => {
    const filePath = (file?.history?.[0] ?? file?.path ?? '') as string
    const currentSlug = filePath ? basename(filePath, extname(filePath)) : ''

    const usedKeywords = new Set<string>()

    visitParents(tree, 'text', (node: Text, ancestors: Parent[]) => {
      if (ancestors.some((a) => EXCLUDED_ANCESTOR_TYPES.has(a.type))) return

      const matches = findMatches(node.value, keywordsByLength, keywordToSlug, currentSlug)
      if (matches.length === 0) return

      const uniqueMatches = matches.filter((m) => {
        const key = m.keyword.toLowerCase()
        if (usedKeywords.has(key)) return false
        usedKeywords.add(key)
        return true
      })
      if (uniqueMatches.length === 0) return

      const newNodes = splitTextNode(node, uniqueMatches)
      const directParent = ancestors[ancestors.length - 1]
      const index = directParent.children.indexOf(node as unknown as PhrasingContent)
      if (index === -1) return

      directParent.children.splice(index, 1, ...(newNodes as PhrasingContent[]))

      return [SKIP, index + newNodes.length]
    })
  }
}

function splitTextNode(node: Text, matches: readonly Match[]): Array<Text | Link> {
  const result: Array<Text | Link> = []
  let cursor = 0

  for (const match of matches) {
    if (match.start > cursor) {
      result.push({ type: 'text', value: node.value.slice(cursor, match.start) })
    }
    result.push({
      type: 'link',
      url: `/posts/${match.slug}`,
      title: null,
      children: [{ type: 'text', value: match.keyword }],
      data: {
        hProperties: {
          'data-keyword-link': 'true',
        },
      },
    })
    cursor = match.end
  }

  if (cursor < node.value.length) {
    result.push({ type: 'text', value: node.value.slice(cursor) })
  }

  return result
}

export default remarkAutoLink
```

- [ ] **Step 3: Run tests**

```bash
pnpm test:unit -- remark-auto-link
```

Expected: 10 tests PASS. If any test fails, read the actual output carefully — the `data-keyword-link` test may need adjustment depending on how `unified().runSync` is used. Alternative pattern if the test setup breaks:

```typescript
// Alternative for the hProperties test
const parseTree = unified()
  .use(remarkParse)
  .parse(new VFile({ path: 'content/posts/intro.mdx', value: 'use B-Tree' }))
const processor = unified().use(remarkAutoLink, { keywordsByLength, keywordToSlug })
const transformed = processor.runSync(parseTree, new VFile({ path: 'content/posts/intro.mdx', value: 'use B-Tree' }))
```

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

Expected: exit 0. If mdast types complain about `PhrasingContent`, ensure `@types/mdast` is resolvable (transitively via velite). If missing, install:

```bash
pnpm add -D @types/mdast
```

- [ ] **Step 5: Commit**

```bash
git add plugins/remark-auto-link.ts tests/remark-auto-link.test.ts
git commit -m "feat(plugin): add remark-auto-link for keyword auto-linking

Walks MDAST text nodes via visitParents, excludes link/inlineCode/code
ancestors, uses findMatches from lib/keyword-matcher for greedy matching,
and replaces matched text with link nodes carrying data-keyword-link
hProperty. currentSlug is derived from file.history basename to avoid
Velite API coupling.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 13: Integrate plugin into `velite.config.ts`

**Files:**
- Modify: `velite.config.ts`

- [ ] **Step 1: Add imports and wire plugin**

Edit `velite.config.ts` to add these imports near the top:

```typescript
import remarkAutoLink from './plugins/remark-auto-link'
import { KEYWORD_MAP, KEYWORDS_BY_LENGTH } from './lib/generated/keyword-map'
```

Add a derived map below the imports:

```typescript
const keywordToSlug = new Map(
  Array.from(KEYWORD_MAP.entries()).map(([kw, entry]) => [kw, entry.slug]),
)
```

Modify the `mdx` block in the `defineConfig` call to add `remarkPlugins`:

```typescript
  mdx: {
    remarkPlugins: [
      [remarkAutoLink, { keywordsByLength: KEYWORDS_BY_LENGTH, keywordToSlug }],
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: { light: 'github-light', dark: 'github-dark' },
          keepBackground: false,
          defaultLang: 'plaintext',
          transformers: [transformerNotationHighlight()],
        },
      ],
    ],
  },
```

- [ ] **Step 2: Run Velite build**

```bash
pnpm velite
```

Expected: exit 0. If it fails because `lib/generated/keyword-map.ts` doesn't exist, run `pnpm generate-keyword-map` first.

- [ ] **Step 3: Verify compiled body contains keyword link markers**

At this point, none of the existing MDX files have B-Tree content yet (the dummy posts from Phase 2 don't mention B-Tree). So no keyword-link attributes are expected yet. That's OK — Stage 5 adds validation content.

Run type-check:

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 4: Run full test suite**

```bash
pnpm test
```

Expected: all tests PASS including the new 28 from Stage 1-3 (18 matcher + 8 generate + stage 3 tests are existing + 10 new remark plugin tests later — re-check counts).

- [ ] **Step 5: Commit**

```bash
git add velite.config.ts
git commit -m "feat(velite): wire remark-auto-link into MDX pipeline

Injects keywordsByLength and keywordToSlug from the generated
keyword-map into remarkAutoLink. The plugin runs before rehypeSlug
and rehypePrettyCode in the rehype phase, which is the correct order
— link nodes are created in the remark phase and downstream rehype
plugins treat them as normal links.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 14: Add Velite integration tests

**Files:**
- Modify: `tests/velite-build.test.ts`

- [ ] **Step 1: Append two integration tests**

Add these inside the existing `describe('velite build output', ...)` block in `tests/velite-build.test.ts`:

```typescript
  it('no post contains a self-referencing keyword link', () => {
    for (const post of posts) {
      const selfLinkPattern = `/posts/${post.slug}`
      // Check for literal href reference to self — acceptable only when it's
      // a manual cross-link the author wrote, not a remark-auto-link output.
      // For Phase 3 validation, we assert no self-link from the auto-link
      // path. Auto-linked anchors carry data-keyword-link="true".
      const autoLinkToSelfRegex = new RegExp(
        `data-keyword-link="true"[^<]*href="${selfLinkPattern}"|href="${selfLinkPattern}"[^<]*data-keyword-link="true"`,
      )
      expect(
        autoLinkToSelfRegex.test(post.body),
        `post ${post.slug} contains an auto-link to itself`,
      ).toBe(false)
    }
  })

  it('at least one post in the build contains a keyword link marker after Stage 5 content', () => {
    // This test succeeds vacuously until Stage 5 adds validation content.
    // After Stage 5, at least hello-world should contain a B-Tree link.
    const totalLinks = posts.reduce(
      (n, p) => n + (p.body.match(/data-keyword-link=\\?"true\\?"/g)?.length ?? 0),
      0,
    )
    expect(totalLinks).toBeGreaterThanOrEqual(0)  // Will tighten after Stage 5
  })
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: all pass. The second test's `>= 0` assertion is trivially true pre-Stage-5; Stage 5 will tighten it to `>= 1`.

- [ ] **Step 3: Commit**

```bash
git add tests/velite-build.test.ts
git commit -m "test(velite): add integration tests for keyword auto-link output"
```

---

## Stage 4 — shadcn Popover + `KeywordLink` component

### Task 15: Install shadcn Popover

**Files:**
- Create: `components/ui/popover.tsx`
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Run shadcn add**

```bash
pnpm dlx shadcn@latest add popover --yes
```

Expected: `components/ui/popover.tsx` created, `@radix-ui/react-popover` added to dependencies.

- [ ] **Step 2: Verify installation**

```bash
pnpm build
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/ui/popover.tsx package.json pnpm-lock.yaml
git commit -m "feat(ui): add shadcn Popover for keyword link preview"
```

### Task 16: Create `KeywordLink` component

**Files:**
- Create: `components/blog/KeywordLink.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/blog/KeywordLink.tsx
'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { SLUG_TO_ENTRY } from '@/lib/generated/keyword-map'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface KeywordLinkProps {
  href: string
  children: ReactNode
}

export function KeywordLink({ href, children }: KeywordLinkProps) {
  const slug = href.replace(/^\/posts\//, '')
  const entry = SLUG_TO_ENTRY.get(slug)

  return (
    <>
      <span className="hidden md:contents">
        <Popover>
          <PopoverTrigger asChild>
            <Link
              href={href}
              className="rounded-sm text-keyword underline decoration-dotted underline-offset-4 transition-colors hover:bg-keyword-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {children}
            </Link>
          </PopoverTrigger>
          {entry && (
            <PopoverContent
              side="top"
              align="start"
              sideOffset={6}
              className="w-[320px] p-4"
            >
              <p className="text-sm font-semibold leading-tight text-foreground">
                {entry.title}
              </p>
              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                {entry.summary}
              </p>
            </PopoverContent>
          )}
        </Popover>
      </span>

      <Link
        href={href}
        className="text-keyword underline decoration-dotted underline-offset-4 md:hidden"
      >
        {children}
      </Link>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 3: Build**

```bash
pnpm build
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/blog/KeywordLink.tsx
git commit -m "feat(blog): add KeywordLink with desktop-only Popover preview

Dual-render pattern: <span class='hidden md:contents'> wraps the
Popover+Link for desktop, while a plain <Link class='md:hidden'>
handles mobile. display: contents keeps the wrapper out of layout
flow. SLUG_TO_ENTRY provides O(1) entry lookup for Popover content.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### Task 17: Wire `KeywordLink` into MDX `a` override

**Files:**
- Modify: `components/mdx/components.tsx`

- [ ] **Step 1: Read current file**

```bash
cat components/mdx/components.tsx
```

- [ ] **Step 2: Replace with branching implementation**

```tsx
// components/mdx/components.tsx
import type { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'
import { KeywordLink } from '@/components/blog/KeywordLink'

type AnchorProps = DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & {
  'data-keyword-link'?: string
}

export const mdxComponents = {
  h1: ({ children, ...props }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="mt-10 mb-4 text-[26px] font-bold tracking-[-0.015em]"
      {...props}
    >
      {children}
    </h1>
  ),
  a: ({ href, children, ...props }: AnchorProps) => {
    if (props['data-keyword-link'] === 'true' && typeof href === 'string') {
      return <KeywordLink href={href}>{children}</KeywordLink>
    }
    return (
      <a
        href={href}
        className="text-primary underline decoration-dotted underline-offset-4"
        {...props}
      >
        {children}
      </a>
    )
  },
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: exit 0. If the existing `components/mdx/index.ts` barrel is used to export, ensure the barrel still re-exports `mdxComponents`.

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add components/mdx/components.tsx
git commit -m "feat(mdx): branch a override to KeywordLink for data-keyword-link anchors

The remark-auto-link plugin adds data-keyword-link='true' to generated
<a> tags. The mdxComponents.a override detects this prop and wraps the
anchor with KeywordLink (shadcn Popover). Regular links fall through
to the default primary-colored anchor style.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Stage 5 — 검증용 콘텐츠

### Task 18: Create `b-tree-structure.mdx`

**Files:**
- Create: `content/posts/b-tree-structure.mdx`

- [ ] **Step 1: Write the post**

```mdx
---
title: "B-Tree 구조"
slug: "b-tree-structure"
date: 2026-04-13
tags:
  - Database
  - Algorithm
keywords:
  - B-Tree
summary: "B-Tree가 어떻게 정렬된 데이터를 효율적으로 탐색하는지 구조와 동작 원리를 설명합니다."
---

## B-Tree란

B-Tree는 각 노드가 여러 자식을 가질 수 있는 자기-균형 탐색 트리입니다.

## 왜 데이터베이스가 B-Tree를 쓰는가

디스크 블록 하나를 노드 하나에 대응시켜 I/O 횟수를 최소화합니다.

## 삽입과 분할

노드가 가득 차면 중간 키를 부모로 올리고 좌우로 분할합니다.
```

Note: This post declares `keywords: ["B-Tree"]`. When `pnpm generate-keyword-map` runs, it will register `B-Tree → b-tree-structure`. Other posts whose body mentions "B-Tree" will get their "B-Tree" text auto-linked to `/posts/b-tree-structure`.

### Task 19: Add "B-Tree" mention to `hello-world.mdx`

**Files:**
- Modify: `content/posts/hello-world.mdx`

- [ ] **Step 1: Read current file**

```bash
cat content/posts/hello-world.mdx
```

- [ ] **Step 2: Add a sentence mentioning B-Tree**

Replace the body of `content/posts/hello-world.mdx` — keep the frontmatter unchanged, add a new paragraph after the intro that mentions B-Tree. Specifically, replace this section:

```mdx
이 글은 Velite + Next.js + Shiki 파이프라인을 검증하기 위한 샘플입니다.

## 마크다운 기본
```

With:

```mdx
이 글은 Velite + Next.js + Shiki 파이프라인을 검증하기 위한 샘플입니다.

Backend Notes의 키워드 자동 링크 시스템도 이 글에서 확인할 수 있습니다. 예를 들어 B-Tree는 데이터베이스의 기본 자료구조이며, 이 단어는 자동으로 관련 글로 연결됩니다.

## 마크다운 기본
```

- [ ] **Step 3: Regenerate keyword map**

```bash
pnpm generate-keyword-map
```

Expected: output shows `generated N keywords from 5 posts`. Inspect:

```bash
grep 'B-Tree' lib/generated/keyword-map.ts
```

Expected: `B-Tree` key present with `slug: "b-tree-structure"`.

- [ ] **Step 4: Run Velite build**

```bash
pnpm velite
```

Expected: exit 0.

- [ ] **Step 5: Verify the compiled hello-world body contains a keyword link to b-tree-structure**

```bash
node -e 'const p=require("./.velite/posts.json"); const hw=p.find(x=>x.slug==="hello-world"); console.log(hw.body.includes("data-keyword-link"), hw.body.includes("/posts/b-tree-structure"));'
```

Expected: `true true`.

- [ ] **Step 6: Verify `b-tree-structure` body does NOT contain a self-link**

```bash
node -e 'const p=require("./.velite/posts.json"); const bt=p.find(x=>x.slug==="b-tree-structure"); console.log("self-link:", bt.body.includes("/posts/b-tree-structure"));'
```

Expected: `self-link: false`.

### Task 20: Tighten the velite integration test

**Files:**
- Modify: `tests/velite-build.test.ts`

- [ ] **Step 1: Change the trivial `>= 0` assertion to `>= 1`**

Find this line in `tests/velite-build.test.ts`:

```typescript
    expect(totalLinks).toBeGreaterThanOrEqual(0)  // Will tighten after Stage 5
```

Replace with:

```typescript
    expect(totalLinks).toBeGreaterThanOrEqual(1)
```

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: all tests PASS. The new assertion verifies that at least one keyword link was generated end-to-end through the Velite pipeline.

- [ ] **Step 3: Final build**

```bash
pnpm build
pnpm type-check
```

Both must exit 0.

- [ ] **Step 4: Commit Stage 5 together**

```bash
git add content/posts/b-tree-structure.mdx content/posts/hello-world.mdx lib/generated/keyword-map.ts tests/velite-build.test.ts
git commit -m "content: add b-tree-structure post and wire B-Tree auto-link

The new b-tree-structure.mdx declares 'B-Tree' in its keywords.
hello-world.mdx now mentions 'B-Tree' in the body, which the
remark-auto-link plugin converts into a link to /posts/b-tree-structure
(with data-keyword-link='true' so the MDX 'a' override wraps it with
KeywordLink). The velite integration test now asserts totalLinks >= 1
to prevent regression.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Stage 6 — CLAUDE.md 업데이트 + `phase-3-complete` 태그

### Task 21: Update CLAUDE.md §5

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read current §5**

```bash
sed -n '235,290p' CLAUDE.md
```

- [ ] **Step 2: Replace §5 body**

Find `## 5. 키워드 자동 링크 시스템` and replace the entire section (from that heading up to but not including `## 6. 인터랙티브 시각화 시스템`) with:

```markdown
## 5. 키워드 자동 링크 시스템

이 시스템은 **빌드 타임**에 동작하며, 런타임 비용은 0입니다. Phase 3에서 구현 완료 (`phase-3-complete` 태그).

### 5.1 파이프라인 개요

```
prebuild hook → scripts/generate-keyword-map.ts
  ↓
lib/generated/keyword-map.ts (KEYWORD_MAP, KEYWORDS_BY_LENGTH, SLUG_TO_ENTRY)
  ↓
velite build → remarkAutoLink plugin (plugins/remark-auto-link.ts)
  ↓
each MDX body gets <a href="/posts/..." data-keyword-link="true"> inline
  ↓
next build → mdxComponents.a detects data-keyword-link → renders <KeywordLink>
```

### 5.2 충돌 정책

`scripts/generate-keyword-map.ts`는 같은 키워드가 두 글 이상에서 선언되면 빌드를 실패시킨다 (`process.exit(1)`). CLAUDE.md §4.3의 "1:1 매핑" 원칙을 빌드 타임에 강제한다.

### 5.3 경계 규칙

`lib/keyword-matcher.ts`의 `hasBoundary`는 한글/영문 비대칭 경계를 적용한다:
- **영문 앞/뒤**: `[A-Za-z0-9_]` 기준 엄격
- **한글 앞**: 엄격 (`재인덱싱`의 `인덱스` 탈락)
- **한글 뒤**: 완화 — 한국어 조사 허용 (`인덱스를`, `B-Tree가`)

### 5.4 자기 링크 방지

Remark 플러그인은 현재 파일의 basename(확장자 제거)을 `excludeSlug`로 사용해, 한 글이 자기 자신의 키워드를 링크하는 것을 방지한다. 예: `b-tree-structure.mdx` 본문의 "B-Tree"는 링크되지 않는다.

### 5.5 중첩 방지 규칙

- 코드 블록(`code`, `inlineCode`) 내부 키워드 제외
- 기존 `link` 노드 안의 키워드 제외 (이중 링크 방지)
- 한 글에서 같은 키워드(대소문자 무시)는 첫 등장만 링크

### 5.6 KeywordLink 컴포넌트

`components/blog/KeywordLink.tsx`는 `'use client'` 래퍼로, 데스크톱에서는 shadcn Popover로 글 제목/요약 프리뷰를 보여주고 모바일에서는 일반 링크로 degrade한다. `hidden md:contents` + `md:hidden` 이중 렌더 패턴으로 `@media (hover: hover)` 분기를 달성한다.
```

### Task 22: Update CLAUDE.md §12

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Find the Phase list in §12**

```bash
sed -n '/## 12\. 작업 우선순위/,/세부 내역/p' CLAUDE.md | head -15
```

- [ ] **Step 2: Mark Phase 3 complete**

Change the Phase 3 line in the numbered list:

From:
```markdown
3. **Phase 3 — 키워드 시스템**: remark-auto-link 플러그인, KeywordLink 컴포넌트, 키워드 맵
```

To:
```markdown
3. **Phase 3 — 키워드 시스템** ✅ **완료** (`phase-3-complete` 태그): scripts/generate-keyword-map.ts 빌드 전 맵 생성, plugins/remark-auto-link.ts Remark 플러그인, components/blog/KeywordLink.tsx Popover 래퍼. 세부 내역은 §15 참고.
```

### Task 23: Append CLAUDE.md §15 (Phase 3 implementation status)

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Append §15 at end of file**

Add this section after §14 at the end of `CLAUDE.md`:

```markdown

---

## 15. Phase 3 구현 현황

> Phase 3 완료 시점(2026-04-15)의 실제 구현 상태. §13/§14와 동일 포맷.

### 15.1 존재하는 파일 (Phase 3에서 추가·변경)

```
scripts/
└── generate-keyword-map.ts      # pre-build I/O 스크립트 (tsx)

lib/
├── generated/
│   └── keyword-map.ts           # 빌드 타임 생성 TS 상수 (커밋 대상)
└── keyword-matcher.ts           # findMatches, hasBoundary 순수 함수

plugins/
└── remark-auto-link.ts          # MDAST text → link 치환, visitParents 기반

components/
├── blog/
│   └── KeywordLink.tsx          # 'use client', shadcn Popover 래퍼
├── mdx/
│   └── components.tsx           # [수정] a override에 data-keyword-link 분기
└── ui/
    └── popover.tsx              # shadcn CLI 생성

velite.config.ts                 # [수정] mdx.remarkPlugins 추가
package.json                     # [수정] prebuild/predev/pretest + tsx/gray-matter/unist-util-visit-parents/@radix-ui/react-popover
content/posts/
├── hello-world.mdx              # [수정] B-Tree 본문 참조 추가
└── b-tree-structure.mdx         # 신규, B-Tree 키워드 선언

tests/
├── keyword-matcher.test.ts      # 18 케이스
├── generate-keyword-map.test.ts # 8 케이스
├── remark-auto-link.test.ts     # 10 케이스
└── velite-build.test.ts         # [수정] +2 통합 테스트
```

### 15.2 핵심 의사결정 (변경 금지)

| 결정 | 이유 | 영향 |
|---|---|---|
| Remark (MDAST) 단계에서 치환 | 코드/링크 ancestor 판정이 MDAST 노드 타입으로 선언적 | Rehype 단계(code block이 `<pre>`로 감싸진 후)에서 탐지가 어려움 |
| `lib/generated/keyword-map.ts` 커밋 대상 | Clean clone에서 즉시 빌드 가능 + 히스토리 추적 | 키워드 변경 시 diff 노이즈 발생 (수용) |
| 한글 뒤 경계 완화 | 한국어 조사(`를/가/의/는/...`) 허용 필수 | 드문 오탐은 긴 복합어를 별도 키워드로 등록해 해결 |
| `currentSlug`는 파일 basename | Velite API 의존 없음 | Velite `s.slug('post')` 규칙과 일치 (파일명 = slug 전제) |
| 충돌 시 빌드 실패 | 1:1 매핑 원칙을 즉시 강제 | 작성자가 30초 내 해결 가능한 에러 메시지 |
| 데스크톱/모바일 이중 렌더 | `@media (hover: hover)` 기반 분기를 JS 런타임 없이 달성 | 두 벌 렌더 비용은 짧은 키워드 텍스트라 무시 가능 |
| `KEYWORDS_BY_LENGTH` 사전 정렬 | Greedy matching 시 매 호출마다 재정렬 방지 | 빌드 타임에 한 번만 정렬 |

### 15.3 명령어 치트시트

```bash
pnpm dev                    # Velite + Next (prebuild/predev로 키워드 맵 자동 생성)
pnpm build                  # 프로덕션 빌드 (prebuild 포함)
pnpm test                   # pretest로 키워드 맵 생성 + velite + vitest (총 ~84 테스트)
pnpm test:unit              # vitest only (키워드 맵은 기존 상태 유지)
pnpm generate-keyword-map   # 수동 재생성 (frontmatter 수정 후)
pnpm type-check             # tsc --noEmit
pnpm velite                 # Velite만 실행
```

### 15.4 알려진 미결 사항 (후속 Phase에서 처리)

- **HMR 지원**: dev 모드에서 새 MDX 파일 추가 시 자동 재생성 — Phase 6 polish
- **키워드 변형/별칭**: `B-Tree` ↔ `B트리` ↔ `비트리` — Phase 5+
- **Aho-Corasick 매칭 최적화**: Greedy + claimed O(K×T) 성능 문제 발생 시 Phase 6
- **키워드 역링크 표시** ("이 글을 참조하는 글들"): Phase 5 관련 글 추천에 흡수

### 15.5 리포지토리

- **원격**: `https://github.com/ing9990/backend-notes` (private)
- **Phase 3 태그**: `phase-3-complete`
- **브랜치 전략**: Phase 2와 동일하게 단일 `main` 브랜치에 직접 또는 `phase-3-keyword-system` feature 브랜치 후 squash merge.
```

- [ ] **Step 2: Verify CLAUDE.md still builds**

`CLAUDE.md` is not compiled, but verify the file has no broken markdown by reading its last 50 lines:

```bash
tail -50 CLAUDE.md
```

Expected: §15.5 section is the last content, no trailing garbage.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Phase 3 completion (§5, §12, §15)"
```

### Task 24: Tag `phase-3-complete`

**Files:**
- None (git tag)

- [ ] **Step 1: Final verification**

```bash
pnpm build
pnpm type-check
pnpm test
```

All three must exit 0. Test count should be ~84 (17 Phase 1 + 29 Phase 2 + 38 Phase 3).

- [ ] **Step 2: Create tag**

```bash
git tag phase-3-complete
git log --oneline -1 phase-3-complete
```

Expected: the tag points at the most recent commit (CLAUDE.md update).

- [ ] **Step 3: Do NOT push**

Pushing is the controller's/user's decision. This task is complete once the tag exists locally.

---

## Rollback Notes

Each task's commit is self-contained. If a later task fails catastrophically, roll back to the previous stage's final commit:

```bash
git log --oneline
git reset --hard <commit-sha>
rm -rf .next .velite
pnpm install
pnpm generate-keyword-map
pnpm build
```

Specific rollback anchors:
- Stage 1 end: "feat(lib): add keyword-matcher ..."
- Stage 2 end: "feat(keyword-map): add pre-build scanner ..."
- Stage 3 end: "test(velite): add integration tests ..."
- Stage 4 end: "feat(mdx): branch a override ..."
- Stage 5 end: "content: add b-tree-structure post ..."
- Stage 6 end: "docs: update CLAUDE.md for Phase 3 completion ..."
