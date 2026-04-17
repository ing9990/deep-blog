# 포스트 제목/요약 이중화 + 기본 언어 'ko' 변경

**Date**: 2026-04-18
**Status**: Approved
**Related**: `docs/superpowers/specs/2026-04-18-language-settings.md` (토글 인프라)

## 1. 목표

포스트 frontmatter의 `title`과 `summary`를 한국어/영어 이중 구조(`{ ko, en }`)로 변경한다. 10개 기존 포스트를 번역하여 마이그레이션한다. 기본 언어를 `en` → `ko`로 전환한다. 본문 MDX / URL / SEO hreflang은 **후속 PR**이다.

## 2. 결정 요약

| 항목 | 결정 | 이유 |
|---|---|---|
| Scope | `title` + `summary`만 이중화 | 본문 번역은 별도 PR. URL/SEO는 영어 본문이 생기는 시점에 |
| 스키마 | Nested `{ ko, en }` | `CategoryMeta.label[lang]`과 일관 |
| 필수화 | Required | 10개 포스트 한 번에 마이그레이션, fallback 불필요 |
| 기본 언어 | `'ko'` | 한국어 중심 블로그, 한국어 방문자가 다수 |
| 번역 주체 | Claude 초안, 사용자 검토 | "간단한 작업" 원칙 충족 |
| 번역 방침 | 선택 원칙 (통용 번역 있으면 한글, 없으면 영어 유지) | 학술 고유명사(Two Generals' Problem) 부자연스러운 번역 회피 |
| 스킬 | blog-writer 동시 업데이트 | 새 글 작성 시 즉시 올바른 형태 |

## 3. Frontmatter 스키마 변경

`velite.config.ts`의 `postFrontmatterShape`:

```ts
const postFrontmatterShape = s.object({
  title: s.object({
    ko: s.string().min(1).max(120),
    en: s.string().min(1).max(120),
  }),
  slug: s.string().min(3).max(200).regex(slugRegex, '...'),
  date: s.isodate(),
  updatedAt: s.isodate().optional(),
  tags: s.array(...).min(1).max(5),
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

**기존 테스트 (`tests/velite-build.test.ts`):**
- 픽스처 문자열 title/summary → nested object로 업데이트
- 추가 케이스: `ko`만 있고 `en` 누락 시 schema validation FAIL 확인
- 둘 다 있어야 통과 확인

## 4. 기본 언어 `'ko'` 변경

`components/providers/SettingsProvider.tsx`:

```ts
const DEFAULT_SETTINGS: Settings = {
  cardLayout: 'timeline',
  language: 'ko',   // 'en' → 'ko'
}

function normalizeLanguage(value: unknown): Language {
  return value === 'ko' || value === 'en' ? value : 'ko'   // fallback 도 'ko'
}
```

**영향:**
- localStorage 값 없는 첫 방문자: 한국어 UI + 한국어 제목/요약
- 기존 영어 저장자: 그대로 영어 유지
- SSR 메타 (`generateMetadata`): 빌드 시 기본값 사용 → OG/Twitter가 한국어로 크롤됨
- 이전 PR spec의 "기본값 English" 결정을 이 spec에서 override

## 5. Post 타입 + 사용처 마이그레이션

### 5.1 Post 타입

Velite가 스키마에서 자동 파생:

```ts
type Post = {
  title: { ko: string; en: string }
  summary: { ko: string; en: string }
  // 나머지 필드 변경 없음
}
```

### 5.2 사용처

| 파일 | 위치 | 처리 |
|---|---|---|
| `app/posts/[slug]/page.tsx` | h1 렌더링 | **`<PostTitle>` client leaf 분리**: useTranslation 기반 |
| `app/posts/[slug]/page.tsx` | `generateMetadata` | 빌드 시 기본값(`'ko'`) 사용. `post.title.ko` / `post.summary.ko` |
| `components/blog/PostCard{Editorial,Timeline,Floating}.tsx` | 카드 title/summary | `post.title[lang]`, `post.summary[lang]`: 이미 client |
| `components/blog/CategoryNav.tsx` | 포스트 목록 | `post.title[lang]` |
| `components/blog/MobileOverlays.tsx` | 모바일 검색 결과 | `post.title[lang]`, `post.summary[lang]` |
| `components/blog/KeywordLink.tsx` | 팝오버 | `entry.title[lang]`, `entry.summary[lang]` |
| `components/blog/RelatedPost.tsx` | 관련글 카드 | `entry.title[lang]`, `entry.summary[lang]` |
| `lib/filters.ts:35-36` | 검색 매칭 | **양쪽 언어 모두 매칭** (`title.ko`/`title.en` + `summary.ko`/`summary.en` 전부 토큰 검사) |
| `lib/filters.ts:61` | `sortPosts('title')` | `sortPosts(posts, key, lang)` 시그니처 확장 → `title[lang]` 기준 |
| `lib/categories.ts:99` | `groupPostsByCategory` 타이브레이크 | `groupPostsByCategory(posts, lang)` 시그니처 확장 → `a.title[lang].localeCompare(b.title[lang], lang)` |
| `lib/client-post.ts:18-19` | 클라이언트 전달 | 타입 자동 전파 (Post 파생) |
| `scripts/generate-keyword-map.ts` | 빌드 산출물 | **`{ ko, en }` 객체 그대로 직렬화** → 런타임에서 `[lang]` 선택 |
| `tests/posts.test.ts`, `tests/filters.test.ts`, `tests/generate-keyword-map.test.ts` | 픽스처 | nested 구조로 업데이트 |

### 5.3 Server/Client 경계

- `app/posts/[slug]/page.tsx`는 Server Component 유지 (generateStaticParams + generateMetadata가 server 의존).
- **신규 `components/blog/PostTitle.tsx`** client leaf:
  ```tsx
  'use client'
  import { useTranslation } from '@/lib/i18n/useTranslation'
  export function PostTitle({ post }: { post: { title: { ko: string; en: string } } }) {
    const { lang } = useTranslation()
    return (
      <h1 className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.015em] md:text-[32px]">
        {post.title[lang]}
      </h1>
    )
  }
  ```
- page.tsx에서 `<PostTitle post={post} />`로 교체. article 구조, PostMeta, MDXContent 본문은 server 유지.

### 5.4 `generateMetadata` 전략

Server-side에서 언어 결정 없음 → `en` 기본값 사용 대신 **`ko` 기본값**(spec §4의 결정과 일관):

```ts
return {
  title: post.title.ko,
  description: post.summary.ko,
  openGraph: {
    title: post.title.ko,
    description: post.summary.ko,
    // ...
  },
  twitter: {
    title: post.title.ko,
    description: post.summary.ko,
  },
  alternates: {
    canonical: url,
  },
}
```

영어 메타는 클라이언트 hydrate 후 `<title>` element가 `<PostTitle>`의 lang에 따라 바뀌지는 **않음**. `document.title`을 수동 갱신하는 로직은 이번 scope에 포함하지 않음 (URL 분리 + hreflang이 있는 후속 PR에서 적절한 언어별 canonical로 해결).

### 5.5 `sortPosts` 시그니처

`lib/filters.ts`:

```ts
import type { Language } from '@/components/providers/SettingsProvider'

