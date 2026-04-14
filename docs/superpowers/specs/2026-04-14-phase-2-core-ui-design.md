# Phase 2 — 핵심 UI 디자인 명세

**작성일**: 2026-04-14
**대상 단계**: Phase 2 (CLAUDE.md §12 기준)
**선행 조건**: Phase 1 완료 (`phase-1-complete` 태그, 커밋 `ebd09e9`)

---

## 1. 배경 및 목표

Phase 1은 Next.js 15 + Velite + MDX 파이프라인과 `/posts/hello-world` 렌더링까지 완료했다. Phase 2의 목표는 **실제로 읽히는 블로그**를 만드는 것이다: 인덱스 페이지·글 상세 페이지·디자인 토큰·다크모드·기본 검색/필터/정렬까지.

### 벤치마크 원칙

디자인 언어는 세 가지 한국어 디자인 표준에서 파생한다:

- **Toss 기술 블로그**: 넉넉한 여백, Pretendard 기반 에디토리얼 타이포, `line-height: 1.8`, 단일 블루 액센트
- **Doodlin Greeting**: 에디토리얼·차분한 인상, 큰 타이포, 구분선 중심
- **pathsdog (jobs.pathsdog.com)**: 개발자 미니멀리즘, 테두리 중심의 카드, 그림자 최소화

세 벤치마크의 교집합이 "테두리 기반 미니멀 + 넉넉한 여백 + 단색 액센트 + Pretendard"이며, 이것이 Backend Notes의 베이스가 된다.

### Phase 2의 경계

**포함**: 디자인 토큰 · Pretendard · 다크모드 (토글 UI까지) · 글 상세 페이지 (TOC 포함) · 인덱스 페이지 (검색·필터·정렬) · TOC 빌드타임 추출 · 읽기 시간 계산 · Shiki 라인 하이라이트 + JetBrains Mono

**제외** (후속 Phase로 이월):
- 키워드 자동 링크 (Phase 3)
- 인터랙티브 시각화 프레임워크 (Phase 4)
- FlexSearch 기반 고성능 검색 (Phase 5)
- 태그 전용 페이지 `/tags/[tag]` (Phase 5)
- 관련 글 추천 (Phase 5)
- 반응형 미세 조정 · 성능 최적화 (Phase 6)

---

## 2. 주요 결정 사항

브레인스토밍 단계에서 확정된 결정. 각 결정은 향후 Phase에 영향을 준다.

### 2.1 검색 바 — 지금 구현, 내부는 나이브 filter

SearchBar 컴포넌트를 Phase 2에서 완성하되, 내부 구현은 `Array.filter` 기반 순수 함수(`searchPosts`)로 둔다. Phase 5에서 FlexSearch로 교체 시 **시그니처는 동결**되어 컴포넌트 재작성 없이 내부만 바꾸면 된다. 단위 테스트가 이 계약을 강제한다.

### 2.2 shadcn/ui 도입 — Phase 2에서 시작

Phase 2에 shadcn/ui CLI로 Button, Input, Badge, Select 4종을 설치한다. 동시에 CLAUDE.md §7.2의 기존 CSS 변수(`--color-bg`, `--color-accent`)를 shadcn 컨벤션(`--background`, `--primary`, `--muted` 등)으로 **전면 교체**한다. pathsdog/Toss/Doodlin 모두 shadcn 기본 "neutral" 테마 범위 안에 있어 자연스럽다. 프로젝트 고유 토큰(`--keyword`, `--keyword-bg`)은 확장으로 공존.

### 2.3 다크모드 — 토큰 + 토글 UI까지 Phase 2에서 완결

CLAUDE.md §12는 다크모드를 Phase 6으로 분류했지만, shadcn 토큰 구조가 라이트/다크 쌍을 요구하므로 토큰은 지금 정의한다. 토글 UI까지 포함하는 비용이 미미하고(30줄), 라이트/다크를 실시간 전환하며 Phase 2 전체 QA를 할 수 있으므로 **완결**한다. Phase 6은 "반응형·성능"만 담당.

### 2.4 Pretendard — `next/font/local` 셀프 호스팅

`PretendardVariable.woff2` 1파일(~1.2MB)을 `public/fonts/`에 커밋하고 `next/font/local`로 로드. 이유: (1) 로컬 전용 프로젝트 원칙 정합 (§2), (2) Next.js의 CLS 방어/preload/size-adjust 자동 처리, (3) 가변 폰트 하나로 100~900 굵기 커버.

