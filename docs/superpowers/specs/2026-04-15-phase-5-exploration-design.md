# Phase 5 — 탐색 기능 (Exploration) 디자인 명세

**작성일**: 2026-04-15
**대상 단계**: Phase 5
**선행 조건**: Phase 1~4.1 완료 (`phase-4-1-complete` 태그)
**관련 CLAUDE.md 섹션**: §4 (콘텐츠 작성), §6.1/§6.2 (페이지 상세), §12 (작업 우선순위)

---

## 1. 배경 및 목표

### 1.1 배경

Phase 1~4.1에서 블로그의 콘텐츠 파이프라인(§13), 디자인 시스템(§14), 키워드 자동 링크(§15), 시각화 프레임워크(§16), 스타일 폴리시(§17)를 구축했다. 현재 인덱스 페이지의 검색은 `lib/filters.ts`의 단순 substring 매칭으로, **본문 콘텐츠는 대상이 아니다**(title/summary/tags/keywords만). 글 상세 페이지에는 관련 글 자동 추천이 없고, `<RelatedPost />` 컴포넌트는 MDX에서 수동 배치만 가능하다. `/tags/[tag]` 전용 페이지도 없어 태그 기반 탐색은 인덱스의 필터 칩 토글로만 가능하다.

Phase 5는 이 3가지 탐색 경로를 보강한다: **본문 전문 검색**, **글 하단 최근 글 섹션**, **태그 전용 페이지**.

### 1.2 목표

1. **FlexSearch 전문 검색**: 본문을 포함한 모든 글 텍스트를 대상으로 랭킹/fuzzy 검색. fetch-on-demand로 초기 페이지 로드 영향 최소화.
2. **최근 글 섹션**: 글 상세 페이지 하단에 "최근 글 4개"를 자동 렌더. 알고리즘 기반 추천이 아닌 **단순 최신순**.
3. **태그 전용 페이지**: `/tags/[tag]` SSG 라우트. 해당 태그의 모든 글을 최신순으로 나열.

### 1.3 Scope에서 제외 (YAGNI)

- **알고리즘 기반 관련 글 추천** — 사용자의 명시적 결정: "태그/키워드 매칭까지 갈 것 없이 최근 글 순서면 됨". 주제 기반 교차 링크는 기존 수동 `<RelatedPost />`로 충분.
- **시리즈 탐색 UI** — 현재 글 5개 중 `series` 필드 사용 글 없음. 시리즈가 실제로 등장할 때 Phase 6 이후 폴리시로 추가.
- **태그 페이지 내부 검색/정렬** — 인덱스 페이지로 돌아가면 된다. YAGNI.
- **태그 메타데이터 (설명문, 아이콘)** — 태그 수가 아직 적고 의미는 태그 이름 자체로 충분.
- **Body content의 token-level 가중치** — FlexSearch 기본 설정으로 시작. 정확도 이슈 발생 시 Phase 6에서 custom tokenizer 검토.

---

## 2. 주요 결정 사항

### 2.1 검색 대상: 본문 포함

현재 substring 검색은 메타데이터만 대상인데, 블로그가 개인 지식 베이스로 성장하면 "본문에서 이 표현 어느 글에 썼지?" 수준의 검색이 핵심 가치가 된다. 5~100개 글 규모에서 본문 인덱스 크기(~100KB~1MB)는 로컬 환경에서 부담 없다. 메타데이터만 검색하는 현재 구현은 placeholder이고, 본문 검색으로 업그레이드가 본질적 개선이다.

### 2.2 FlexSearch 인덱스: Fetch-on-demand

인덱스 JSON을 `public/search-index.json`으로 빌드 타임에 생성하고, 클라이언트는 **SearchBar 첫 포커스 또는 첫 키 입력 시점**에 `fetch()`로 로드한다. 선택지:

- **A) Client bundle에 static import**: 첫 검색 즉시 응답, 하지만 모든 페이지의 초기 JS에 인덱스 포함됨. 100개 글 규모에서 수백 KB bundle 증가.
- **B) Fetch-on-demand** (채택): 초기 페이지 로드 영향 0. 첫 검색만 ~100ms 지연 (localhost에서는 체감 불가). `sessionStorage`에 캐시해 한 세션 내 재사용.
- **C) Client에서 매번 빌드**: 본문 전체를 client로 보내야 함 → 결국 A보다 크다.

B를 채택하는 핵심 이유: 검색하지 않는 대부분의 방문에서 비용을 지불하지 않음. "검색 안 하는 사용자가 검색 기능의 비용을 내지 않는다"는 progressive enhancement 원칙.

### 2.3 관련 글: 단순 최신순 (알고리즘 없음)

사용자의 명시적 결정. 글 상세 페이지 `</article>` 바로 아래 "최근 글" 섹션을 렌더하고, `getAllPosts()` 결과에서 현재 slug를 제외한 상위 4개를 노출한다. 알고리즘 스코어링(태그 겹침/키워드 겹침/시리즈) 완전 배제.

**이 결정이 CLAUDE.md §6.2에 미치는 영향**: 기존 §6.2의 "관련 글: 동일 태그를 가진 글 중 최대 4개, 태그 겹침 수 기준 정렬" 규칙은 이 결정에 맞춰 "최근 글: 현재 글 제외 최신순 4개"로 업데이트한다.

### 2.4 태그 페이지: 최소 버전

`/tags/[tag]/page.tsx`는 해당 태그의 글 목록만 표시한다. 헤더(태그명 + 글 수 + 인덱스 복귀 링크) + 기존 `<PostList>` 재사용. 태그 페이지 내부에서는 검색/정렬/필터 없음. 태그 간 이동이 필요하면 인덱스로 복귀.

`generateStaticParams`로 모든 고유 태그에 대해 SSG. `dynamicParams = false`로 알 수 없는 태그는 404.

### 2.5 태그 링크 대상: 구분

- **글 상세 페이지의 `<PostMeta>` 태그 칩** → `/tags/[tag]` (의미론적, 북마크 가능, SSG 친화)
- **인덱스 페이지의 `<TagFilterBar>` 칩** → `/?tag=...` (복수 필터 + 검색 + 정렬을 함께 조작하는 기존 UX 유지)

두 경로는 서로 다른 사용자 의도를 반영하므로 같은 URL로 합치지 않는다.

### 2.6 태그 슬러그: PascalCase 그대로

CLAUDE.md §4.2는 태그를 "PascalCase 또는 공식 명칭"으로 정의한다. URL에도 그대로 사용(`/tags/Backend`, `/tags/B-Tree`). Lowercase 변환 없음. 공백이 있는 태그(예: "Spring Boot")는 `encodeURIComponent` 처리로 `/tags/Spring%20Boot`. Next.js 라우팅이 자동 디코딩.

금지 문자: `/`, `?`, `#`. 이는 frontmatter 스키마 refine으로 빌드 타임 차단한다 (CLAUDE.md §4.2 규칙의 강제화).

### 2.7 FlexSearch 버전 고정

`flexsearch: ^0.7` 메이저 고정. 0.8 이후 버전은 API breaking changes 가능성 있어 업그레이드는 별도 결정.

---

## 3. 아키텍처

### 3.1 파일 구조

