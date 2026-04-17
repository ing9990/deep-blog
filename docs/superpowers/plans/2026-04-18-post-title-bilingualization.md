# 포스트 제목/요약 이중화 + 기본 언어 'ko' Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Frontmatter `title`/`summary`를 `{ ko, en }` nested 구조로 이중화하고, 10개 포스트를 마이그레이션하며, 기본 언어를 `'ko'`로 전환한다. 본문/URL/SEO는 후속 PR.

**Architecture:** Velite 스키마 변경이 타입 에러로 소비자를 드라이브한다. 사용처는 `post.title[lang]` 패턴으로 일괄 교체. 서버 렌더링 영역(`app/posts/[slug]/page.tsx`의 h1)은 `PostTitle` client leaf로 분리하여 lang 반영. `generateMetadata`는 빌드 시 `.ko` 고정. `filters.ts`의 `sortPosts`와 `categories.ts`의 `groupPostsByCategory`는 lang 인자를 받는 시그니처로 확장. blog-writer 스킬과 memory도 lockstep 업데이트.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Velite, Vitest + jsdom, pnpm.

**Spec:** `docs/superpowers/specs/2026-04-18-post-title-bilingualization.md`

**중간 상태 주의:** Task 1 (스키마 변경) 이후 Task 13까지 `pnpm type-check`가 실패 상태 유지. 최종 Task 13 (검증)에서 모든 에러 해소·build PASS 확인. 각 task는 논리 단위로 commit하되 type-check PASS는 Task 13 기준.

---

## File Structure

**수정:**
- `velite.config.ts` — 스키마 nested
- `components/providers/SettingsProvider.tsx` — 기본값 `'ko'`, normalize fallback `'ko'`
- `lib/filters.ts` — `sortPosts(posts, key, lang)`, 검색 양쪽 언어, `applyFilters(posts, filters, lang)` 시그니처 확장
- `lib/categories.ts` — `groupPostsByCategory(posts, lang)`
- `lib/client-post.ts` — 타입 전파
- `scripts/generate-keyword-map.ts` — title/summary 객체
- `app/posts/[slug]/page.tsx` — h1을 `<PostTitle>` 클라이언트 leaf로 교체, `generateMetadata`는 `.ko` 고정
- `components/blog/PostCardEditorial.tsx`, `PostCardTimeline.tsx`, `PostCardFloating.tsx`, `CategoryNav.tsx`, `MobileOverlays.tsx`, `KeywordLink.tsx`, `RelatedPost.tsx` — `[lang]` 접근
- `components/blog/BlogHomeClient.tsx` — `applyFilters`에 lang 전달
- `components/blog/IndexCategoryNav.tsx` — `groupPostsByCategory(posts, lang)` 전달
- `content/posts/*.mdx` (10개) — frontmatter 마이그레이션
- `.claude/skills/blog-writer/references/stage-3-mdx.md`, `stage-2-note.md`, `validation-loop.md`
- `~/.claude/projects/-Users-ing9990-Document-backend-notes/memory/feedback-english-naming.md`
- `tests/velite-build.test.ts`, `tests/filters.test.ts`, `tests/generate-keyword-map.test.ts`, `tests/posts.test.ts`, `tests/related-posts.test.ts`

**신규:**
- `components/blog/PostTitle.tsx` — client leaf for h1

---

## Task 1: Velite 스키마 이중화

**Files:**
- Modify: `velite.config.ts`

- [ ] **Step 1: `velite.config.ts`의 `postFrontmatterShape` 교체**

`postFrontmatterShape` 정의를 다음으로 교체 (다른 내보내기·로직은 그대로):

```ts
const postFrontmatterShape = s.object({
  title: s.object({
    ko: s.string().min(1).max(120),
    en: s.string().min(1).max(120),
  }),
  slug: s.string().min(3).max(200).regex(slugRegex, 'slug must be lowercase (a-z, 0-9, hyphens only)'),
  date: s.isodate(),
  updatedAt: s.isodate().optional(),
  tags: s
    .array(
      s
        .string()
        .min(1)
        .regex(/^[^/?#]+$/, 'tag must not contain / ? # (URL-unsafe for /tags/[tag] route)'),
    )
    .min(1)
    .max(5),
  keywords: s.array(s.string().min(1)).min(1),
  summary: s.object({
    ko: s.string().min(10).max(300),
    en: s.string().min(10).max(300),
  }),
  category: s.enum(CATEGORY_IDS),
  series: s.string().optional(),
  seriesOrder: s.number().int().positive().optional(),
  draft: s.boolean().default(false),
})
```

- [ ] **Step 2: type-check로 영향 범위 확인**

Run: `pnpm type-check`
Expected: FAIL with many errors in files that access `.title` / `.summary` as string.
Note the list; Task 2-13 will fix them.

- [ ] **Step 3: 커밋 (intermediate broken state 수용)**

```bash
git add velite.config.ts
git commit -m "$(cat <<'EOF'
feat(velite): bilingualize title and summary schema

Nested { ko, en } required for both fields. Consumer files now
type-error until migration tasks complete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 10개 포스트 frontmatter 마이그레이션

**Files:**
- Modify: `content/posts/b-tree-structure.mdx`
- Modify: `content/posts/cardinality.mdx`
- Modify: `content/posts/claude-code-primer.mdx`
- Modify: `content/posts/database-index-deep-dive.mdx`
- Modify: `content/posts/full-table-scan.mdx`
- Modify: `content/posts/idempotency.mdx`
- Modify: `content/posts/jvm-gc-intro.mdx`
- Modify: `content/posts/quick-sort.mdx`
- Modify: `content/posts/tabs-sandbox.mdx`
- Modify: `content/posts/two-generals-problem.mdx`

각 파일의 frontmatter (맨 위 `---`로 감싸진 YAML) 내 `title:` 과 `summary:` 두 필드만 수정. 다른 필드는 그대로.

- [ ] **Step 1: `b-tree-structure.mdx`**

기존:
```yaml
title: "B-Tree"
...
summary: "B-Tree가 왜 디스크 기반 시스템의 표준 자료구조가 되었는지 이해하고, 탐색·삽입·분할의 내부 동작 원리와 B+Tree·해시 인덱스와의 트레이드오프를 구분할 수 있습니다."
```

→

```yaml
title:
  ko: "B-Tree"
  en: "B-Tree"
...
summary:
  ko: "B-Tree가 왜 디스크 기반 시스템의 표준 자료구조가 되었는지 이해하고, 탐색·삽입·분할의 내부 동작 원리와 B+Tree·해시 인덱스와의 트레이드오프를 구분할 수 있습니다."
  en: "Why B-Tree became the standard data structure for disk-based systems. Covers search, insert, and split mechanics, plus how it trades off against B+Tree and hash indexes."
```

- [ ] **Step 2: `cardinality.mdx`**

```yaml
title:
  ko: "카디널리티"
  en: "Cardinality"
...
summary:
  ko: "카디널리티가 무엇인지 이해하고, 높은/낮은 카디널리티가 인덱스·캐시·파티셔닝 등 다양한 영역에서 어떤 영향을 주는지 판단하는 기준을 얻습니다."
  en: "What cardinality means, and how high vs low cardinality shapes decisions across indexing, caching, and partitioning."