JetBrains Mono는 Shiki 라인 하이라이트 도입 단계(Phase 2 후반)에 동일 방식으로 추가한다. 그 전까지는 `ui-monospace` 시스템 스택 사용.

### 2.5 TOC — Velite 내장 `s.toc()` 활용

Velite는 이미 `s.toc()` 스키마 헬퍼를 제공하고, 현재 `velite.config.ts`에도 `toc: s.toc()`로 선언되어 있다. 자체 플러그인은 불필요하다. `s.toc()`는 `github-slugger` 기반으로 계층적 TOC 트리를 반환한다:

```typescript
type VeliteTocEntry = { title: string; url: string; items: VeliteTocEntry[] }
```

**필요한 작업**:
1. MDX 렌더링 파이프라인에 `rehype-slug`를 추가해 실제 `<h2>`/`<h3>`에 `id` 속성을 부여한다. 현재는 id가 없어 Intersection Observer가 동작하지 않는다. `rehype-slug`와 Velite `s.toc()` 모두 `github-slugger`를 사용하므로 id와 `url`이 일치한다.
2. `TableOfContents` 컴포넌트는 Velite의 계층 구조(`items` 배열에 h3 중첩)를 **flat 배열로 변환**해 렌더한다. 변환기는 `lib/toc.ts`의 `flattenToc()` 순수 함수로 분리한다.

런타임 DOM 파싱 대신 **순수 서버 데이터**를 사용해 §8.2 "client 경계를 leaf로" 원칙을 지킨다.

### 2.6 테스트 범위 — 순수 함수만

`lib/filters.ts`, `lib/reading-time.ts`, `plugins/velite-toc.ts`에 단위 테스트를 추가한다. React 컴포넌트 렌더링 테스트는 도입하지 않는다(`@testing-library/react` + jsdom + next 모킹 비용 대비 효용 낮음). UI 회귀는 `pnpm build` + dev 서버 수동 확인 + Phase 6의 Playwright 검토로 대체한다.

---

## 3. 디자인 토큰

### 3.1 컬러 팔레트

shadcn 컨벤션(`--background`/`--foreground`/`--primary`/`--muted`/`--border`/`--ring`/`--accent`) + 프로젝트 고유 확장(`--keyword`, `--keyword-bg`, `--border-strong`).

**라이트 모드**
```css
:root {
  --background:        #FFFFFF;
  --foreground:        #09090B;
  --muted:             #F4F4F5;
  --muted-foreground:  #71717A;
  --border:            #E4E4E7;
  --border-strong:     #D4D4D8;
  --primary:           #3B82F6;
  --primary-foreground:#FFFFFF;
  --accent:            #EFF6FF;
  --ring:              #3B82F6;
  --keyword:           #6366F1;
  --keyword-bg:        #EEF2FF;
}
```

**다크 모드**

> `next-themes`의 `ThemeProvider`는 반드시 `attribute="data-theme"`로 설정한다. 기본값 `class`를 쓰면 `.dark` 클래스로 전환되므로 아래 CSS 선택자와 불일치한다. `components/providers/ThemeProvider.tsx`에서 명시.

```css
[data-theme="dark"] {
  --background:        #09090B;
  --foreground:        #FAFAFA;
  --muted:             #18181B;
  --muted-foreground:  #A1A1AA;
  --border:            #27272A;
  --border-strong:     #3F3F46;
  --primary:           #60A5FA;
  --primary-foreground:#0A0A0A;
  --accent:            #1E293B;
  --ring:              #60A5FA;
  --keyword:           #818CF8;
  --keyword-bg:        #1E1B4B;
}
```

### 3.2 타이포그래피 스케일

**폰트**: 본문/제목 Pretendard Variable (local woff2), 코드 `ui-monospace, SFMono-Regular, Menlo, "JetBrains Mono", monospace` (Shiki 도입 후 JetBrains Mono 합류).