```
scripts/
├── generate-keyword-map.ts         [기존]
└── generate-search-index.ts        [신규] prebuild 훅에서 호출

lib/
├── filters.ts                      [기존, 수정] 일부 함수 관련 타입만
├── posts.ts                        [기존]
├── search-index.ts                 [신규] 타입 + 직렬화 포맷 + 클라이언트 헬퍼
├── related-posts.ts                [신규] getRecentPosts(excludeSlug, n)
└── generated/
    ├── keyword-map.ts              [기존]
    └── (search index는 public/에 JSON으로 생성)

app/
├── page.tsx                        [기존]
├── posts/[slug]/page.tsx           [수정] <RecentPostsSection> 추가
└── tags/
    └── [tag]/
        └── page.tsx                [신규] 태그 전용 SSG 페이지

components/blog/
├── SearchBar.tsx                   [수정] FlexSearch 통합 + fetch-on-demand
├── RecentPostsSection.tsx          [신규] 글 상세 하단 "최근 글" 섹션
├── TagPageHeader.tsx               [신규] 태그 페이지 상단 헤더
├── PostMeta.tsx                    [수정] 태그 칩을 /tags/[tag] 링크로
└── PostList.tsx                    [기존, 재사용]

public/
└── search-index.json               [생성물] .gitignore 추가

tests/
├── generate-search-index.test.ts   [신규] 인덱스 생성 단위 테스트
├── related-posts.test.ts           [신규] getRecentPosts 테스트
└── search-index.test.ts            [신규] 직렬화/역직렬화 round-trip

package.json                        [수정] flexsearch 추가
velite.config.ts                    [수정] 태그 금지 문자 refine 추가
.gitignore                          [수정] /public/search-index.json 추가
```

### 3.2 계층 의존도

```
scripts/generate-search-index.ts  ──→  lib/posts.ts (raw body 추출)
                                  ──→  lib/search-index.ts (직렬화 포맷)
                                  ──→  public/search-index.json (output)

components/blog/SearchBar.tsx     ──→  lib/search-index.ts (FlexSearch 구성)
                                  ──→  fetch /search-index.json (runtime)

app/posts/[slug]/page.tsx         ──→  lib/related-posts.ts  ──→  lib/posts.ts
                                  ──→  components/blog/RecentPostsSection.tsx

app/tags/[tag]/page.tsx           ──→  lib/posts.ts
                                  ──→  lib/filters.ts (filterByTag)
                                  ──→  components/blog/PostList.tsx (재사용)
                                  ──→  components/blog/TagPageHeader.tsx
```

### 3.3 빌드 파이프라인

```
prebuild / predev / pretest hook
  ↓
1. tsx scripts/generate-keyword-map.ts   [기존]
  ↓
2. tsx scripts/generate-search-index.ts  [신규]
  ├─ lib/posts.ts의 getAllPosts()로 Velite 빌드 결과 로드
  ├─ 각 Post의 raw body 문자열 추출 (Velite의 compiled body는 아님 — frontmatter 제거 후 원본 MDX)
  ├─ MDX JSX/import 태그 제거 → 플레인 텍스트
  ├─ FlexSearch Document 인덱스 구성
  ├─ .export()로 직렬화 → JSON.stringify
  └─ public/search-index.json 저장
  ↓
3. velite build                          [기존]
  ↓
4. next build                            [기존]
```

런타임에 `SearchBar`가 첫 상호작용 시점에 `/search-index.json`을 fetch하고 FlexSearch를 dynamic import 후 인덱스를 `.import()`로 재구성한다.

---

## 4. FlexSearch 통합

### 4.1 인덱스 구조

```typescript
// lib/search-index.ts
import type { Document } from 'flexsearch'

export interface SearchDoc {
  slug: string
  title: string
  summary: string
  body: string           // plain text, MDX JSX 제거 후
  tags: string           // 'tag1 tag2 tag3' join으로 단일 필드
  keywords: string       // 'kw1 kw2 kw3' join
}

// FlexSearch Document 설정
export const SEARCH_INDEX_CONFIG = {
  document: {
    id: 'slug',
    index: [
      { field: 'title',    tokenize: 'forward', resolution: 9, weight: 10 },
      { field: 'summary',  tokenize: 'forward', resolution: 7, weight: 5 },
      { field: 'tags',     tokenize: 'forward', resolution: 5, weight: 8 },
      { field: 'keywords', tokenize: 'forward', resolution: 5, weight: 7 },
      { field: 'body',     tokenize: 'forward', resolution: 5, weight: 1 },
    ],
    store: ['slug', 'title', 'summary', 'date', 'tags'],
  },
} as const
```