```

- [ ] **Step 3: `claude-code-primer.mdx`**

```yaml
title:
  ko: "Claude Code"
  en: "Claude Code"
...
summary:
  ko: "Claude Code가 일반 챗봇과 무엇이 다른지 이해하고, 네 가지 확장 축(CLAUDE.md·Skills·Agents·Plugins)의 설계 원리와 트레이드오프를 구분할 수 있습니다. 설치부터 실무 시나리오까지 한 글로 정리합니다."
  en: "What sets Claude Code apart from a general chatbot, and how its four extension surfaces (CLAUDE.md, Skills, Agents, Plugins) trade off. Covers setup through real-world scenarios in one post."
```

- [ ] **Step 4: `database-index-deep-dive.mdx`**

```yaml
title:
  ko: "데이터베이스 인덱스"
  en: "Database Index"
...
summary:
  ko: "B+Tree 기반 인덱스의 내부 동작 원리를 이해하고, 복합 인덱스의 리프 노드 배치부터 등호 먼저·정렬 마지막 원칙, 인덱스 개수 결정까지 실전 설계 기준을 얻습니다."
  en: "How B+Tree-based indexes work under the hood, from composite-index leaf layout to the equality-first/sort-last rule and deciding how many indexes to add."
```

- [ ] **Step 5: `full-table-scan.mdx`**

```yaml
title:
  ko: "Full Table Scan"
  en: "Full Table Scan"
...
summary:
  ko: "Full Table Scan이 언제 문제이고 언제 정상인지 구분할 수 있습니다. 옵티마이저가 인덱스 대신 Full Table Scan을 선택하는 이유와 Sequential I/O vs Random I/O 트레이드오프를 이해합니다."
  en: "When a full table scan is a problem and when it is not. Why the optimizer sometimes prefers a scan over an index, and how Sequential I/O vs Random I/O drives that choice."
```

- [ ] **Step 6: `idempotency.mdx`**

```yaml
title:
  ko: "멱등성"
  en: "Idempotency"
...
summary:
  ko: "같은 요청을 여러 번 보내도 한 번 보낸 것과 동일한 결과를 보장하는 멱등성이 왜 필요하고 어떻게 구현되는지 이해합니다. HTTP 메서드 의미론부터 Idempotency-Key 패턴, 자연 멱등 설계까지의 내부 동작을 정리합니다."
  en: "Why idempotency matters and how it is implemented: delivering the same request N times should leave the system in the same final state as a single delivery. Covers HTTP method semantics, the Idempotency-Key pattern, and naturally idempotent design."
```

- [ ] **Step 7: `jvm-gc-intro.mdx`**

```yaml
title:
  ko: "JVM 가비지 컬렉션"
  en: "JVM Garbage Collection"
...
summary:
  ko: "JVM GC가 왜 필요하고, 힙 구조와 세대별 수거가 어떻게 동작하며, 알고리즘별 트레이드오프를 판단하는 기준을 얻습니다."
  en: "Why JVM GC exists, how the heap is structured, how generational collection works, and the tradeoffs between the major algorithms."
```

- [ ] **Step 8: `quick-sort.mdx`**

```yaml
title:
  ko: "퀵 정렬"
  en: "Quick Sort"
...
summary:
  ko: "분할 정복 기반의 대표적인 비교 정렬 알고리즘인 Quick Sort의 동작 원리, 구현, 시간 복잡도, 주의사항을 한 페이지에 정리합니다. 이 글은 Backend Notes의 모든 MDX 문법 스타일 가이드를 겸합니다."
  en: "Quick Sort, the classic divide-and-conquer comparison sort, covered end to end: mechanics, implementation, time complexity, and pitfalls. Doubles as the MDX syntax style guide for this blog."
```

- [ ] **Step 9: `tabs-sandbox.mdx`**

```yaml
title:
  ko: "Tabs Sandbox"
  en: "Tabs Sandbox"
...
summary:
  ko: "MDX `<Tabs>` 컴포넌트의 회귀 검증 참고 글. 미배포. 그룹 동기화, 독립 모드, 혼합 콘텐츠, 긴 라벨을 다룹니다."
  en: "Regression reference for the <Tabs> MDX component. Not published. Covers group sync, independent mode, mixed content, and long labels."
```

- [ ] **Step 10: `two-generals-problem.mdx`**

```yaml
title:
  ko: "Two Generals' Problem 소개"
  en: "Two Generals' Problem"
...
summary:
  ko: "비신뢰 채널 위에서 두 당사자가 확정적 합의에 도달하는 것이 왜 불가능한지 이해하고, 현대 분산 시스템이 이 불가능성과 어떻게 타협하는지 구분할 수 있습니다. At-least-once와 멱등성이 표준이 된 근본 이유를 설명합니다."
  en: "Why two parties cannot reach certain agreement over an unreliable channel, and how modern distributed systems live with that impossibility. Explains the foundational reason at-least-once delivery and idempotency became the norm."