| 용도 | 모바일 | 데스크탑 | weight | line-height | letter-spacing |
|---|---|---|---|---|---|
| Display | 32px | 40px | 700 | 1.2 | -0.02em |
| H1 | 28px | 32px | 700 | 1.3 | -0.015em |
| H2 | 22px | 24px | 600 | 1.4 | -0.01em |
| H3 | 18px | 19px | 600 | 1.5 | 0 |
| Body | 16px | 17px | 400 | 1.8 | 0 |
| Body Small | 14px | 15px | 400 | 1.7 | 0 |
| Caption | 13px | 13px | 500 | 1.5 | 0 |
| Code inline | 14px | 14px | 500 | 1.6 | 0 |

본문 `line-height: 1.8`은 Toss 기술 블로그 기준. 한국어 긴 글 가독성의 공식. 음수 letter-spacing은 Pretendard 큰 굵기의 자간 보정용.

### 3.3 여백·라운딩·고도감

```
--radius-sm:  6px    뱃지, 작은 버튼
--radius:     10px   인풋, 태그 칩
--radius-lg:  14px   카드, Popover
--radius-xl:  20px   큰 컨테이너·모달
```

**고도감 원칙**: 그림자 대신 **테두리 변화로 상태 표현**.
- 카드 기본: `border-border`
- 카드 호버: `border-border-strong` + `bg-muted/40` + `transition-colors duration-200`
- 그림자는 Popover/Dropdown 같은 "실제로 떠 있는 요소"에만 (`shadow-sm`)

### 3.4 컨테이너·브레이크포인트

| 영역 | max-width | 모바일 padding | 데스크탑 padding |
|---|---|---|---|
| 인덱스 페이지 | 1080px | 20px | 48px |
| 글 상세 본문 | 720px | 20px | 0 (중앙 정렬) |
| 글 상세 풀 레이아웃 | 1120px | 20px | 48px |
| 헤더 | 1280px | 20px | 32px |

**섹션 수직 리듬**: 모바일 `space-y-8` (32px), 데스크탑 `md:space-y-12` (48px). 인덱스 히어로↔필터↔리스트는 각각 48px/64px.

---

## 4. 파일 구조 및 컴포넌트 아키텍처

### 4.1 신규/수정 파일

```
app/
├── layout.tsx                        [수정] Pretendard, ThemeProvider, Header, Footer
├── page.tsx                          [재작성] 인덱스 페이지
├── globals.css                       [재작성] shadcn 토큰 + Pretendard + prose-kr
└── posts/[slug]/page.tsx             [수정] 2열 레이아웃 + TOC 사이드바

components/
├── ui/                               [신규, shadcn/ui]
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── select.tsx
├── blog/                             [신규]
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PostCard.tsx
│   ├── PostList.tsx
│   ├── TagChip.tsx
│   ├── TagFilterBar.tsx              ('use client')
│   ├── SearchBar.tsx                 ('use client', 250ms debounce)
│   ├── SortSelect.tsx                ('use client')
│   ├── PostMeta.tsx
│   ├── TableOfContents.tsx           ('use client', IntersectionObserver)
│   ├── ThemeToggle.tsx               ('use client')
│   └── ReadingTime.tsx
├── mdx/
│   └── index.ts                      [수정] h1-h6, a, pre, code, blockquote 매핑
└── providers/
    └── ThemeProvider.tsx             ('use client', next-themes wrapper)

lib/
├── posts.ts                          [수정 최소]
├── filters.ts                        [신규] filterByTag / searchPosts / sortPosts / applyFilters / extractAllTags
├── reading-time.ts                   [신규]
├── toc.ts                            [신규] flattenToc() — Velite 계층 TOC → flat 배열
└── utils.ts                          [신규] cn(), buildPostsUrl()

velite.config.ts                      [수정] rehype-slug 추가, readingTime computed field (toc는 기존 s.toc() 유지)
tailwind.config.ts                    [수정] shadcn 토큰 매핑, Pretendard
components.json                       [신규]
public/fonts/PretendardVariable.woff2 [신규, ~1.2MB]

tests/
├── filters.test.ts                   [신규, ~14 케이스]
├── reading-time.test.ts              [신규, ~5 케이스]
└── toc.test.ts                       [신규, ~6 케이스] — flattenToc() + Velite 출력 검증
```

### 4.2 Server vs Client 경계

**Server Component (기본)**
- `app/layout.tsx`, `app/page.tsx`, `app/posts/[slug]/page.tsx`
- `Header`, `Footer`, `PostCard`, `PostList`, `PostMeta`, `ReadingTime`