export function sortPosts<T extends { title: { ko: string; en: string }; date: string }>(
  posts: readonly T[],
  key: SortKey,
  lang: Language,
): T[] {
  const out = posts.slice()
  if (key === 'latest') return out.sort((a, b) => b.date.localeCompare(a.date))
  if (key === 'oldest') return out.sort((a, b) => a.date.localeCompare(b.date))
  // title: lang-aware collator (module-level koCollator replaced for lang support)
  const collator = new Intl.Collator(lang, { sensitivity: 'base' })
  return out.sort((a, b) => collator.compare(a.title[lang], b.title[lang]))
}
```

호출부 `BlogHomeClient.tsx`에서 `useTranslation().lang`를 `applyFilters` 경유로 전달.

### 5.6 검색 매칭

`lib/filters.ts:applyFilters`의 텍스트 매칭을 양쪽 언어 대상으로:

```ts
// before: if (p.title.toLowerCase().includes(q)) return true
//         if (p.summary.toLowerCase().includes(q)) return true
// after:
if (p.title.ko.toLowerCase().includes(q)) return true
if (p.title.en.toLowerCase().includes(q)) return true
if (p.summary.ko.toLowerCase().includes(q)) return true
if (p.summary.en.toLowerCase().includes(q)) return true
```

사용자가 한국어 쿼리로 검색해도 영어 포스트 매칭, 역도 성립.

### 5.7 `groupPostsByCategory`

`lib/categories.ts`:

```ts
export function groupPostsByCategory<T extends { category: CategoryId; date: string; title: { ko: string; en: string } }>(
  posts: readonly T[],
  lang: Language,
): CategoryGroup<T>[] {
  // ...
  const sorted = list.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.title[lang].localeCompare(b.title[lang], lang)
  })
  // ...
}
```

호출부 `components/blog/IndexCategoryNav.tsx`에서 `groupPostsByCategory(allPosts, lang)` 전달.

## 6. 10개 포스트 번역 매핑

### 6.1 제목

| slug | `title.en` | `title.ko` |
|---|---|---|
| b-tree-structure | B-Tree | B-Tree |
| cardinality | Cardinality | 카디널리티 |
| claude-code-primer | Claude Code | Claude Code |
| database-index-deep-dive | Database Index | 데이터베이스 인덱스 |
| full-table-scan | Full Table Scan | Full Table Scan |
| idempotency | Idempotency | 멱등성 |
| jvm-gc-intro | JVM Garbage Collection | JVM 가비지 컬렉션 |
| quick-sort | Quick Sort | 퀵 정렬 |
| tabs-sandbox | Tabs Sandbox | Tabs Sandbox |
| two-generals-problem | Two Generals' Problem | Two Generals' Problem 소개 |

**근거:**
- 통용 한글 표현 있음 → 한글: cardinality, database-index-deep-dive, idempotency, jvm-gc-intro, quick-sort
- 기술/학술 고유명사 → 영어 유지: b-tree-structure, claude-code-primer, full-table-scan, tabs-sandbox
- 학술 고유명사지만 맥락 필요 → 영어 + 한글 suffix: two-generals-problem

### 6.2 요약

아래 표의 `summary.ko`는 기존 frontmatter에서 가져오고, `summary.en`은 Claude의 번역 초안.

| slug | 언어 | 요약 |
|---|---|---|
| b-tree-structure | ko | B-Tree가 왜 디스크 기반 시스템의 표준 자료구조가 되었는지 이해하고, 탐색·삽입·분할의 내부 동작 원리와 B+Tree·해시 인덱스와의 트레이드오프를 구분할 수 있습니다. |
| | en | Why B-Tree became the standard data structure for disk-based systems. Covers search, insert, and split mechanics, plus how it trades off against B+Tree and hash indexes. |
| cardinality | ko | 카디널리티가 무엇인지 이해하고, 높은/낮은 카디널리티가 인덱스·캐시·파티셔닝 등 다양한 영역에서 어떤 영향을 주는지 판단하는 기준을 얻습니다. |
| | en | What cardinality means, and how high vs low cardinality shapes decisions across indexing, caching, and partitioning. |
| claude-code-primer | ko | Claude Code가 일반 챗봇과 무엇이 다른지 이해하고, 네 가지 확장 축(CLAUDE.md·Skills·Agents·Plugins)의 설계 원리와 트레이드오프를 구분할 수 있습니다. 설치부터 실무 시나리오까지 한 글로 정리합니다. |
| | en | What sets Claude Code apart from a general chatbot, and how its four extension surfaces (CLAUDE.md, Skills, Agents, Plugins) trade off. Covers setup through real-world scenarios in one post. |
| database-index-deep-dive | ko | B+Tree 기반 인덱스의 내부 동작 원리를 이해하고, 복합 인덱스의 리프 노드 배치부터 등호 먼저·정렬 마지막 원칙, 인덱스 개수 결정까지 실전 설계 기준을 얻습니다. |
| | en | How B+Tree-based indexes work under the hood, from composite-index leaf layout to the equality-first/sort-last rule and deciding how many indexes to add. |
| full-table-scan | ko | Full Table Scan이 언제 문제이고 언제 정상인지 구분할 수 있습니다. 옵티마이저가 인덱스 대신 Full Table Scan을 선택하는 이유와 Sequential I/O vs Random I/O 트레이드오프를 이해합니다. |
| | en | When a full table scan is a problem and when it is not. Why the optimizer sometimes prefers a scan over an index, and how Sequential I/O vs Random I/O drives that choice. |
| idempotency | ko | 같은 요청을 여러 번 보내도 한 번 보낸 것과 동일한 결과를 보장하는 멱등성이 왜 필요하고 어떻게 구현되는지 이해합니다. HTTP 메서드 의미론부터 Idempotency-Key 패턴, 자연 멱등 설계까지의 내부 동작을 정리합니다. |
| | en | Why idempotency matters and how it is implemented: delivering the same request N times should leave the system in the same final state as a single delivery. Covers HTTP method semantics, the Idempotency-Key pattern, and naturally idempotent design. |
| jvm-gc-intro | ko | JVM GC가 왜 필요하고, 힙 구조와 세대별 수거가 어떻게 동작하며, 알고리즘별 트레이드오프를 판단하는 기준을 얻습니다. |
| | en | Why JVM GC exists, how the heap is structured, how generational collection works, and the tradeoffs between the major algorithms. |
| quick-sort | ko | 분할 정복 기반의 대표적인 비교 정렬 알고리즘인 Quick Sort의 동작 원리, 구현, 시간 복잡도, 주의사항을 한 페이지에 정리합니다. 이 글은 Backend Notes의 모든 MDX 문법 스타일 가이드를 겸합니다. |
| | en | Quick Sort, the classic divide-and-conquer comparison sort, covered end to end: mechanics, implementation, time complexity, and pitfalls. Doubles as the MDX syntax style guide for this blog. |
| tabs-sandbox | ko | MDX `<Tabs>` 컴포넌트의 회귀 검증 참고 글. 미배포. 그룹 동기화, 독립 모드, 혼합 콘텐츠, 긴 라벨을 다룹니다. |
| | en | Regression reference for the <Tabs> MDX component. Not published. Covers group sync, independent mode, mixed content, and long labels. |
| two-generals-problem | ko | 비신뢰 채널 위에서 두 당사자가 확정적 합의에 도달하는 것이 왜 불가능한지 이해하고, 현대 분산 시스템이 이 불가능성과 어떻게 타협하는지 구분할 수 있습니다. At-least-once와 멱등성이 표준이 된 근본 이유를 설명합니다. |
| | en | Why two parties cannot reach certain agreement over an unreliable channel, and how modern distributed systems live with that impossibility. Explains the foundational reason at-least-once delivery and idempotency became the norm. |

모든 en 요약은 기존 ko 요약의 의미를 보존하고, 300자 이하(schema 제약) 유지. 사용자 검토 후 수정 가능.

## 7. blog-writer 스킬 업데이트

### 7.1 `.claude/skills/blog-writer/references/stage-3-mdx.md`

frontmatter 템플릿을 다음으로 교체:

```yaml
---
title:
  ko: "{한글 제목: 통용 번역 있으면 한글, 없으면 영어 유지}"
  en: "{English Title: 기존 영어 네이밍 규칙}"