**필드별 가중치 근거**:
- `title` (10): 제목 매치가 가장 강력한 relevance 신호
- `tags` (8): 토픽 매치
- `keywords` (7): 1:1 매핑이라 매치가 매우 의미 있음
- `summary` (5): 의도 요약 정보
- `body` (1): 양이 많아 노이즈 많음

### 4.2 Body 텍스트 추출

Velite의 `s.mdx()` 컴파일 결과는 JSX 런타임 호출이 포함된 JavaScript 함수 바디 문자열이라, 검색용 플레인 텍스트가 아니다. 대신 **원본 `.mdx` 파일을 직접 읽어** frontmatter를 제거하고 MDX JSX를 regex로 스트립한다.

```typescript
// scripts/generate-search-index.ts
function extractPlainText(mdxContent: string): string {
  return mdxContent
    .replace(/---[\s\S]*?---\n/, '')              // frontmatter 제거
    .replace(/<[A-Z][^>]*\/?>|<\/[A-Z][^>]*>/g, ' ')  // JSX 컴포넌트 제거
    .replace(/<[a-z][^>]*>|<\/[a-z][^>]*>/g, ' ')     // HTML 태그 제거
    .replace(/```[\s\S]*?```/g, ' ')              // 코드 블록 제거 (노이즈)
    .replace(/`[^`]*`/g, ' ')                     // 인라인 코드 제거
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')            // 블록 수식 제거
    .replace(/\$[^$]*\$/g, ' ')                   // 인라인 수식 제거
    .replace(/!\[.*?\]\(.*?\)/g, ' ')             // 이미지 제거
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')        // 링크 → 텍스트만
    .replace(/[#*_~]/g, ' ')                       // 마크다운 마크업 제거
    .replace(/\s+/g, ' ')                          // 공백 정규화
    .trim()
}
```

**결정**: 코드 블록과 수식은 본문 검색에서 제외한다. 이유:
- 코드 블록은 syntax 식별자 중심이라 자연어 검색과 맞지 않음 (예: "setTimeout"을 모든 JS 글이 매치)
- 수식은 LaTeX 문법이 자연어와 전혀 다름
- 제외해도 `keywords`/`tags`/`summary`에 해당 개념이 있을 가능성 높음

### 4.3 직렬화 / 역직렬화

FlexSearch의 `Document.export(callback)` API로 빌드 타임에 인덱스를 JSON 문자열로 내보내고, 런타임에 `Document.import(key, data)`로 재구성한다.

```typescript
// scripts/generate-search-index.ts (build time)
import { Document } from 'flexsearch'
const index = new Document(SEARCH_INDEX_CONFIG)
for (const post of posts) index.add(toSearchDoc(post))

const exported: Record<string, string> = {}
await new Promise<void>((resolve) => {
  let pending = 0
  index.export((key, data) => {
    pending++
    exported[key] = data
    queueMicrotask(() => {
      if (--pending === 0) resolve()
    })
  })
})
await fs.writeFile('public/search-index.json', JSON.stringify(exported))
```

```typescript
// components/blog/SearchBar.tsx (runtime, after first interaction)
async function loadIndex(): Promise<Document<SearchDoc>> {
  const cached = sessionStorage.getItem('searchIndex')
  const data: Record<string, string> = cached
    ? JSON.parse(cached)
    : await (await fetch('/search-index.json')).json()
  if (!cached) sessionStorage.setItem('searchIndex', JSON.stringify(data))

  const { Document } = await import('flexsearch')
  const index = new Document(SEARCH_INDEX_CONFIG)
  for (const [key, val] of Object.entries(data)) index.import(key, val)
  return index
}
```

### 4.4 SearchBar 상호작용

```
사용자 포커스 또는 첫 타이핑
  ↓
loadIndex() 호출 (한 번만)
  ↓
인덱스 준비 중이면: 타이핑한 내용을 queuedQuery state에 저장
  ↓
인덱스 준비 완료:
  ├─ queuedQuery가 있으면 즉시 실행
  └─ 이후 타이핑 debounce 250ms로 index.search()
  ↓
결과는 slug 배열 → URL에 ?q=... 갱신 → Server Component가 filtered posts 렌더
```

**주의**: `SearchBar`가 FlexSearch 결과로 직접 렌더하는 게 아니라, 쿼리를 URL로 동기화하면 기존 Server Component flow가 유지된다. 단, Server Component는 FlexSearch에 접근 불가하므로, **매칭된 slug 리스트를 URL 쿼리 파라미터에 직접 넣지는 않고**, 대신 기존처럼 `?q=...`을 유지하되 Server Component는 substring fallback으로 렌더, Client가 FlexSearch 결과를 DOM에서 필터링하는 **hybrid**로 간다.

**더 단순한 대안** (채택): Server Component는 `?q=...`을 받으면 substring 검색으로 fallback. Client FlexSearch는 **클라이언트 라우터에 slug 필터를 query string으로 추가** (예: `?q=인덱스&matched=b-tree,database-index-basics`). Server가 `matched`를 읽어 그 slug만 렌더. 첫 렌더는 substring fallback, 인덱스 로드 후 Client가 replace로 `matched` 갱신.

**훨씬 단순한 대안** (최종 채택): **검색 상호작용은 전부 client-side 렌더링**. `SearchBar`가 active 상태일 때 `PostList`를 client component로 감싸 FlexSearch 결과로 직접 필터링. URL은 `?q=...`만 업데이트해 공유/북마크 가능. 이 방식은 초기 SSG HTML이 검색 적용 전 상태(전체 글)로 렌더되고, hydration 후 client가 재필터링한다.

**최종 결정**: `SearchBar`가 FlexSearch 결과 slug 배열을 상태로 보유. `PostList`는 client wrapper로 감싸져 해당 배열이 있으면 그것만 렌더, 없으면 props로 받은 전체 렌더. URL `?q=...`는 shareable 링크용으로 동기화만, 실제 필터링은 client state.

### 4.5 결과 개수 컷오프

```typescript
const results = index.search(query, { limit: 20, enrich: true })
```

상위 20개까지 표시. 그 이상은 `검색어를 더 구체적으로 입력해보세요` 안내를 리스트 하단에 표시.

### 4.6 로딩 상태 UX

- 인덱스 로드 전 사용자가 타이핑: input placeholder를 "검색 준비 중..."으로 변경, 입력한 쿼리는 `queuedQuery` state에 버퍼. 인덱스 준비되면 즉시 실행.
- 타이핑 없이 포커스만 해제하면 인덱스는 로드되지 않음 (lazy).
- 인덱스 로드 실패(네트워크 이슈): 기존 `filters.ts`의 substring 검색으로 graceful fallback. 상단에 작은 경고 토스트 "전체 검색 준비 실패 — 메타데이터 검색 사용 중".

---

## 5. 최근 글 섹션

### 5.1 `lib/related-posts.ts`

```typescript
// lib/related-posts.ts
import { getAllPosts, type Post } from './posts'

/**
 * Returns the N most recently published posts, excluding the given slug.
 * If fewer than N posts exist, returns all available.
 */
export function getRecentPosts(excludeSlug: string, n = 4): Post[] {
  const all = getAllPosts()  // already sorted latest-first
  return all.filter((p) => p.slug !== excludeSlug).slice(0, n)
}
```

### 5.2 `<RecentPostsSection>`

글 상세 페이지 `</article>` 직후 `<hr />` 아래 배치.

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

포스트가 5개 미만이면 `posts.length === 0`일 수도 있고 (예: 단일 글만 있는 사이트) 그땐 렌더 안 함.

### 5.3 글 상세 페이지 연동

```tsx
// app/posts/[slug]/page.tsx (수정 부분)
import { RecentPostsSection } from '@/components/blog/RecentPostsSection'
import { getRecentPosts } from '@/lib/related-posts'

// ...
const recentPosts = getRecentPosts(slug, 4)

return (
  <>
    <div className="mx-auto max-w-[1080px] ...">
      {/* ... 기존 레이아웃 ... */}
      <article>
        {/* ... 본문 ... */}
      </article>
      <RecentPostsSection posts={recentPosts} />
    </div>
    {/* fixed TOC sidebar */}
  </>
)
```

`RecentPostsSection`은 `<article>` 밖에 두어 TOC가 본문의 H2만 추적하도록 유지.

---

## 6. 태그 전용 페이지

### 6.1 라우트 구조

```tsx
// app/tags/[tag]/page.tsx
import { notFound } from 'next/navigation'
import { getAllPosts } from '@/lib/posts'
import { extractAllTags, filterByTag, sortPosts } from '@/lib/filters'
import { PostList } from '@/components/blog/PostList'
import { TagPageHeader } from '@/components/blog/TagPageHeader'

export function generateStaticParams() {
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

### 6.2 `<TagPageHeader>`

```tsx
// components/blog/TagPageHeader.tsx
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function TagPageHeader({ tag, count }: { tag: string; count: number }) {
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
      <p className="mt-3 text-[15px] text-muted-foreground">
        {count}개 글
      </p>
    </div>
  )
}
```

### 6.3 `<PostMeta>` 태그 칩 링크 업데이트

```tsx
// components/blog/PostMeta.tsx (태그 칩 부분)
// BEFORE:
<span className="text-xs ...">{tag}</span>

// AFTER:
<Link
  href={`/tags/${encodeURIComponent(tag)}`}
  className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
>
  {tag}
</Link>
```

인덱스 페이지의 `<TagFilterBar>` 칩은 기존대로 `?tag=...` 쿼리로 유지 (다중 필터 UX).

### 6.4 태그 이름 검증 (frontmatter 스키마)

CLAUDE.md §4.2의 "PascalCase 또는 공식 명칭" 규칙을 schema-level refine으로 강제:

```typescript
// velite.config.ts (frontmatter 스키마)
const TAG_FORBIDDEN = /[/?#]/

const postFrontmatterShape = s.object({
  // ...
  tags: s
    .array(s.string().min(1).regex(/^[^/?#]+$/, 'tag must not contain / ? #'))
    .min(1)
    .max(5),
})
```

URL-safe하지 않은 문자가 포함된 태그는 **빌드 실패**로 차단한다.

---

## 7. URL 상태 및 SSG 고려

### 7.1 URL 정책

| 경로 | 타입 | 용도 |
|---|---|---|
| `/` | SSG | 인덱스 페이지 (기존) |
| `/?tag=X&q=Y&sort=Z` | SSG + client filter | 인덱스의 검색/필터/정렬 상태 |
| `/posts/[slug]` | SSG | 글 상세 (기존) |
| `/tags/[tag]` | SSG **[신규]** | 태그 전용 페이지 |

### 7.2 generateStaticParams 일관성

`/tags/[tag]`는 `extractAllTags`로 추출한 모든 태그를 param으로 사용한다. 새 글이 새 태그를 추가하면 재빌드 시 해당 `/tags/[tag]` 페이지가 자동 생성된다. `dynamicParams = false`로 빌드 시점에 없는 태그는 런타임 404.

### 7.3 태그 페이지 ↔ 인덱스 필터 칩의 관계

`/tags/Backend`와 `/?tag=Backend`는 **동일한 글 목록을 다르게 제공한다**:
- `/tags/Backend`: 전용 헤더 + 검색/정렬 없음, 순수 listing
- `/?tag=Backend`: 인덱스의 필터 칩이 활성화된 상태로 진입, 검색/정렬 조합 가능

두 경로를 공존시키는 이유: 첫째는 "태그 아카이브" 의미(북마크 가능), 둘째는 "인덱스에서 필터 조작" 의미(임시 상태). 목적이 다르므로 통합하지 않는다.

---

## 8. 테스트 전략

### 8.1 단위 테스트

**`tests/related-posts.test.ts`** (5+ 케이스):
- `getRecentPosts(slug, 4)`: 현재 slug 제외 + 상위 4개 반환
- 전체 글이 4개 미만일 때 가용한 만큼 반환
- 전체 글이 1개(자기 자신)뿐일 때 빈 배열
- 정렬 순서 보존 (date 내림차순)
- 기본 N = 4

**`tests/generate-search-index.test.ts`** (10+ 케이스):
- `extractPlainText(mdxContent)`: frontmatter 제거, JSX 태그 제거, 코드 블록 제거, 수식 제거, 링크 텍스트 추출
- 연속 공백 정규화
- 빈 MDX 입력 처리
- SearchDoc 형태 검증 (slug/title/summary/body/tags/keywords 필수)
- Tags/keywords 배열 → 공백 join 문자열 변환
- 빌드 결과 JSON 파일 구조 (keys가 FlexSearch 내부 키명)

**`tests/search-index.test.ts`** (3+ 케이스):
- `SearchDoc` 타입 정의 존재
- Round-trip: 샘플 docs로 Document 생성 → export → import → search 결과 동일

### 8.2 통합 테스트

**`tests/velite-build.test.ts`에 케이스 추가**:
- 태그에 금지 문자(`/?#`)가 있는 MDX를 넣으면 Velite build 실패하는지 확인 (빌드 타임 검증 스모크)

태그 페이지의 `generateStaticParams`는 Next.js 런타임이라 단위 테스트 범위 밖. `pnpm build` 성공 여부로 검증.

### 8.3 SearchBar Client 로직

FlexSearch 통합 후 `SearchBar`는 `loadIndex` 로직을 별도 모듈로 분리해 테스트 가능하게 한다:

```typescript
// lib/search-index.ts
export async function loadAndBuildIndex(
  fetchFn: typeof fetch = fetch,
  storageFn: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage,
): Promise<Document<SearchDoc>> { ... }
```

이렇게 하면 `tests/search-index.test.ts`에서 mock `fetchFn`과 in-memory storage로 테스트 가능. 실제 React 컴포넌트 렌더 테스트 없이도 로직 검증.

---

## 9. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|---|---|---|
| FlexSearch 번들 크기 | Client JS 비대 | dynamic `import('flexsearch')` — 검색 상호작용 시점에만 로드. 주 페이지 초기 로드에 포함 안 됨 |
| 한글 검색 정확도 | `tokenize: 'forward'`가 한국어 복합어/조사에 완벽하지 않음 | Phase 5는 MVP. 정확도 이슈 실사용 후 Phase 6에서 custom encoder 검토. 부분 매치로 현재 substring 대비는 이미 개선 |
| 본문에 코드/수식 많은 글의 검색 품질 | 스트립으로 키워드 유실 | `keywords` 필드가 1:1 매핑이라 핵심 개념은 보장. 코드/수식 본문 검색 필요 시 Phase 6 separate index 검토 |
| 인덱스 파일 gitignore 누락 | Diff 노이즈 | `.gitignore`에 `/public/search-index.json` 추가. CI/clean clone 시 prebuild가 재생성 |
| 태그 URL 인코딩 이슈 | 한글/공백 태그가 있으면 링크 깨짐 | `encodeURIComponent` 일관 사용. Next.js가 자동 디코딩 |
| generateStaticParams 누락 태그 | 새 태그 추가 후 재빌드 전 404 | 개발 시 `pnpm dev`가 HMR로 page 재생성. 프로덕션은 `pnpm build` 재실행 필요 — CLAUDE.md §13.2의 Phase 1 제약과 동일 |
| FlexSearch 0.8+ breaking change | 업그레이드 시 파손 | package.json에 `^0.7` 고정. 업그레이드는 별도 리뷰 |
| 인덱스 로드 실패 | 검색 전면 중단 | `filters.ts` substring 검색으로 graceful fallback. 작은 경고 토스트로 사용자에게 알림 |
| FlexSearch `.export()` 비동기 콜백 타이밍 | 직렬화 불완전 | 예시 코드의 `pending` 카운터 + `queueMicrotask`로 완료 감지. Promise로 래핑 |
| 코드 블록 스트립 regex가 중첩 블록에 취약 | 텍스트 누락 | 단순 non-greedy regex로 시작. 문제 시 unified-remark 파서로 교체 (Phase 6) |

---

## 10. 완료 기준 (DoD)

- [ ] `scripts/generate-search-index.ts` 존재, `prebuild` / `predev` / `pretest` 훅 연결
- [ ] `public/search-index.json` 빌드 타임 생성되며 `.gitignore`에 등록
- [ ] `lib/search-index.ts` — 타입, config, `loadAndBuildIndex()` 헬퍼
- [ ] `lib/related-posts.ts` — `getRecentPosts()`, 단위 테스트 5+ 케이스
- [ ] `SearchBar`가 FlexSearch로 동작, fetch-on-demand, `sessionStorage` 캐시, URL `?q=...` 동기화 유지
- [ ] 인덱스 로드 실패 시 substring fallback + 사용자 알림
- [ ] `app/posts/[slug]/page.tsx` — `<RecentPostsSection>` 렌더
- [ ] `<RecentPostsSection>` 컴포넌트
- [ ] `app/tags/[tag]/page.tsx` — SSG, `generateStaticParams`, `dynamicParams = false`
- [ ] `<TagPageHeader>` 컴포넌트
- [ ] `<PostMeta>` 태그 칩 → `/tags/[tag]` 링크
- [ ] `velite.config.ts` frontmatter schema — 태그 금지 문자 refine
- [ ] `flexsearch: ^0.7` devDependency 추가
- [ ] 테스트 ~15+ 케이스 신규 추가, 기존 103 + 신규 = ~118+ 모두 그린
- [ ] `pnpm build` / `pnpm type-check` / `pnpm lint` / `pnpm test` 모두 그린
- [ ] CLAUDE.md §6.2 "관련 글" 규칙 업데이트 ("태그 겹침" → "최신순 4개")
- [ ] CLAUDE.md §12 Phase 5 complete 표시
- [ ] CLAUDE.md §18 (or 적절한 section) Phase 5 구현 현황 신설
- [ ] `phase-5-complete` git 태그 생성

---

## 11. 알려진 미결 사항 (Phase 6 이후로 이월)

- **FlexSearch 한국어 tokenizer 최적화** — 한국어 복합어/조사 처리 개선 (현재 forward 토큰화는 prefix 매치만)
- **코드/수식 별도 검색 인덱스** — 시맨틱 타입별 분리 검색
- **검색 결과 UI 개선** — highlight된 매치 단어, context snippet 표시
- **시리즈 탐색 UI** — 시리즈 글이 존재할 때 이전/다음 네비게이션
- **태그 메타데이터** — 태그 설명문, 아이콘, 관련 태그 맵
- **HMR 새 태그 자동 등록** — 현재는 `pnpm build` 재실행 필요
- **관련 글 알고리즘** — 최신순에서 태그/키워드 기반으로 업그레이드하고 싶다면 Phase 6

---

## 12. Phase 5 이후 경로

Phase 5 완료 후:
1. **Phase 6 — 마무리**: 반응형 미세 조정, 성능 최적화, 접근성 감사, 빈 상태 UX 다듬기
2. **실사용 피드백 기반 개선**: 검색 품질/관련 글 정책/태그 페이지 기능 확장은 Phase 6 이후 지속 반영
3. **콘텐츠 확장**: 시각화가 필요한 주제의 실제 작성 (B-Tree, Consumer Group, MVCC 등). Phase 4.1 프레임워크 활용