**'use client' (leaf만)**
- `ThemeProvider` (next-themes 요구사항)
- `ThemeToggle` (useTheme)
- `TableOfContents` (IntersectionObserver)
- `SearchBar` (useState + debounce + useRouter)
- `TagFilterBar` (useRouter, URL 조작)
- `TagChip` — 자체 로직은 순수 프레젠테이션이지만 `TagFilterBar`의 자식이라 client 트리에 합류. `'use client'` 지시어는 불필요하지만 파일 상단에 명시하면 의도가 분명해진다. 판단은 구현 시점에.
- `SortSelect` (useRouter)

**핵심 원칙**: 필터링/검색/정렬은 **서버에서 수행**한다. 클라이언트는 URL 쿼리 파라미터만 변경하고, Next.js가 searchParams 변경을 감지해 페이지를 재렌더한다. 필터 로직이 클라이언트 번들로 내려가지 않는다.

---

## 5. 페이지별 상세 레이아웃

### 5.1 글 상세 페이지 (`/posts/[slug]`)

**구조**:
```tsx
<div className="mx-auto max-w-[1120px] px-5 py-16 md:px-12">
  <Link href="/" className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
    ← 목록으로
  </Link>

  <div className="md:grid md:grid-cols-[720px_280px] md:gap-16">
    <article className="max-w-[720px]">
      <PostMeta tags={post.tags} date={post.date} readingTime={post.readingTime} />
      <h1 className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.015em] md:text-[32px]">
        {post.title}
      </h1>
      <hr className="my-8 border-border" />
      <div className="prose-kr">
        <MDXContent code={post.body} />
      </div>
    </article>

    <aside className="hidden md:block">
      <div className="sticky top-24">
        <TableOfContents items={post.toc} />
      </div>
    </aside>
  </div>
</div>
```

**모바일 TOC**: `md` 미만에서 사이드바를 숨기고 본문 상단에 `<details>` 접이식.
```tsx
<details className="mb-8 rounded-[10px] border border-border bg-muted/50 p-4 md:hidden">
  <summary className="cursor-pointer text-sm font-medium">목차</summary>
  <ul className="mt-3 space-y-2">...</ul>
</details>
```

### 5.2 TableOfContents 동작

```tsx
'use client';

interface TocItem { title: string; slug: string; depth: 2 | 3 }

function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) setActiveSlug(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    items.forEach(item => {
      const el = document.getElementById(item.slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="목차">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
      <ul className="space-y-2 border-l border-border">
        {items.map(item => (
          <li key={item.slug} className={cn(
            'border-l-2 -ml-px pl-4 text-sm transition-colors',
            item.depth === 3 && 'pl-7',
            activeSlug === item.slug
              ? 'border-primary text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}>
            <a href={`#${item.slug}`}>{item.title}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

**접근성 주**: 위 컴포넌트는 색 전환만 사용하므로 `prefers-reduced-motion: reduce` 대응 variant(`motion-safe:`)를 달지 않는다. 색 변화는 WCAG의 "모션 민감성" 범주가 아니기 때문. 반대로 Phase 4 시각화처럼 실제 translate/scale 애니메이션이 생기면 그때 `motion-safe:` variant로 보호한다.

### 5.3 인덱스 페이지 (`/`)

**구조**:
```tsx
export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; sort?: string }>;
}) {
  const { tag, q, sort } = await searchParams;
  const allPosts = getAllPosts();
  const allTags = extractAllTags(allPosts);
  const validSort: SortKey = ['latest', 'oldest', 'title'].includes(sort ?? '')
    ? (sort as SortKey)
    : 'latest';
  const filtered = applyFilters(allPosts, { tag, query: q, sort: validSort });

  return (
    <main className="mx-auto max-w-[1080px] px-5 py-20 md:px-12">
      <section className="mb-12">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] md:text-[40px]">Backend Notes</h1>
        <p className="mt-3 text-[17px] text-muted-foreground">백엔드 엔지니어의 학습 기록</p>
      </section>

      <SearchBar defaultQuery={q} currentTag={tag} currentSort={validSort} />
      <TagFilterBar allTags={allTags} selected={tag} currentQuery={q} currentSort={validSort} />

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>전체 {filtered.length}개 글</span>
        <SortSelect value={validSort} currentTag={tag} currentQuery={q} />
      </div>

      <PostList posts={filtered} />
    </main>
  );
}
```