slug: "{kebab-case-slug}"
date: YYYY-MM-DD
tags:
  - {tag1}
  - {tag2}
keywords:
  - {keyword1}
  - {keyword2}
summary:
  ko: "{한글 요약: 10~300자}"
  en: "{English summary: 10~300 chars, 동일 의미}"
category: {category-id}
draft: false
---
```

### 7.2 `.claude/skills/blog-writer/references/stage-2-note.md`

제목/요약 작성 가이드 섹션 추가:

```markdown
## 제목 (ko/en 이중)

- `title.en`: English-First. 기술 용어는 영어 표기 그대로.
- `title.ko`: 선택 원칙 적용
  - 통용 한글 번역 있음 → 한글 (예: "멱등성", "카디널리티", "퀵 정렬")
  - 기술/학술 고유명사 → 영어 유지 (예: "B-Tree", "Full Table Scan")
  - 학술 고유명사 + 맥락 필요 → 영어 + 한글 suffix (예: "Two Generals' Problem 소개")

## 요약 (ko/en 이중)

- 동일 핵심 메시지를 각 언어로 자연스럽게 작성
- 길이 10~300자 (양쪽 모두)
- em-dash (U+2014) 금지 (CLAUDE.md 규칙)
- 두 요약이 번역 관계지만, 축약 재작성이 아니라 의미 보존 번역
```

### 7.3 `.claude/skills/blog-writer/references/validation-loop.md`

frontmatter 검증 체크리스트에 추가:

```markdown
- [ ] `title`이 `{ ko, en }` object 형태인가
- [ ] `title.ko`와 `title.en` 둘 다 있는가 (한쪽 누락 시 빌드 실패)
- [ ] `summary`가 `{ ko, en }` object 형태인가
- [ ] `summary.ko`와 `summary.en` 둘 다 10~300자인가
- [ ] 두 언어 요약이 동일 의미를 전달하는가
```

### 7.4 CLAUDE.md / memory 업데이트

- `MEMORY.md`의 `feedback-english-naming.md` 링크 유지. 해당 메모리 파일 내부를 이중 구조에 맞게 재기술:
  - "제목 English-First" → "`title.en`은 English-First, `title.ko`는 선택 원칙"
  - 본문 기술명 한글 병기 금지 규칙은 그대로
- 이번 spec 자체를 memory에 project 타입으로 추가 (title/summary 이중 구조 + 기본 언어 ko 결정 기록)

## 8. Fallback · 엣지 케이스

- **스키마 누락** → Velite 빌드 실패. 런타임 fallback 불필요.
- **타입 보장** → `post.title[lang]`가 항상 string.
- **`scripts/generate-keyword-map.ts`** → title/summary 객체 그대로 `keyword-map.ts`에 직렬화. 타입은 `{ slug; title: { ko; en }; summary: { ko; en } }`.
- **prerender 언어** → 기본 언어 `ko`로 빌드. 클라이언트 토글은 DOM 내용만 갱신 (h1, 카드, 카테고리 네비 등).
- **검색 쿼리** → 한국어 `검색어`도 영어 `search term`도 양쪽 언어 매칭. 입력 언어와 포스트 언어가 달라도 찾아짐.
- **localStorage 호환** → 기존 저장된 `{ cardLayout, language }` 구조 불변. `language: 'en'` 저장값은 그대로 유지.

## 9. 테스트 전략

**유닛 (vitest):**
- `tests/velite-build.test.ts`: `postFrontmatterShape`가 nested `{ ko, en }` 요구, 한쪽 누락 reject, 둘 다 제공 통과.
- `tests/filters.test.ts`: 픽스처 nested 구조로 업데이트. `sortPosts('title', lang)` 정렬, `applyFilters` 양쪽 언어 검색.
- `tests/generate-keyword-map.test.ts`: 픽스처 업데이트, keyword-map 산출물이 object 그대로 저장되는지.
- `tests/posts.test.ts`: `getPostBySlug` 타입 체크.

**수동 (dev 서버 `http://blog.localhost:3010/`):**
1. localStorage 초기화 → 첫 paint에 한국어 제목/요약 표시.
2. 설정 > 언어 > 영어 선택 → 인덱스 카드·포스트 상세 h1·카테고리 네비 모두 영어로 즉시 전환.
3. 다시 한국어로 → 한국어 복귀.
4. 새로고침 → persist 확인.
5. 검색:
   - 영어 쿼리 (`idempotency`) → 멱등성 포스트 매칭
   - 한국어 쿼리 (`멱등성`) → 동일 포스트 매칭