```

- [ ] **Step 11: keyword-map 재생성**

Run: `pnpm generate-keyword-map`
Expected: SUCCESS — scripts/generate-keyword-map.ts still reads `data.title as string` at line 47 (not yet updated), so it picks up an empty string for title. That's OK for this intermediate commit; Task 8 fixes the script.

- [ ] **Step 12: Velite 빌드 시도**

Run: `pnpm build`
Expected: velite build phase PASS (스키마는 nested 요구, 10개 포스트 nested 제공 → 통과). TypeScript phase FAIL (사용처 에러).

- [ ] **Step 13: 커밋**

```bash
git add content/posts/*.mdx lib/generated/keyword-map.ts
git commit -m "$(cat <<'EOF'
content: migrate 10 posts to { ko, en } title/summary

Per translation drafts in the spec. Quotes use schema-required nested
objects. Keyword-map regenerated; title field inside it is still
empty-string stub until Task 8 migrates the generator.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `tests/velite-build.test.ts` 업데이트

**Files:**
- Modify: `tests/velite-build.test.ts`

- [ ] **Step 1: 'first post has all required frontmatter fields' 테스트 업데이트**

변경:

```ts
it('first post has all required frontmatter fields', () => {
  const post = posts[0]
  expect(post).toMatchObject({
    title: {
      ko: expect.any(String),
      en: expect.any(String),
    },
    slug: expect.any(String),
    date: expect.any(String),
    tags: expect.any(Array),
    keywords: expect.any(Array),
    summary: {
      ko: expect.any(String),
      en: expect.any(String),
    },
  })
  expect(post.tags.length).toBeGreaterThan(0)
  expect(post.keywords.length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: 테스트 실행**

Run: `pnpm vitest run tests/velite-build.test.ts`
Expected: PASS — real posts now have the nested shape from Task 2.

- [ ] **Step 3: 커밋**

```bash
git add tests/velite-build.test.ts
git commit -m "test(velite): expect nested { ko, en } for title and summary

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `SettingsProvider` 기본 언어 'ko' 전환

**Files:**
- Modify: `components/providers/SettingsProvider.tsx`

- [ ] **Step 1: 두 상수 수정**

파일에서 두 군데 변경:

`DEFAULT_SETTINGS.language`:
```ts
// before
language: 'en',
// after
language: 'ko',
```

`normalizeLanguage`:
```ts
// before
function normalizeLanguage(value: unknown): Language {
  return value === 'ko' || value === 'en' ? value : 'en'
}
// after
function normalizeLanguage(value: unknown): Language {
  return value === 'ko' || value === 'en' ? value : 'ko'
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/providers/SettingsProvider.tsx
git commit -m "$(cat <<'EOF'
feat(settings): change default language to 'ko'

Korean-centric blog, Korean default matches the majority visitor.
Existing localStorage values preserved untouched; only first-paint
and tampered-value fallback change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `tests/posts.test.ts` + `tests/related-posts.test.ts` mock 업데이트

**Files:**
- Modify: `tests/posts.test.ts`
- Modify: `tests/related-posts.test.ts`

- [ ] **Step 1: `tests/posts.test.ts` mock object의 title/summary를 nested로**

`vi.mock('#site/content', ...)` 안의 3개 post (a, b, c) 각각에서:

```ts
// before: title: 'Post A', summary: 'summary a',
// after:
title: { ko: 'Post A', en: 'Post A' },
summary: { ko: 'summary a', en: 'summary a' },
```

b는 `{ ko: 'Post B', en: 'Post B' }`, `{ ko: 'summary b', en: 'summary b' }`, c는 `{ ko: 'Draft C', en: 'Draft C' }`, `{ ko: 'summary c', en: 'summary c' }`.

`it('getPostBySlug returns the published post for a valid slug')` 테스트의 assertion 변경:

```ts
// before
expect(getPostBySlug('a')?.title).toBe('Post A')
// after
expect(getPostBySlug('a')?.title.en).toBe('Post A')
```

- [ ] **Step 2: `tests/related-posts.test.ts` mock object의 title/summary를 nested로**

5개 post (a~e) 각각에서:

```ts
// before: title: 'A', summary: '',
// after:
title: { ko: 'A', en: 'A' },
summary: { ko: '', en: '' },
```

같은 패턴으로 b~e.

**주의**: `summary: { ko: '', en: '' }`는 schema의 `min(10)` 제약을 위반하지만, 이 테스트는 vi.mock으로 타입만 맞추고 Velite 스키마 자체는 실행되지 않으므로 OK. TypeScript 타입만 통과하면 됨.

- [ ] **Step 3: 두 테스트 실행**

Run: `pnpm vitest run tests/posts.test.ts tests/related-posts.test.ts`
Expected: PASS.

- [ ] **Step 4: 커밋**

```bash
git add tests/posts.test.ts tests/related-posts.test.ts
git commit -m "test(posts): update mocks to nested title/summary

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `lib/filters.ts` 시그니처 확장 + 테스트

**Files:**
- Modify: `lib/filters.ts`
- Modify: `tests/filters.test.ts`

- [ ] **Step 1: `lib/filters.ts` 전체 교체**

```ts
// lib/filters.ts
import type { Post } from './posts'
import type { Language } from '@/components/providers/SettingsProvider'

export type SortKey = 'latest' | 'oldest' | 'title'

export interface PostFilters {
  tag?: string
  query?: string
  sort?: SortKey
}

export function filterByTag<T extends Pick<Post, 'tags'>>(
  posts: readonly T[],
  tag?: string,
): T[] {
  if (!tag) return posts.slice()
  const needle = tag.toLowerCase()
  return posts.filter((p) => p.tags.some((t) => t.toLowerCase() === needle))
}

type Searchable = Pick<Post, 'title' | 'summary' | 'tags' | 'keywords'> & {
  plainBody?: string
}

export function searchPosts<T extends Searchable>(
  posts: readonly T[],
  query?: string,
): T[] {
  const q = query?.trim().toLowerCase()
  if (!q) return posts.slice()
  return posts.filter((p) => {
    if (p.title.ko.toLowerCase().includes(q)) return true
    if (p.title.en.toLowerCase().includes(q)) return true
    if (p.summary.ko.toLowerCase().includes(q)) return true
    if (p.summary.en.toLowerCase().includes(q)) return true
    if (p.tags.some((t) => t.toLowerCase().includes(q))) return true
    if (p.keywords.some((k) => k.toLowerCase().includes(q))) return true
    if (p.plainBody && p.plainBody.toLowerCase().includes(q)) return true
    return false
  })
}

// Korean-aware collator for tag sorting (language-independent).
const koCollator = new Intl.Collator('ko', { sensitivity: 'base' })

export function sortPosts<T extends Pick<Post, 'date' | 'title'>>(
  posts: readonly T[],
  sort: SortKey | undefined,
  lang: Language,
): T[] {
  const out = posts.slice()
  const key = sort ?? 'latest'
  switch (key) {
    case 'latest':
      return out.sort((a, b) => b.date.localeCompare(a.date))
    case 'oldest':
      return out.sort((a, b) => a.date.localeCompare(b.date))
    case 'title': {
      const collator = new Intl.Collator(lang, { sensitivity: 'base' })
      return out.sort((a, b) => collator.compare(a.title[lang], b.title[lang]))
    }
  }
}

export function applyFilters<
  T extends Searchable & Pick<Post, 'date'>,
>(posts: readonly T[], filters: PostFilters, lang: Language): T[] {
  const afterTag = filterByTag(posts, filters.tag)
  const afterSearch = searchPosts(afterTag, filters.query)
  return sortPosts(afterSearch, filters.sort, lang)
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

**Changes vs prior**:
- `import type { Language }` 추가
- `searchPosts`: `p.title.ko/en`, `p.summary.ko/en` 각각 매칭 (string → object)
- `sortPosts` 시그니처: `sort: SortKey | undefined, lang: Language` (positional, lang required)
- `sortPosts('title')` 분기: `new Intl.Collator(lang)` 로 lang-aware 정렬
- `applyFilters` 시그니처: `filters, lang` 추가

- [ ] **Step 2: `tests/filters.test.ts` 전체 교체**

```ts
// tests/filters.test.ts
import { describe, it, expect } from 'vitest'
import {
  filterByTag,
  searchPosts,
  sortPosts,
  applyFilters,
  extractAllTags,
} from '@/lib/filters'

type TestPost = {
  slug: string
  title: { ko: string; en: string }
  summary: { ko: string; en: string }
  tags: string[]
  keywords: string[]
  date: string
  plainBody?: string
}

function makePost(partial: Partial<TestPost> & { slug: string }): TestPost {
  return {
    slug: partial.slug,
    title: partial.title ?? { ko: `제목 ${partial.slug}`, en: `Title ${partial.slug}` },
    summary: partial.summary ?? { ko: `요약 ${partial.slug}`, en: `Summary ${partial.slug}` },
    tags: partial.tags ?? [],
    keywords: partial.keywords ?? [],
    date: partial.date ?? '2026-01-01',
    plainBody: partial.plainBody,
  }
}

const sample: TestPost[] = [
  makePost({
    slug: 'p1',
    title: { ko: '데이터베이스 인덱스의 동작 원리', en: 'How Database Index Works' },
    summary: { ko: 'DB 인덱스가 빠른 이유', en: 'Why DB indexes are fast' },
    tags: ['Database', 'Index'],
    keywords: ['B-Tree', '인덱스'],
    date: '2026-04-10',
  }),
  makePost({
    slug: 'p2',
    title: { ko: 'Kafka Consumer Group 리밸런싱', en: 'Kafka Consumer Group Rebalancing' },
    summary: { ko: '컨슈머 그룹 리밸런싱 전략', en: 'Consumer group rebalancing strategies' },
    tags: ['Kafka', 'Backend'],
    keywords: ['Consumer Group'],
    date: '2026-04-08',
  }),
  makePost({
    slug: 'p3',
    title: { ko: 'JVM GC 소개', en: 'JVM GC Intro' },
    summary: { ko: 'Garbage Collection 기초', en: 'Garbage Collection basics' },
    tags: ['JVM', 'Backend'],
    keywords: ['G1', 'Mark-Sweep'],
    date: '2026-04-01',
  }),
]

describe('filterByTag', () => {
  it('returns all when tag is undefined', () => {
    expect(filterByTag(sample, undefined)).toHaveLength(3)
  })

  it('filters by exact tag match', () => {
    const result = filterByTag(sample, 'Database')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('is case-insensitive', () => {
    const result = filterByTag(sample, 'database')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('returns empty array when no match', () => {
    expect(filterByTag(sample, 'NoSuchTag')).toEqual([])
  })
})

describe('searchPosts', () => {
  it('returns all when query is undefined or empty', () => {
    expect(searchPosts(sample, undefined)).toHaveLength(3)
    expect(searchPosts(sample, '')).toHaveLength(3)
    expect(searchPosts(sample, '   ')).toHaveLength(3)
  })

  it('matches Korean title', () => {
    const result = searchPosts(sample, '인덱스')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('matches English title', () => {
    const result = searchPosts(sample, 'Database Index')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('matches Korean summary', () => {
    const result = searchPosts(sample, '리밸런싱 전략')
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })

  it('matches English summary', () => {
    const result = searchPosts(sample, 'rebalancing strategies')
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })

  it('matches tag', () => {
    const result = searchPosts(sample, 'JVM')
    expect(result.map((p) => p.slug)).toEqual(['p3'])
  })

  it('matches keyword', () => {
    const result = searchPosts(sample, 'b-tree')
    expect(result.map((p) => p.slug)).toEqual(['p1'])
  })

  it('is case-insensitive for Latin', () => {
    const result = searchPosts(sample, 'KAFKA')
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })

  it('matches plainBody content when the field is present', () => {
    const withBody: TestPost[] = [
      makePost({
        slug: 'bodymatch',
        title: { ko: '다른 제목', en: 'Other Title' },
        summary: { ko: '본문 검색', en: 'Body-only match' },
        plainBody: '실제 본문 어딘가에 쿼리 토큰이 등장합니다.',
      }),
      makePost({ slug: 'nomatch', plainBody: '전혀 관련 없는 본문' }),
    ]
    const result = searchPosts(withBody, '쿼리 토큰')
    expect(result.map((p) => p.slug)).toEqual(['bodymatch'])
  })
})

describe('sortPosts', () => {
  it('defaults to latest (date descending) under any lang', () => {
    const result = sortPosts(sample, undefined, 'ko')
    expect(result.map((p) => p.slug)).toEqual(['p1', 'p2', 'p3'])
  })

  it('sorts oldest first', () => {
    const result = sortPosts(sample, 'oldest', 'ko')
    expect(result.map((p) => p.slug)).toEqual(['p3', 'p2', 'p1'])
  })

  it('sorts by title using ko collator when lang=ko', () => {
    const result = sortPosts(sample, 'title', 'ko')
    // Intl.Collator('ko'): Hangul '데'(데이터베이스) < 'J'(JVM GC) < 'K'(Kafka).
    expect(result.map((p) => p.slug)).toEqual(['p1', 'p3', 'p2'])
  })

  it('sorts by title using en collator when lang=en', () => {
    const result = sortPosts(sample, 'title', 'en')
    // Intl.Collator('en'): 'H'(How Database) < 'J'(JVM GC) < 'K'(Kafka).
    expect(result.map((p) => p.slug)).toEqual(['p1', 'p3', 'p2'])
  })

  it('does not mutate input', () => {
    const copy = sample.slice()
    sortPosts(sample, 'oldest', 'ko')
    expect(sample).toEqual(copy)
  })
})

describe('applyFilters', () => {
  it('applies tag then search then sort', () => {
    const result = applyFilters(
      sample,
      { tag: 'Backend', query: 'Consumer', sort: 'latest' },
      'ko',
    )
    expect(result.map((p) => p.slug)).toEqual(['p2'])
  })
})

describe('extractAllTags', () => {
  it('returns unique tags with counts in descending order', () => {
    const result = extractAllTags(sample)
    expect(result).toContainEqual({ tag: 'Backend', count: 2 })
    expect(result[0].count).toBeGreaterThanOrEqual(result[result.length - 1].count)
  })
})
```

- [ ] **Step 3: 테스트 실행**

Run: `pnpm vitest run tests/filters.test.ts`
Expected: PASS.

- [ ] **Step 4: 커밋**

```bash
git add lib/filters.ts tests/filters.test.ts
git commit -m "$(cat <<'EOF'
feat(filters): lang-aware sort, bilingual search

sortPosts(posts, key, lang) uses Intl.Collator(lang) for title sort.
searchPosts matches both title.ko/en and summary.ko/en. applyFilters
signature extended with lang.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `lib/categories.ts` `groupPostsByCategory` 시그니처 확장

**Files:**
- Modify: `lib/categories.ts`

- [ ] **Step 1: `groupPostsByCategory` 시그니처 + 정렬 교체**

현재 함수 정의 (파일 말미) 전체를 교체:

```ts
import type { Language } from '@/components/providers/SettingsProvider'
```
를 파일 상단 import 섹션에 추가 (type-only, 순환 의존 없음).

함수 교체:

```ts
export function groupPostsByCategory<T extends { category: CategoryId; date: string; title: { ko: string; en: string } }>(
  posts: readonly T[],
  lang: Language,
): CategoryGroup<T>[] {
  const buckets = new Map<CategoryId, T[]>()
  for (const post of posts) {
    const list = buckets.get(post.category) ?? []
    list.push(post)
    buckets.set(post.category, list)
  }

  const collator = new Intl.Collator(lang, { sensitivity: 'base' })

  return CATEGORIES.flatMap((category) => {
    const list = buckets.get(category.id)
    if (!list || list.length === 0) return []
    const sorted = list.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return collator.compare(a.title[lang], b.title[lang])
    })
    return [{ category, posts: sorted }]
  })
}
```

- [ ] **Step 2: type-check 부분 확인 (categories 모듈 local)**

Run: `pnpm type-check 2>&1 | grep categories.ts | head -5`
Expected: 이 파일 자체는 에러 없음 (호출자는 다른 에러). 호출자는 Task 10에서 수정.

- [ ] **Step 3: 커밋**

```bash
git add lib/categories.ts
git commit -m "$(cat <<'EOF'
feat(categories): groupPostsByCategory takes lang, uses lang collator

Tiebreaker sort within a category now honors the active language.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `scripts/generate-keyword-map.ts` 이중화 + 테스트

**Files:**
- Modify: `scripts/generate-keyword-map.ts`
- Modify: `tests/generate-keyword-map.test.ts`

- [ ] **Step 1: `scripts/generate-keyword-map.ts` 전체 교체**

```ts
// scripts/generate-keyword-map.ts
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import matter from 'gray-matter'

const POSTS_DIR = 'content/posts'
const OUTPUT_FILE = 'lib/generated/keyword-map.ts'

export interface BilingualText {
  ko: string
  en: string
}

export interface ScannedPost {
  file: string
  slug: string
  title: BilingualText
  summary: BilingualText
  keywords: string[]
}

export interface KeywordEntry {
  slug: string
  title: BilingualText
  summary: BilingualText
}

export interface Conflict {
  keyword: string
  files: Array<{ file: string; slug: string }>
}

function parseBilingual(raw: unknown, fallbackKey: string): BilingualText {
  if (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    typeof (raw as Record<string, unknown>).ko === 'string' &&
    typeof (raw as Record<string, unknown>).en === 'string'
  ) {
    return {
      ko: (raw as Record<string, string>).ko,
      en: (raw as Record<string, string>).en,
    }
  }
  // Defensive fallback (should never hit if schema enforced upstream).
  throw new Error(`frontmatter.${fallbackKey} must be { ko: string; en: string }`)
}

async function scanPosts(dir: string): Promise<ScannedPost[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const out: ScannedPost[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await scanPosts(full)))
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue
    try {
      const raw = await readFile(full, 'utf8')
      const { data } = matter(raw)
      if (data.draft === true) continue
      if (typeof data.slug !== 'string') continue
      if (!Array.isArray(data.keywords)) continue
      out.push({
        file: relative(process.cwd(), full),
        slug: data.slug,
        title: parseBilingual(data.title, 'title'),
        summary: parseBilingual(data.summary, 'summary'),
        keywords: data.keywords.filter((k): k is string => typeof k === 'string'),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`[keyword-map] failed to parse ${full}: ${msg}`)
    }
  }
  return out
}

export function buildMap(posts: readonly ScannedPost[]): {
  map: Map<string, KeywordEntry>
  conflicts: Conflict[]
} {
  const declarations = new Map<
    string,
    Array<{ file: string; slug: string; title: BilingualText; summary: BilingualText }>
  >()

  for (const post of posts) {
    for (const keyword of post.keywords) {
      if (keyword.length === 0) continue
      const key = keyword.toLowerCase()
      const list = declarations.get(key) ?? []
      list.push({ file: post.file, slug: post.slug, title: post.title, summary: post.summary })
      declarations.set(key, list)
    }
  }

  const map = new Map<string, KeywordEntry>()
  const conflicts: Conflict[] = []

  for (const [key, list] of declarations) {
    if (list.length > 1) {
      conflicts.push({
        keyword: key,
        files: list.map((d) => ({ file: d.file, slug: d.slug })),
      })
    } else {
      const [only] = list
      map.set(key, { slug: only.slug, title: only.title, summary: only.summary })
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
  lines.push("Resolution: Each keyword may only be declared in one post's frontmatter.")
  lines.push('Aborting build.')
  return lines.join('\n')
}

function escapeStringLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

function emitBilingual(b: BilingualText): string {
  return `{ ko: "${escapeStringLiteral(b.ko)}", en: "${escapeStringLiteral(b.en)}" }`
}

export function serializeMap(map: Map<string, KeywordEntry>): string {
  const entries = Array.from(map.entries())
  entries.sort(([a], [b]) => a.localeCompare(b))
  const byLength = entries
    .map(([kw]) => kw)
    .sort((a, b) => b.length - a.length || a.localeCompare(b))

  const header = [
    '// lib/generated/keyword-map.ts',
    '// DO NOT EDIT: generated by scripts/generate-keyword-map.ts',
    '',
    'export interface BilingualText {',
    '  ko: string',
    '  en: string',
    '}',
    '',
    'export interface KeywordEntry {',
    '  slug: string',
    '  title: BilingualText',
    '  summary: BilingualText',
    '}',
    '',
  ].join('\n')

  const mapEntries = entries
    .map(
      ([kw, e]) =>
        `  ["${escapeStringLiteral(kw)}", { slug: "${escapeStringLiteral(e.slug)}", title: ${emitBilingual(e.title)}, summary: ${emitBilingual(e.summary)} }],`,
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
        `  ["${escapeStringLiteral(slug)}", { slug: "${escapeStringLiteral(e.slug)}", title: ${emitBilingual(e.title)}, summary: ${emitBilingual(e.summary)} }],`,
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

const isEntry =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`

if (isEntry) {
  main().catch((err) => {
    console.error('[keyword-map] fatal:', err)
    process.exit(1)
  })
}
```

- [ ] **Step 2: `tests/generate-keyword-map.test.ts` 업데이트**

전체 교체:

```ts
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
    title: partial.title ?? { ko: `제목 ${partial.slug}`, en: `Title ${partial.slug}` },
    summary: partial.summary ?? { ko: `요약 ${partial.slug}`, en: `Summary ${partial.slug}` },
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
    expect(map.get('b-tree')?.slug).toBe('p1')
    expect(map.get('kafka')?.slug).toBe('p2')
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
    expect(conflicts[0].keyword).toBe('b-tree')
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

  it('preserves bilingual title and summary on entries', () => {
    const { map } = buildMap([
      post({
        slug: 'p1',
        keywords: ['B-Tree'],
        title: { ko: 'B-Tree 구조', en: 'B-Tree Structure' },
        summary: { ko: '자료구조 설명', en: 'Data structure explanation' },
      }),
    ])
    expect(map.get('b-tree')).toEqual({
      slug: 'p1',
      title: { ko: 'B-Tree 구조', en: 'B-Tree Structure' },
      summary: { ko: '자료구조 설명', en: 'Data structure explanation' },
    })
  })

  it('treats case-variant keywords as conflicts', () => {
    const { conflicts } = buildMap([
      post({ slug: 'p1', keywords: ['B-Tree'] }),
      post({ slug: 'p2', keywords: ['b-tree'] }),
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].files).toHaveLength(2)
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
      ['B-Tree', { slug: 'b-tree', title: { ko: 'T1', en: 'T1e' }, summary: { ko: 'S1', en: 'S1e' } }],
      ['Kafka Consumer Group', { slug: 'kcg', title: { ko: 'T2', en: 'T2e' }, summary: { ko: 'S2', en: 'S2e' } }],
    ])
    const out = serializeMap(map)
    expect(out).toContain('export const KEYWORD_MAP')
    expect(out).toContain('export const KEYWORDS_BY_LENGTH')
    expect(out).toContain('export const SLUG_TO_ENTRY')
    expect(out).toContain('export interface BilingualText')
  })

  it('emits ko and en fields in each entry', () => {
    const map = new Map([
      ['B-Tree', { slug: 'b-tree', title: { ko: 'T1', en: 'T1e' }, summary: { ko: 'S1', en: 'S1e' } }],
    ])
    const out = serializeMap(map)
    expect(out).toMatch(/title: \{ ko: "T1", en: "T1e" \}/)
    expect(out).toMatch(/summary: \{ ko: "S1", en: "S1e" \}/)
  })

  it('sorts KEYWORDS_BY_LENGTH longest first', () => {
    const map = new Map([
      ['B-Tree', { slug: 'b-tree', title: { ko: 'T1', en: 'T1' }, summary: { ko: 'S1', en: 'S1' } }],
      ['Kafka Consumer Group', { slug: 'kcg', title: { ko: 'T2', en: 'T2' }, summary: { ko: 'S2', en: 'S2' } }],
      ['Kafka', { slug: 'kafka', title: { ko: 'T3', en: 'T3' }, summary: { ko: 'S3', en: 'S3' } }],
    ])
    const out = serializeMap(map)
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

- [ ] **Step 3: keyword-map 재생성 + 테스트**

Run: `pnpm generate-keyword-map`
Expected: `[keyword-map] generated 18 keywords from 9 posts` (또는 유사 메시지 — 실제 키워드 수에 맞춰).

Run: `pnpm vitest run tests/generate-keyword-map.test.ts`
Expected: PASS.

- [ ] **Step 4: 생성된 `lib/generated/keyword-map.ts` 검사**

Run: `head -20 lib/generated/keyword-map.ts`
Expected: `BilingualText` interface 정의 + `title: { ko: "...", en: "..." }` 형태.

- [ ] **Step 5: 커밋**

```bash
git add scripts/generate-keyword-map.ts tests/generate-keyword-map.test.ts lib/generated/keyword-map.ts
git commit -m "$(cat <<'EOF'
feat(keyword-map): serialize bilingual title/summary

parseBilingual reads nested frontmatter objects. serializeMap emits
{ ko, en } literal objects in KEYWORD_MAP and SLUG_TO_ENTRY. Tests
assert both bilingual branches are preserved.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `lib/client-post.ts` 타입 전파

**Files:**
- Modify: `lib/client-post.ts`

- [ ] **Step 1: `ClientPost` 인터페이스와 매핑 함수 수정**

전체 파일:

```ts
import type { Post } from '@/lib/posts'
import type { CategoryId } from '@/lib/categories'

export interface ClientPost {
  slug: string
  title: { ko: string; en: string }
  summary: { ko: string; en: string }
  tags: string[]
  keywords: string[]
  plainBody: string
  category: CategoryId
  date: string
}

export function toClientPost(post: Post): ClientPost {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    tags: post.tags,
    keywords: post.keywords,
    plainBody: post.plainBody,
    category: post.category,
    date: post.date,
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/client-post.ts
git commit -m "feat(client-post): propagate bilingual title/summary type

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: `app/posts/[slug]/page.tsx` + 신규 `PostTitle.tsx`

**Files:**
- Create: `components/blog/PostTitle.tsx`
- Modify: `app/posts/[slug]/page.tsx`

- [ ] **Step 1: `components/blog/PostTitle.tsx` 생성**

```tsx
'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'

interface PostTitleProps {
  title: { ko: string; en: string }
}

export function PostTitle({ title }: PostTitleProps) {
  const { lang } = useTranslation()
  return (
    <h1 className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.015em] md:text-[32px]">
      {title[lang]}
    </h1>
  )
}
```

- [ ] **Step 2: `app/posts/[slug]/page.tsx` 수정**

Top-of-file import 추가:

```tsx
import { PostTitle } from '@/components/blog/PostTitle'
```

`generateMetadata` 함수 내 4군데 `post.title` → `post.title.ko`, `post.summary` → `post.summary.ko`:

```tsx
return {
  title: post.title.ko,
  description: post.summary.ko,
  keywords: post.tags,
  openGraph: {
    type: 'article',
    title: post.title.ko,
    description: post.summary.ko,
    url,
    publishedTime: post.date,
  },
  twitter: {
    card: 'summary',
    title: post.title.ko,
    description: post.summary.ko,
  },
  alternates: {
    canonical: url,
  },
}
```

`PostPage`의 `<h1>` 블록 교체:

```tsx
// before
<h1 className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.015em] md:text-[32px]">
  {post.title}
</h1>
// after
<PostTitle title={post.title} />
```

- [ ] **Step 3: 커밋**

```bash
git add app/posts/[slug]/page.tsx components/blog/PostTitle.tsx
git commit -m "$(cat <<'EOF'
feat(post-page): PostTitle client leaf + ko-fixed SEO metadata

PostTitle reads lang from useTranslation and renders the active-
language h1. generateMetadata uses .ko on server for OG/Twitter
crawlers since server has no language context (spec defers hreflang).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: PostCard 3종 + CategoryNav + MobileOverlays

**Files:**
- Modify: `components/blog/PostCardEditorial.tsx`
- Modify: `components/blog/PostCardTimeline.tsx`
- Modify: `components/blog/PostCardFloating.tsx`
- Modify: `components/blog/CategoryNav.tsx`
- Modify: `components/blog/MobileOverlays.tsx`

All 5 files are already `'use client'` and already have `const { lang } = useTranslation()` (or will read it from Task 4's migration). Verify each file has the hook; if not, add.

- [ ] **Step 1: `PostCardEditorial.tsx` title/summary 교체**

2곳 교체:
- `{post.title}` → `{post.title[lang]}`
- `{post.summary}` → `{post.summary[lang]}`

- [ ] **Step 2: `PostCardTimeline.tsx` title/summary 교체**

동일 패턴. `{post.title}` → `{post.title[lang]}`, `{post.summary}` → `{post.summary[lang]}`.

- [ ] **Step 3: `PostCardFloating.tsx` title/summary 교체**

동일.

- [ ] **Step 4: `CategoryNav.tsx` title 교체**

파일 상단 import 있는지 확인:
```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'
```
없으면 추가. 컴포넌트 내 `const { lang } = useTranslation()` 있는지 확인 (Task 4 Category migration에서 추가됨).

`{post.title}` → `{post.title[lang]}`.

- [ ] **Step 5: `MobileOverlays.tsx` title/summary 교체**

파일 상단 import에 `useTranslation` 추가 (현재 없을 가능성):
```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'
```
컴포넌트 내 첫 줄에 `const { lang } = useTranslation()` 추가.

`{post.title}` → `{post.title[lang]}`, `{post.summary}` → `{post.summary[lang]}`.

- [ ] **Step 6: 커밋**

```bash
git add components/blog/PostCardEditorial.tsx components/blog/PostCardTimeline.tsx components/blog/PostCardFloating.tsx components/blog/CategoryNav.tsx components/blog/MobileOverlays.tsx
git commit -m "$(cat <<'EOF'
feat(cards): render post.title[lang] and post.summary[lang]

5 consumers switched from string access to lang-indexed access.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: KeywordLink + RelatedPost

**Files:**
- Modify: `components/blog/KeywordLink.tsx`
- Modify: `components/blog/RelatedPost.tsx`

- [ ] **Step 1: `KeywordLink.tsx` 팝오버 title/summary lang 반영**

파일 상단 import 추가:
```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'
```

컴포넌트 내 `const entry = SLUG_TO_ENTRY.get(slug)` 위에 `const { lang } = useTranslation()`.

팝오버 내 교체:
- `{entry.title}` → `{entry.title[lang]}`
- `{entry.summary}` → `{entry.summary[lang]}`

- [ ] **Step 2: `RelatedPost.tsx`를 client component로 전환**

파일 최상단에 `'use client'` 추가.

import에 추가:
```tsx
import { useTranslation } from '@/lib/i18n/useTranslation'
```

컴포넌트 내 `const entry = SLUG_TO_ENTRY.get(slug)` 위에 `const { lang } = useTranslation()`.

`{entry.title}` → `{entry.title[lang]}`, `{entry.summary}` → `{entry.summary[lang]}`.

- [ ] **Step 3: 커밋**

```bash
git add components/blog/KeywordLink.tsx components/blog/RelatedPost.tsx
git commit -m "$(cat <<'EOF'
feat(keyword-popover): use entry.title[lang] / entry.summary[lang]

RelatedPost transitions to client component to consume useTranslation.
Korean default labels (prerequisite/deep-dive/parallel) unchanged:
label i18n is out of scope for this PR.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: `BlogHomeClient` + `IndexCategoryNav` lang 전달

**Files:**
- Modify: `components/blog/BlogHomeClient.tsx`
- Modify: `components/blog/IndexCategoryNav.tsx`

- [ ] **Step 1: `BlogHomeClient.tsx` `applyFilters` 호출에 lang 전달**

`const { t } = useTranslation()` 선언을 `const { t, lang } = useTranslation()` 으로 변경 (기존 t만 destructure했던 줄).

`const filtered = useMemo(() => applyFilters(scopedPosts, { tag, sort }), [scopedPosts, tag, sort])` 호출 변경:

```tsx
const filtered = useMemo(
  () => applyFilters(scopedPosts, { tag, sort }, lang),
  [scopedPosts, tag, sort, lang],
)
```

- [ ] **Step 2: `IndexCategoryNav.tsx` `groupPostsByCategory` 호출에 lang 전달**

기존 `const { t, lang } = useTranslation()` 이 이미 있음 (Task 4에서 추가).

`const groups = useMemo(() => groupPostsByCategory(allPosts), [allPosts])` 호출 변경:

```tsx
const groups = useMemo(() => groupPostsByCategory(allPosts, lang), [allPosts, lang])
```

- [ ] **Step 3: type-check 실행**

Run: `pnpm type-check`
Expected: PASS (exit 0). 이 시점까지 모든 타입 에러 해소.

Pre-existing unrelated `components/mdx/tabs-utils.ts:62` TS2352 에러가 있다면 ignore — 본 PR과 무관.

- [ ] **Step 4: 커밋**

```bash
git add components/blog/BlogHomeClient.tsx components/blog/IndexCategoryNav.tsx
git commit -m "$(cat <<'EOF'
feat(index): pass lang to applyFilters and groupPostsByCategory

Restores type-check PASS after the schema migration chain.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: blog-writer 스킬 업데이트

**Files:**
- Modify: `.claude/skills/blog-writer/references/stage-3-mdx.md`
- Modify: `.claude/skills/blog-writer/references/stage-2-note.md`
- Modify: `.claude/skills/blog-writer/references/validation-loop.md`

- [ ] **Step 1: `stage-3-mdx.md` — frontmatter 템플릿 섹션 교체**

파일 내 frontmatter 템플릿 (`---`로 감싼 YAML 예시) 를 다음으로 교체:

```yaml
---
title:
  ko: "{한글 제목}"
  en: "{English Title}"
slug: "{kebab-case-slug}"
date: YYYY-MM-DD
tags:
  - {tag1}
  - {tag2}
keywords:
  - {keyword1}
  - {keyword2}
summary:
  ko: "{한글 요약 (10~300자)}"
  en: "{English summary (10~300 chars)}"
category: {category-id}
draft: false
---
```

- [ ] **Step 2: `stage-2-note.md` — 제목/요약 작성 가이드 섹션 추가**

적절한 위치 (기존 "제목" 관련 섹션 있으면 교체, 없으면 `## 노트 작성` 섹션 이후 새 섹션):

```markdown
## 제목 (`title.ko` / `title.en`)

- `title.en`: English-First. 기술 용어·제품명·학술 고유명사는 영문 그대로.
- `title.ko`: 선택 원칙
  - 통용 한글 번역 있음 → 한글 (예: "멱등성", "카디널리티", "퀵 정렬", "데이터베이스 인덱스")
  - 기술/학술 고유명사 → 영어 유지 (예: "B-Tree", "Full Table Scan", "Claude Code")
  - 학술 고유명사 + 맥락 필요 → 영어 + 한글 suffix (예: "Two Generals' Problem 소개")

## 요약 (`summary.ko` / `summary.en`)

- 동일 핵심 메시지를 각 언어로 자연스럽게 작성. 축약 재작성이 아니라 의미 보존 번역.
- 길이 10~300자 (양쪽 모두).
- em-dash `—` (U+2014) 사용 금지. `:` 또는 쉼표 또는 괄호로 대체.
- 한글 요약에서 영문 표기는 원문 보존 ("Full Table Scan", "B+Tree" 등).
```

- [ ] **Step 3: `validation-loop.md` — 체크리스트 항목 추가**

기존 체크리스트 ("frontmatter 검증" 또는 유사) 섹션에 추가:

```markdown
- [ ] `title`이 `{ ko, en }` object 형태인가 (flat string 아님)
- [ ] `title.ko`와 `title.en` 둘 다 존재하는가 (한쪽 누락 시 Velite 빌드 실패)
- [ ] `summary`가 `{ ko, en }` object 형태인가
- [ ] `summary.ko`와 `summary.en` 둘 다 10~300자인가
- [ ] 두 요약이 동일 의미를 전달하는가 (재작성 아닌 번역)
- [ ] 어느 필드도 em-dash `—` (U+2014) 포함하지 않는가
```

- [ ] **Step 4: 커밋**

```bash
git add .claude/skills/blog-writer/references/stage-3-mdx.md .claude/skills/blog-writer/references/stage-2-note.md .claude/skills/blog-writer/references/validation-loop.md
git commit -m "$(cat <<'EOF'
skill(blog-writer): bilingualize frontmatter template and checks

stage-3-mdx.md: nested { ko, en } title/summary.
stage-2-note.md: selection principle for ko translation.
validation-loop.md: checklist items for nested frontmatter.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: CLAUDE.md + memory 업데이트

**Files:**
- Modify: `/Users/ing9990/.claude/projects/-Users-ing9990-Document-backend-notes/memory/feedback-english-naming.md`
- Modify: `/Users/ing9990/.claude/projects/-Users-ing9990-Document-backend-notes/memory/MEMORY.md`
- Create: `/Users/ing9990/.claude/projects/-Users-ing9990-Document-backend-notes/memory/project-title-bilingualization.md`

- [ ] **Step 1: `feedback-english-naming.md` 내용 재기술**

현재 규칙을 이중 구조에 맞게 확장한 형태로 교체:

```markdown
---
name: Bilingual title/summary naming
description: title/summary are { ko, en } objects; title.en is English-First, title.ko follows the selection principle (translate when Korean term is established, keep English when it is not)
type: feedback
---

포스트 frontmatter의 `title`과 `summary`는 `{ ko, en }` nested object다.

`title.en` — English-First. 기술 용어·학술 용어·제품명은 원문 영어. 기존 "제목 English-First" 규칙이 이 필드에 적용된다.

`title.ko` — 선택 원칙:
- 통용 한글 번역 존재 → 한글: 멱등성, 카디널리티, 퀵 정렬, 데이터베이스 인덱스 등
- 학술·기술 고유명사 → 영어 유지: B-Tree, Full Table Scan, Claude Code, Tabs Sandbox
- 학술 고유명사지만 한글 맥락 필요 → 영어 + 한글 suffix: "Two Generals' Problem 소개"

`summary.ko` / `summary.en` — 동일 의미의 번역 관계, 재작성 아님.

**Why:** 한국어·영어 방문자 모두에 제목이 읽히려면 선택 구조가 필요. "두 장군 문제"처럼 일반화된 번역이 없는 학술 고유명사는 오히려 원문 유지가 자연스럽다.

**How to apply:** 새 글 frontmatter 작성 시 nested `{ ko, en }` 필수. blog-writer 스킬이 stage-3-mdx 단계에서 이 구조로 강제. 본문 기술명 한글 병기 금지 규칙은 그대로 유지.
```

- [ ] **Step 2: 신규 memory `project-title-bilingualization.md` 작성**

```markdown
---
name: Post title/summary bilingualization (2026-04-18)
description: Frontmatter title/summary become { ko, en } nested; default language switched to 'ko'; body MDX/URL/hreflang deferred.
type: project
---

2026-04-18 기준 post frontmatter `title`과 `summary`가 nested `{ ko, en }` 구조로 전환. 10개 기존 포스트 마이그레이션. 기본 언어 `'en'` → `'ko'`.

**Why:** 한국어 방문자 다수에게 첫 paint부터 한국어. 영어 메타 노출은 토글로.

**How to apply:**
- 새 글 frontmatter는 반드시 `title: { ko, en }` + `summary: { ko, en }` 객체.
- `post.title[lang]`, `post.summary[lang]` 접근 패턴.
- `generateMetadata`는 서버 렌더 시 `.ko` 고정 (SEO 크롤러 관점 한국어).
- 본문 MDX / URL 분리 / hreflang / sitemap 이중은 **후속 PR** 담당.
- blog-writer 스킬과 `feedback-english-naming` memory가 이 구조에 맞게 업데이트됨.
```

- [ ] **Step 3: `MEMORY.md` 인덱스에 신규 메모리 링크 추가**

기존 `MEMORY.md`의 적절한 섹션에 한 줄 추가:

```markdown
- [포스트 제목 이중화](project-title-bilingualization.md): frontmatter title/summary `{ko,en}`, 기본 언어 ko (2026-04-18)
```

- [ ] **Step 4: 프로젝트 `CLAUDE.md` 업데이트 (필요시)**

`CLAUDE.md`를 열어 다음 내용이 반영되었는지 확인. 필요하면 기존 섹션 수정:

- § 5 "금지 사항"에 "title/summary를 string으로 접근 금지 (항상 `[lang]`)" 항목 추가 또는
- § 6 "변경 금지 결정 (비자명 불변식)" 섹션 하위에 "Frontmatter title/summary는 `{ ko, en }` nested object" 항목 추가

구체 문구:

```markdown
- **Frontmatter `title`/`summary`는 `{ ko, en }` nested object**. 사용처는 `post.title[lang]` / `post.summary[lang]` 접근. Server Component가 lang 없이 렌더하는 곳(`generateMetadata` 등)은 `.ko` 고정 (서버 언어 결정 인프라 없음, hreflang은 후속 PR).
```

- [ ] **Step 5: 커밋**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude): add bilingual title/summary invariant

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Memory 파일은 git 추적 대상 아님 (`~/.claude/projects/...`). 별도 커밋 불필요.

---

## Task 16: 통합 검증

**Files:** (변경 없음: 검증만)

- [ ] **Step 1: 전체 파이프라인**

Run:
```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
```
Expected: 모두 exit 0. 테스트는 총 143개 기존 + 추가된 i18n/filters 테스트 PASS.

실패 시 해당 task로 돌아가 확인. Pre-existing `components/mdx/tabs-utils.ts:62` 에러만 남으면 본 PR 범위 밖 (무시 가능).

- [ ] **Step 2: keyword-map 무결성**

Run: `head -5 lib/generated/keyword-map.ts`
Expected: `export interface BilingualText` 선언이 보임.

Run: `grep -c 'title: { ko:' lib/generated/keyword-map.ts`
Expected: 0 이상 (entries 개수만큼).

- [ ] **Step 3: dev 서버 수동 QA**

Dev 서버 재시작:
```bash
lsof -nP -iTCP:3010 -sTCP:LISTEN -t | xargs -r kill
sleep 2
PORT=3010 pnpm dev  # 백그라운드로
```

브라우저 `http://blog.localhost:3010/` 방문:

1. **localStorage 초기화 후 재방문 → 한국어가 기본**
   - 헤더/인덱스/카드 제목이 한국어 (예: "멱등성", "데이터베이스 인덱스", "카디널리티")
   - 카드 요약도 한국어

2. **설정 > 언어 > 영어 토글**
   - 카드 제목·카드 요약·상세 페이지 h1·카테고리 네비·최근 글 heading 모두 즉시 영어로 전환
   - 일부 제목은 `B-Tree`/`Full Table Scan`/`Claude Code`처럼 한글 모드에서도 영어 (의도)
   - `Two Generals' Problem`은 영어 모드 "Two Generals' Problem", 한글 모드 "Two Generals' Problem 소개"

3. **다시 한국어로 → 복귀**

4. **포스트 상세 페이지 `/posts/idempotency`**
   - h1이 언어 토글에 따라 바뀜 (PostTitle client leaf 동작)
   - 브라우저 탭 title은 SSR 고정 (ko) — 토글해도 안 바뀜 (scope 제외)

5. **검색**
   - 한글 `멱등` → `멱등성` 포스트 매칭
   - 영어 `Idempotency` → 동일 포스트 매칭
   - 영어 `Quick` → `퀵 정렬` 포스트 매칭
   - 한글 `정렬` → 동일 매칭

6. **정렬 '제목순'**
   - 한국어 모드와 영어 모드에서 순서가 달라지는지 (예: 한글 모드 "B-Tree"가 "카디널리티" 뒤에 위치, 영어 모드 "B-Tree"가 알파벳 순 앞에 위치)

7. **카테고리 네비**
   - `Database` 카테고리 클릭 → 해당 카테고리 포스트 목록
   - 각 포스트 제목이 lang에 맞춰 표시

8. **`KeywordLink` 팝오버**
   - 본문에서 auto-link된 키워드 (예: "B-Tree", "카디널리티") hover
   - 팝오버의 title/summary가 lang에 따라 전환

9. **`RelatedPost` 컴포넌트** (본문 중 `<RelatedPost slug="..." />` 쓰는 포스트 있으면)
   - entry.title/summary 언어 반영

10. **라이트/다크 × 언어 교차** — 각각 독립 작동

11. **모바일 375px (DevTools)** — `MobileOverlays` 검색 결과 언어 반영

- [ ] **Step 4: localStorage persistence**

DevTools Console:
```js
localStorage.getItem('deep-settings')
```
현재 언어 설정 확인. 새로고침 후 언어 유지.

`localStorage.removeItem('deep-settings')` 후 새로고침 → 한국어(기본)로 복귀.

- [ ] **Step 5: 최종 커밋 (검증 노트)**

수동 QA가 모두 통과하고 수정이 발생하지 않았다면 추가 커밋 불필요. 수정이 있으면 개별 task로 돌아가 재커밋.

---

## 성공 기준

모두 PASS해야 함:
- `pnpm type-check` (Task 13 시점)
- `pnpm lint` (Task 16)
- `pnpm test` (Task 16) — 143+ tests
- `pnpm build` (Task 16)
- 수동 QA 9개 시나리오 (Task 16)

`components/mdx/tabs-utils.ts:62` pre-existing 에러는 본 PR 범위 밖.