**레이아웃 결정**: 단일 컬럼, 세로 스택. 그리드가 아니라 리스트. pathsdog/Doodlin/Toss 블로그 모두 글 수가 많지 않은 사이트에서 리스트 형태를 택한다.

**PostCard**:
```tsx
<Link
  href={`/posts/${post.slug}`}
  className="group block rounded-[14px] border border-border bg-background p-6 transition-colors hover:border-border-strong hover:bg-muted/40"
>
  <div className="mb-2 flex flex-wrap gap-1.5">
    {post.tags.slice(0, 3).map(tag => (
      <span key={tag} className="text-xs font-medium text-muted-foreground">#{tag}</span>
    ))}
  </div>
  <h2 className="text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-foreground group-hover:text-primary">
    {post.title}
  </h2>
  <p className="mt-2 line-clamp-2 text-[15px] leading-[1.7] text-muted-foreground">
    {post.summary}
  </p>
  <time className="mt-4 block text-[13px] text-muted-foreground">
    {formatDate(post.date)}
  </time>
</Link>
```

**빈 상태**:
```tsx
<div className="rounded-[14px] border border-dashed border-border py-16 text-center">
  <p className="text-sm text-muted-foreground">조건에 맞는 글이 없습니다. 필터를 조정해보세요.</p>
</div>
```

**TagFilterBar sticky**: 스크롤 시 `top-16`(헤더 아래)에 `bg-background/80 backdrop-blur-sm`로 고정.

### 5.4 Header

```tsx
<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
  <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="text-[17px]">Backend Notes</span>
    </Link>
    <nav className="flex items-center gap-2">
      <a href="https://github.com/ing9990/backend-notes" target="_blank" rel="noreferrer"
         className="rounded-[10px] px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
        GitHub
      </a>
      <ThemeToggle />
    </nav>
  </div>
</header>
```

---

## 6. 데이터 흐름 · URL 동기화 · 순수 함수 계약

### 6.1 `lib/filters.ts` 계약

```typescript
import type { Post } from '#site/content';

export type SortKey = 'latest' | 'oldest' | 'title';

export interface PostFilters {
  tag?: string;
  query?: string;
  sort?: SortKey;
}

export function filterByTag(posts: Post[], tag?: string): Post[];
export function searchPosts(posts: Post[], query?: string): Post[];
export function sortPosts(posts: Post[], sort?: SortKey): Post[];
export function applyFilters(posts: Post[], filters: PostFilters): Post[];
export function extractAllTags(posts: Post[]): { tag: string; count: number }[];
```

**규칙**:
- 불변성: 입력 배열을 mutate하지 않음
- 단일 책임: 각 함수 하나의 역할
- `searchPosts` 검색 대상: 제목·요약·태그·키워드 (본문 제외 — Phase 5 확장 여지)
- 대소문자 구분 없음 (한글/영문)
- `sortPosts('title')`은 `Intl.Collator('ko')` 사용
- `applyFilters`는 `tag → search → sort` 순서로 파이프라인

**Phase 5 교체 지점**: `searchPosts` 내부만 FlexSearch로 교체, 시그니처·동작 의미 유지.

### 6.2 URL 쿼리 파라미터 계약

**형식**: `/?tag=Database&q=인덱스&sort=latest`

| 파라미터 | 값 | 생략 시 |
|---|---|---|
| `tag` | 태그 이름 | 전체 |
| `q` | 검색어 | 빈 검색 |
| `sort` | `latest` \| `oldest` \| `title` | `latest` |

**규칙**:
1. 기본값과 같은 파라미터는 URL에서 제거한다 (`?sort=latest` → `/`)
2. 빈 `q`는 파라미터 자체를 제거한다
3. 활성 태그를 다시 클릭하면 `tag` 파라미터를 제거한다 (토글 해제)

### 6.3 `buildPostsUrl` 헬퍼

```typescript
export function buildPostsUrl(params: {
  tag?: string;
  query?: string;
  sort?: SortKey;
}): string {
  const sp = new URLSearchParams();
  if (params.tag) sp.set('tag', params.tag);
  if (params.query?.trim()) sp.set('q', params.query.trim());
  if (params.sort && params.sort !== 'latest') sp.set('sort', params.sort);
  const qs = sp.toString();
  return qs ? `/?${qs}` : '/';
}
```