6. 정렬 '제목순' → 언어에 따라 순서 변경 확인 (예: 한국어 모드에서는 '데이터베이스 인덱스'가 'D'와 다른 자리).
7. 포스트 상세 페이지 `/posts/idempotency`:
   - h1이 언어 토글에 따라 바뀜
   - OG/Twitter 메타는 빌드 시 고정 (ko)
   - 브라우저 탭 title은 SSR 고정 (ko), 토글해도 안 바뀜 (이번 scope 제외)
8. `/tags/Backend`: 포스트 목록 제목 언어 반영
9. 카테고리 네비에서 포스트 목록: `title[lang]` 표시
10. `KeywordLink` 팝오버: 호버 시 `title[lang]`/`summary[lang]` 표시
11. 라이트/다크 × 언어 교차: 독립 동작
12. 모바일 375px: `MobileOverlays` 검색 결과 언어 반영

## 10. 예상 파일 구조

**수정:**
- `velite.config.ts`: 스키마 nested
- `components/providers/SettingsProvider.tsx`: 기본 `'ko'`, normalize fallback `'ko'`
- `lib/filters.ts`: `sortPosts(posts, key, lang)`, 검색 양쪽 언어
- `lib/categories.ts`: `groupPostsByCategory(posts, lang)`
- `lib/client-post.ts`: 타입 자동 전파 (코드 변경 없을 수도 있음)
- `scripts/generate-keyword-map.ts`: title/summary 객체 전달
- `app/posts/[slug]/page.tsx`: `<PostTitle>` client leaf, `generateMetadata` `.ko` 고정
- `components/blog/PostCardEditorial.tsx`, `PostCardTimeline.tsx`, `PostCardFloating.tsx`: `[lang]`
- `components/blog/CategoryNav.tsx`, `MobileOverlays.tsx`, `KeywordLink.tsx`, `RelatedPost.tsx`: `[lang]`
- `components/blog/BlogHomeClient.tsx`: `applyFilters`에 lang 전달
- `components/blog/IndexCategoryNav.tsx`: `groupPostsByCategory(posts, lang)` 전달
- `content/posts/*.mdx` (10개): frontmatter title/summary 마이그레이션
- `.claude/skills/blog-writer/references/stage-3-mdx.md`, `stage-2-note.md`, `validation-loop.md`
- `CLAUDE.md`, `MEMORY.md` + `feedback-english-naming.md`

**신규:**
- `components/blog/PostTitle.tsx`: client leaf for post detail h1

**테스트 수정:**
- `tests/velite-build.test.ts`, `tests/filters.test.ts`, `tests/generate-keyword-map.test.ts`, `tests/posts.test.ts`

## 11. 제외 사항 (향후 PR)

- MDX 본문 이중화 (`*.ko.mdx` vs 단일 파일 분기 전략 결정 포함)
- URL 분리 (`/en/posts/slug`, `/ko/posts/slug`) + `next-intl` 또는 라우팅 재편
- `hreflang` / sitemap 이중 / `alternates.languages`
- `document.title` 클라이언트 갱신 (언어 토글 시 탭 title 바뀜): URL 분리와 묶어 처리
- 본문 내 기술 용어 `"Backend Notes"` → `"DEEP"` 정리 (별건)
- 블로그 전체에서 "Backend Notes" / "DEEP" 명칭 혼재 정리 (별건)