### 6.4 읽기 시간 계산

```typescript
// lib/reading-time.ts
export function calculateReadingTime(content: string): number {
  const plain = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/[#*_\[\]()!]/g, '')
    .replace(/\s+/g, '');
  return Math.max(1, Math.ceil(plain.length / 500));
}
```

Velite 스키마의 computed field로 빌드 타임에 계산 → `post.readingTime: number` 저장.

### 6.5 TOC 평탄화 (`lib/toc.ts`)

Velite의 `s.toc()`는 h2의 `items`에 h3을 중첩한 트리를 반환한다. `TableOfContents`는 flat 리스트로 렌더하므로 순수 함수로 평탄화한다:

```typescript
// lib/toc.ts
export interface VeliteTocEntry {
  title: string;
  url: string;        // "#slug"
  items: VeliteTocEntry[];
}

export interface FlatTocItem {
  title: string;
  slug: string;       // "#" 제거된 id
  depth: 2 | 3;
}

export function flattenToc(entries: VeliteTocEntry[]): FlatTocItem[] {
  const out: FlatTocItem[] = [];
  for (const h2 of entries) {
    out.push({ title: h2.title, slug: h2.url.replace(/^#/, ''), depth: 2 });
    for (const h3 of h2.items) {
      out.push({ title: h3.title, slug: h3.url.replace(/^#/, ''), depth: 3 });
    }
  }
  return out;
}
```

h4+ 헤딩은 무시한다(블로그 글 구조상 3 depth면 충분).

### 6.6 Velite 스키마 확장

```typescript
// velite.config.ts (발췌)
const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.mdx',
  schema: postFrontmatterShape
    .extend({
      slug: s.slug('post'),
      body: s.mdx(),
      toc: s.toc(),  // 기존 유지 — Velite 내장 헬퍼
      readingTime: s.markdown().transform((md) => calculateReadingTime(md)),
    })
});
```

`s.markdown()`은 원본 마크다운 문자열을 반환하는 헬퍼. `readingTime`은 이 문자열을 `calculateReadingTime`에 넘겨 숫자로 변환한다. (만약 Velite 0.2에서 `s.markdown()`이 body용으로만 쓰인다면, `s.custom().transform((_, { meta }) => calculateReadingTime(meta.content))`로 대체한다 — 플랜 Task에서 실제 확인 후 선택.)

**MDX 파이프라인에 `rehype-slug` 추가** — 현재 `rehype-pretty-code`만 있어 `<h2>`/`<h3>`에 `id`가 없다. `rehype-slug`가 `github-slugger`로 id를 부여하면 Velite `s.toc()`의 `url`(`#slug` 형식)과 정확히 매칭된다.

```typescript
mdx: {
  rehypePlugins: [
    rehypeSlug,  // ← 신규
    [rehypePrettyCode, { /* 기존 설정 */ }],
  ],
}
```

---

## 7. 테스트 전략

Phase 1의 순수 함수 중심 테스트 전략을 확장한다. UI 컴포넌트 렌더링 테스트는 도입하지 않는다.

| 파일 | 대상 | 케이스 수 |
|---|---|---|
| `tests/filters.test.ts` | `lib/filters.ts` | ~14 |
| `tests/reading-time.test.ts` | `lib/reading-time.ts` | ~5 |
| `tests/toc.test.ts` | `lib/toc.ts` + Velite 출력 매칭 | ~6 |

**filters.test.ts 케이스**:
- `filterByTag`: tag 미지정 전체 반환 / 'Database' 필터 / 대소문자 무시 / 없으면 빈 배열
- `searchPosts`: query 미지정 전체 / 제목 부분 일치 / 요약 부분 일치 / 태그 부분 일치 / 키워드 부분 일치 / 대소문자 무시 / 한글 검색
- `sortPosts`: latest / oldest / title (한글 Intl.Collator) / 원본 불변
- `applyFilters`: 파이프라인 순서(tag → search → sort)
- `extractAllTags`: 중복 제거 + count 내림차순

**reading-time.test.ts 케이스**:
- 코드 블록 제거 확인
- 인라인 코드 제거 확인
- 마크다운 기호 제거 확인
- 500자 = 1분
- 최소 1분 보장

**toc.test.ts 케이스**:
- `flattenToc`: 빈 배열 / h2만 / h2+h3 중첩 / 여러 h2와 h3 섞임 / h3 없는 h2
- Velite 출력 매칭: 빌드된 `posts[*].toc`의 `url`과 실제 MDX body의 id가 일치 (통합 테스트)

**기존 Phase 1 테스트 17개는 영향받지 않는다**. `lib/posts.ts` 시그니처 불변, Velite 스키마는 `toc`/`readingTime`만 **추가**되므로 기존 테스트 호환.

---

## 8. CLAUDE.md 업데이트 계획

Phase 2 작업과 같은 커밋 범위에서 CLAUDE.md를 업데이트해 문서-코드 단일 진실 소스를 유지한다.

**대상 섹션**:
- **§7.2 컬러 팔레트**: shadcn 컨벤션으로 전면 교체. 고유 토큰(`--keyword`, `--keyword-bg`, `--border-strong`)은 확장 섹션으로 분리.
- **§7.3 타이포그래피**: 3.2의 스케일 표로 교체. Pretendard 로딩 방식 명시.
- **§7.4 컴포넌트 스타일 가이드**: `PostCard`/`TagChip`/`SearchBar` 클래스를 실제 구현과 일치시킴.
- **§12 작업 우선순위**: Phase 2에 "shadcn/ui 도입, 다크모드 토글 포함", Phase 6은 "반응형·성능 최적화"로 축소.
- **§14 (신규) Phase 2 구현 현황**: §13과 동일한 포맷(존재 파일 / 의사결정 / 명령어 / 미결 사항 / 태그).

§13 (Phase 1 구현 현황)은 historical record로 **지우지 않는다**.

---

## 9. 구현 작업 순서 (7단계)

각 단계는 **끝날 때마다 `pnpm build` + `pnpm test`가 녹색**이어야 한다.

### 1단계 — 디자인 토큰 + 폰트 인프라

1. `pnpm dlx shadcn@latest init --yes -b neutral` (비대화식, 기본 Tailwind v4 config 감지, base color neutral). 필요 시 플래그 추가. 생성되는 `globals.css`와 `components.json`은 CLI 기본값을 받되, 토큰은 바로 §3.1 값으로 덮어쓴다.
2. `PretendardVariable.woff2` 다운로드 → `public/fonts/` 커밋
3. `app/layout.tsx`에 `next/font/local`로 Pretendard 로드
4. `app/globals.css` 재작성: shadcn 토큰(light/dark) + Pretendard + `prose-kr` 기본
5. `tailwind.config.ts` 갱신
6. `lib/utils.ts`에 `cn()` (clsx + tailwind-merge) 추가
7. `pnpm add next-themes`
8. `components/providers/ThemeProvider.tsx`, `components/blog/ThemeToggle.tsx`
9. `components/blog/Header.tsx`, `components/blog/Footer.tsx`
10. `app/layout.tsx`에 Provider + Header + Footer 연결

**검증**: 기존 `/`와 `/posts/hello-world`가 새 토큰 위에서 깨지지 않고 렌더. 라이트/다크 토글 동작.

### 2단계 — Velite 스키마 확장

1. `pnpm add rehype-slug`
2. `lib/reading-time.ts` + `calculateReadingTime` + TDD 테스트
3. `lib/toc.ts` + `flattenToc` + TDD 테스트
4. `velite.config.ts`: `rehype-slug` 추가 + `readingTime` computed field (기존 `s.toc()` 유지)
5. 통합 테스트: 빌드 후 `posts[0].toc`가 실제 body의 id와 일치하는지 확인
6. `hello-world.mdx`에 h2/h3 여러 개 추가

**검증**: `pnpm velite` → `.velite`에 `toc`/`readingTime` 반영. `pnpm test` 녹색.

### 3단계 — 글 상세 페이지 재구성

1. `components/blog/PostMeta.tsx`, `ReadingTime.tsx`
2. `components/blog/TableOfContents.tsx` (IntersectionObserver)
3. `components/mdx/index.ts` 확장: 커스텀 h1-h6, a, blockquote, hr
4. `app/posts/[slug]/page.tsx` 재작성: 2열 + 사이드바 TOC + 모바일 접이식
5. `hello-world.mdx`에 여러 섹션 추가

**검증**: dev 서버에서 스크롤 시 활성 항목 하이라이트, 앵커 이동, 모바일 접이식 동작.

### 4단계 — `lib/filters.ts` + 순수 함수 테스트

1. `lib/filters.ts` 구현
2. `lib/utils.ts`에 `buildPostsUrl` 추가
3. `tests/filters.test.ts` 14 케이스

**검증**: `pnpm test` 녹색.

### 5단계 — 인덱스 페이지 재작성

1. `pnpm dlx shadcn@latest add button input badge select`
2. `components/blog/PostCard.tsx`, `PostList.tsx`
3. `components/blog/TagChip.tsx`, `TagFilterBar.tsx`
4. `components/blog/SearchBar.tsx` (250ms debounce)
5. `components/blog/SortSelect.tsx`
6. `app/page.tsx` 재작성
7. 콘텐츠 검증용 더미 MDX 3~5개 추가 (태그 다양성 확보)

**검증**: 검색/필터/정렬이 URL 동기화와 함께 정상 동작. 라이트/다크 모두 확인.

### 6단계 — Shiki 라인 하이라이트 + JetBrains Mono

1. `pnpm add @shikijs/transformers`
2. `velite.config.ts`의 `rehype-pretty-code` 옵션에 `transformerNotationHighlight` 연결
3. `public/fonts/JetBrainsMono-Variable.woff2` 추가
4. 샘플 코드 블록으로 ` ```kotlin {3-5} ` 하이라이트 실동작 확인

### 7단계 — CLAUDE.md 업데이트 + Phase 2 완료 커밋

1. §7.2/§7.3/§7.4/§12 갱신
2. §14 Phase 2 구현 현황 신규 작성
3. `phase-2-complete` 태그 부여

---

## 10. 완료 기준 (Definition of Done)

- [ ] `pnpm build` 성공
- [ ] `pnpm test` 전체 녹색 (Phase 1 17개 + Phase 2 ~25개)
- [ ] `pnpm type-check` 에러 0
- [ ] `pnpm lint` 에러 0
- [ ] dev 서버 수동 검증:
  - 인덱스 페이지: 검색·태그 필터·정렬이 URL 동기화
  - 글 상세 페이지: TOC 스크롤 하이라이트, 모바일 접이식, 앵커 이동
  - 다크모드 토글 + 시스템 기본값 감지
  - 375px 뷰포트에서 레이아웃 깨짐 없음
  - 라이트/다크 모두에서 대비/가독성 확인
- [ ] CLAUDE.md §7.2/§7.3/§7.4/§12/§14 업데이트
- [ ] `phase-2-complete` 태그 부여

---

## 11. Phase 이후로 이월

- 관련 글 추천 (Phase 5)
- 태그 전용 페이지 `/tags/[tag]` (Phase 5)
- 키워드 자동 링크 (Phase 3)
- 검색 대상에 본문 포함 (Phase 5 FlexSearch 도입 시)
- `series`/`seriesOrder` 정합성 `.refine()` — Phase 2 여유 있으면 포함, 없으면 이월
- 관리자용 글 작성 가이드 문서

---

## 12. 리스크 및 완화 방안

| 리스크 | 영향 | 완화 |
|---|---|---|
| `next-themes` hydration mismatch | 첫 렌더 깜빡임 | `<html suppressHydrationWarning>` + `ThemeProvider`의 기본 script 사용 |
| shadcn CLI가 CSS 변수를 덮어씀 | 커스텀 토큰 소실 | CLI init 후 `globals.css`를 스펙(§3.1)으로 수동 복구 |
| `Intl.Collator('ko')` Node 환경 차이 | 정렬 불일치 | Node 공식 바이너리(`full-icu` 기본)만 사용 가정 — 로컬 전용이라 안전 |
| Pretendard 1.2MB 파일 git 커밋 | 레포 크기 증가 | Git LFS 불필요 수준. 1회 커밋. |
| Velite `s.toc()` URL과 `rehype-slug` id 불일치 | TOC 스크롤 하이라이트 실패 | 양쪽 모두 `github-slugger` 사용이라 구조적으로 일치. `toc.test.ts`의 통합 테스트에서 `posts[0].toc` vs body id 매칭을 명시 검증 |
| Shiki 라인 하이라이트 설치가 기존 코드 블록을 깨뜨림 | Phase 2 후반 빌드 실패 | 6단계를 별도 커밋으로 분리, 실패 시 롤백 용이 |
