# CLAUDE.md — DEEP

**읽으세요.** 이 문서는 Claude가 이 프로젝트에서 실수하는 것을 막는 불변식만 담는다. 자세한 규칙은 스킬 references 참고.

## 0. 매 세션 체크리스트

- dev 서버는 항상 백그라운드: `PORT=3010 pnpm dev`를 Bash `run_in_background`로. `pnpm dev -- -p 3010` 금지 (pnpm `--` 파싱 오염).
- 접속 URL: `http://blog.localhost:3010/` (Safari는 bare `blog`를 검색어로 처리 + HTTPS 승격 → 사용 금지).
- 세션 시작 시 `lsof -nP -iTCP:3010 -sTCP:LISTEN`로 점유 확인. UI 변경 후 `BashOutput`으로 dev 로그 확인.

## 1. 정체성 · 모토

- **DEEP** — 개인 기술 블로그. 로컬 디렉토리/리포 모두 `deep-blog`.
- **모토**: *"기술 주제를 최대한 이해하기 쉽게 정리"*. 이해를 위해 내부적 작동, 기술이 필요한 이유, 트레이드오프 비교를 다룬다.
- **배포 도메인**: `https://ing9990.com` (Vercel). SEO 메타데이터·sitemap·robots.txt·Open Graph 활성화됨.
- **신규 글 작성은 `blog-writer` 스킬로만**. 사용자가 "블로그 써줘" / "포스트 만들어줘" 계열 요청을 하면 즉시 스킬로 전환. `content/posts/*.mdx` 직접 `Write` 금지.
- 블로그 작성 상세 규칙(철학·frontmatter·태그·키워드·시각화 판단·MDX 컴포넌트 레퍼런스)은 `.claude/skills/blog-writer/references/*.md` 참고.

## 2. 스택

Next.js 15 App Router · TypeScript strict · Velite (MDX → type-safe) · Tailwind v4 + shadcn/ui · Shiki · KaTeX · Vitest · **Stylelint**(CSS 토큰 강제) · ESLint `no-restricted-syntax`(className 토큰 강제) · pnpm 9.15.4 (corepack pinned, Node 23.5 keyid 버그 회피용).

## 3. 디렉토리 (top-level)

```
app/                  # App Router 라우팅 + globals.css
content/posts/        # MDX 포스트 (blog-writer 스킬로만 생성)
components/{ui,blog,mdx,visualizations,layout,providers}/
lib/                  # 유틸 + lib/generated/keyword-map.ts (커밋 대상)
plugins/remark-auto-link.ts
public/fonts/         # Paperlogy 9 weights + Pretendard + JetBrains Mono
velite.config.ts      # Zod 스키마 + 파이프라인
```

## 4. 명령어 · 검증

```bash
pnpm dev                   # predev: emphasis 가드 + 키워드 맵 자동 재생성
pnpm build                 # prebuild: emphasis 가드 + 키워드 맵 + Velite
pnpm type-check            # tsc --noEmit
pnpm lint                  # next lint + stylelint (토큰 강제 포함)
pnpm lint:fix              # 자동 수정 (next lint --fix + stylelint --fix)
pnpm test                  # pretest: emphasis 가드 + 키워드 맵 → velite + vitest
pnpm generate-keyword-map  # frontmatter 수정 후 수동 재생성
pnpm check-mdx-emphasis    # `**"…"**` / `**(…)**` 패턴 단일 실행 검사
pnpm check-mdx-tilde       # 한 줄/셀 안 `~` 2+ (GFM strikethrough 방지) 단일 실행 검사
```

- **코드 수정 후**: `pnpm type-check` (필수) + `pnpm lint`. 변경 규모 크면 `pnpm build`.
- **MDX/frontmatter 수정 후**: `pnpm generate-keyword-map` 재실행.
- **UI 변경 후**: 라이트/다크, 모바일 375px, 키워드 링크 연결, dev 로그 에러 체크.
- 신규 MDX 작성은 blog-writer 스킬이 자체 validation loop (`references/validation-loop.md`) 수행.

## 5. 금지 사항

1. 존재하지 않는 API/라이브러리를 꾸며내지 마라. 불확실하면 `context7`으로 공식 문서 확인.
2. `any` 금지 — `unknown` + 타입 가드.
3. 인라인 `style` 금지 — Tailwind 유틸리티.
4. (해제됨) SEO/sitemap/robots/Open Graph는 `ing9990.com` 배포 후 활성화.
5. 키워드 맵 런타임 생성 금지. 빌드 타임 `scripts/generate-keyword-map.ts`만.
6. `content/posts/*.mdx` 직접 `Write` 금지 — blog-writer 스킬로.
7. 동작/상태 변화가 핵심인 개념을 텍스트만으로 설명 금지 (시각화 필수).
8. 파괴적 git 명령(`push --force`, `reset --hard`, `clean -f`) + `--no-verify` 훅 우회 금지.
9. **Style 하드코딩 금지** — ESLint + Stylelint가 차단:
   - Typography: `text-[Npx]` / `text-xs|sm|base|lg|xl|2xl|3xl|4xl` / CSS `font-size: Npx` → `--text-*` 토큰
   - Letter-spacing/line-height: `tracking-[Nem]` / `leading-[N]` arbitrary → `--tracking-*` / `--leading-*` 토큰
   - Layout 상수: `w-[288px]` / `w-[224px]` / `w-[300px]` / `top-20` 등 → `--layout-*` 토큰
   - Z-index: `z-[N]` / `z-10|20|40|50|60|100` → `--z-*` 토큰
   - Radius: `rounded-[Npx]` → `--radius-chip|card|panel|overlay` (Tailwind named `rounded-md|lg|xl|2xl|full`는 허용)
   - Hex color: `bg-[#...]` / `text-[#...]` / `border-[#...]` / CSS `color: #...` → shadcn semantic 또는 `--keyword`/`--callout-*`/`--code-*`/`--viz-*`
   - Shadow: `shadow-[0_...rgba...]` → `--shadow-card|card-hover|fab`
   예외 (자동 whitelist): `components/visualizations/{BTreeInsert,QuickSort,...}` SVG 로직 상수, `em`/`%` 상대 단위, primitive 정의 블록(`@theme inline`, `:root`, `[data-theme="dark"]`, `html[data-font-size="..."]`), 아이콘 픽셀 크기(`h-[22px] w-[22px]`), 단일 사용 리터럴(HeroIntro radial gradient 등). 토큰 전체 목록: `docs/design-tokens.md`.
10. **MDX 본문 bold 안 구두점 금지** — `**"…"**` · `**(…)**` 패턴. `scripts/check-mdx-emphasis.ts`가 prebuild·predev·pretest에서 빌드 차단. 구두점·괄호를 bold 바깥으로 (`"**X**"`, `**X**(Y)`). Remark/Shiki 파이프라인에서 한글 조사와 결합 시 렌더링 불안정.
11. **MDX 본문 범위 표기 `~` 2개 이상 금지** — 한 줄(또는 한 테이블 셀) 안에 unescaped `~`가 2개 이상이면 remark-gfm이 `<del>` 페어로 해석해 취소선이 발생한다 (예: `0~100 ... 60~70` → `0<del>100 ... 60</del>70`). `scripts/check-mdx-tilde.ts`가 prebuild·predev·pretest에서 빌드 차단. 숫자 범위는 en-dash `–`(U+2013) 또는 `0에서 100` 자연어, 한글 범위는 `수백에서 수천` 자연어, 단계 참조는 `1번부터 4번까지`로 치환. 근사값 단일 `~`(예: `~10ms`)는 허용.

## 6. 변경 금지 결정 (비자명 불변식)

### Next.js / Velite 파이프라인

- **`MDXContent`는 Server Component**. `'use client'` 금지 — Velite 본문은 `arguments[0]` 구조분해 헬퍼 패턴.
- **`/posts/[slug]`는 `dynamicParams` export 생략**. Next 15는 리터럴만 허용, 조건부 불가. 기본값 `true`로 dev HMR + 알 수 없는 slug → `notFound()` 404.
- 페이지 컴포넌트 `params: Promise<{slug}>`로 async unwrap 필수.
- **`draft: true` 필터는 `lib/posts.ts`에서만**. Velite 스키마에서 제외하면 빌드 자체가 실패.
- Frontmatter 스키마 이중화: 테스트용 regex(`postFrontmatterShape`) + 콜렉션에서 `.extend({slug: s.slug('post')})` 재적용 패턴 유지.

### UI 레이아웃 / 디자인 시스템

- **`DocShell`는 항상 3-col 그리드 `[288px, minmax(0,1fr), 224px]`**. `showCategoryNav=false` / `hasToc=false`여도 placeholder `<div>`가 컬럼 폭 유지. `HeaderActions`도 동일 그리드 (좌/중/우 엣지 페이지 간 정렬). `width` prop / `max-w-3xl,5xl` 컨테이너는 **폐기**.
- **TOC**는 그리드 셀 내부 `sticky top-20`. `position: fixed` + `calc(50% + …)` 방식 금지.
- **`CategoryNav` 모든 `<details>`는 기본 `open`**. 현재 글 카테고리만 여는 동작 폐기.
- **Hero Intro (`components/blog/HeroIntro.tsx`)**: 세션 1회(`sessionStorage['deep-hero-seen']`), 4단계 progressive highlight, **재진입 경로 없음(단방향)**. 트랙패드 내성 `createBurstDetector` (`IDLE_GAP=120 / COMMIT_DELTA=220 / COOLDOWN=420`). **Dismiss 타이머는 `dismissScheduledRef` 가드 + 이펙트 deps `[stage, show]`만**. `dismissing`을 deps에 넣으면 cleanup이 `clearTimeout`으로 `setShow(false)`를 영구 취소 → **body scroll 영구 잠금 회귀**.
- **폰트 3-way split**: `--font-sans` = Paperlogy(9 weights TTF) / `.prose-kr`만 `--font-pretendard` 오버라이드 / `--font-mono` = JetBrains Mono. `app/layout.tsx`가 세 `next/font/local` 선언 동시 보유. 통합/제거 금지.
- **Style 토큰 시스템 (PR1–PR4)**: `app/globals.css`에 2-tier — (1) `@theme inline` primitives (typography `--text-*` scale + `--leading-*` + `--weight-*` + `--tracking-*` + shadcn `--radius-*`) (2) `:root` semantic aliases. 반응형은 `@media (min-width: 768px) :root { }`에서 semantic 재선언. **카테고리**: typography, layout(`--layout-nav-width/toc-width/sticky-offset/...`), z-index(`--z-header/fab/panel/popover/hero/...`), radius semantic(`--radius-chip/card/panel/overlay`), shadow(`--shadow-card/card-hover/fab`), colors(shadcn + `--callout-*` + `--keyword` + `--code-*` + `--viz-*`). **사용자 조정 font-scale**: `html[data-font-size="small|normal|large"]`가 `--text-scale`을 `0.92 / 1 / 1.10`로 오버라이드. `SettingsProvider`의 `fontSize` 필드 → `document.documentElement.dataset.fontSize` effect 동기화, FOUC 차단은 `app/layout.tsx`의 `next/script strategy="beforeInteractive"`. 기본값 `normal`. **강제**: `.eslintrc.json`의 `no-restricted-syntax` (7 regex)  + `.stylelintrc.json`의 `declaration-property-value-disallowed-list`가 `pnpm lint`에서 위반 차단. 새 토큰 프로토콜: primitive → semantic alias → `docs/design-tokens.md` 표 업데이트 → 필요 시 CLAUDE.md §6에 불변식 추가. 전체 참조: `docs/design-tokens.md`.
- **Category 아이콘은 `lib/category-icons.ts`에 분리**. `lib/categories.ts`에 `lucide-react` import 금지 (velite가 로드하는 서버 번들 오염).
- shadcn 토큰(`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, `--accent`) + 확장(`--keyword`, `--keyword-bg`, `--code-inline-fg`, `--border-strong`, `--viz-*`). 다크모드는 `next-themes` `attribute="data-theme"` 고정 + Tailwind `darkMode: ['selector', '[data-theme="dark"]']`.
- **인라인 요소 3색 체계**: 일반 링크=blue(`--primary`) / 키워드 링크=indigo(`--keyword` + `.keyword-link` 클래스) / 인라인 코드=teal(`--code-inline-fg` 텍스트 + 10% 틴트 배경). 세 색상 영역 혼용 금지.
- **키워드 링크 `.keyword-link`**: 배경 틴트 + 호버 시 그라데이션 밑줄 애니메이션(`background-size` 0→100%). `.prose-kr .keyword-link`가 `.prose-kr a`를 override. `decoration-dotted` 점선 밑줄은 **폐기** — 복원 금지.
- **인라인 코드 `--code-inline-fg`**: teal-600(라이트) / teal-300(다크). 배경은 `color-mix(in oklab, var(--code-inline-fg) 10%, var(--background))`로 텍스트 색에서 자동 파생. `--muted` 회색 배경 + border + box-shadow 방식은 **폐기** — 복원 금지.
- `<article className="min-w-0">` + figure/pre `width:100% max-width:100% min-width:0` **3종 세트 제거 금지** (CSS Grid `min-width: auto`로 긴 코드 라인이 cell을 확장해 overflow 회귀).
- Shiki 라인 하이라이트는 `.prose-kr .highlighted` 클래스 (`@shikijs/transformers@4`는 className 생성, data-* 아님).
- MDX 테이블은 `components/mdx/components.tsx`의 `table` override가 자동 `.table-wrapper` div로 래핑.
- **`.prose-kr h2` 구분선**: 모든 H2 상단에 `border-top: 1px solid var(--border)` + `margin-top: 3em` + `padding-top: 1.5em` 자동 적용. 섹션 전환마다 시각적 호흡을 제공한다. MDX 본문에 수동 `---`(thematic break) 삽입 금지 — 이중 구분선 회귀.
- **MDX `<Tabs>`는 Server Component, `<TabsView>`는 Client Component로 분리 유지**. `Tabs`(`components/mdx/Tabs.tsx`)가 서버에서 `extractTabs(children)`로 Tab을 추출한 뒤 `<TabsView tabs={...}>`(`components/mdx/TabsView.tsx`)에 배열로 넘긴다. `Tabs`에 `'use client'`를 다시 붙이면 RSC 경계에서 children이 직렬화되고, 앞 Tab의 Shiki 코드 블록이 스트림 청크를 분할하는 순간 뒤 Tab이 `{$$typeof: react.lazy, _payload: Promise<pending>}` lazy reference로 도착해 **두 번째 탭이 조용히 사라진다**(trigger/content 미생성). `extractTabs`는 duck-typing(`props.label`이 string)만 유지 — `type === Tab` 레퍼런스 비교로 갈아끼우지 말 것.
- **`TabsGroupProvider`는 `components/mdx/MDXContent.tsx` 최상위 1개만**. 블로그 레이아웃(`app/layout.tsx` 등) 상위로 올리면 포스트 간 `group` state leak이 발생한다. 포스트 = 스코프 1개.

### 검색 / 필터

- **검색 UI는 헤더 `SearchDialog`만** 소유. `BlogHomeClient`에 query state/URL param 없음. `buildPostsUrl`에 `query` 필드 없음. 인덱스 자체 `SearchBar`는 제거됨.
- 인덱스는 2-모드: `category===null` → `CategoryGroupedFeed` / `category!==null` → flat `PostList` + 스코프 내 `TagFilterBar` (해당 카테고리에 등장하는 태그만). 스코프 전환 시 `tag` 자동 리셋.
- 필터 상태는 `BlogHomeClient`가 소유. URL sync는 `history.replaceState`만 (`router.push` 금지 — keystroke → RSC 왕복 회귀).
- **IME 처리**: `SearchDialog` 입력은 controlled. `isComposing` 가드 / `onCompositionEnd` 플러시 금지 — React 19 한글 조합 중 글자 사라짐 회귀.

### 키워드 자동 링크

- 파이프라인: prebuild `scripts/generate-keyword-map.ts` → `lib/generated/keyword-map.ts` (**커밋 대상**) → `plugins/remark-auto-link.ts` Remark 치환 → MDX `a[data-keyword-link]` → `mdxComponents.a` → `<KeywordLink>` Popover.
- **충돌 시 `process.exit(1)`** — 1 키워드 = 1 글. lowercase 정규화 (`B-Tree` = `b-tree`).
- 자기-링크 방지: `currentSlug = 파일 basename`. 파일명 ≠ slug면 깨짐.
- 경계: 영문/한글 앞 엄격, 한글 뒤 완화 (조사 `를/가/의/는` 허용).

### 유틸 / 테스트

- `formatDate`는 **UTC getters**만. Velite `s.isodate()`가 midnight UTC 파싱 → 로컬 getter 쓰면 날짜 밀림.
- `lib/filters.ts` 모듈 레벨 `koCollator = new Intl.Collator('ko', {sensitivity:'base'})` 공유. `sortPosts('title')` / `extractAllTags` 타이브레이크 일관성.
- Vitest 기본 env = `node`. DOM 테스트 파일 상단에 `// @vitest-environment jsdom` pragma 필수.
- 테스트 범위는 순수 함수 중심 — UI 회귀는 `pnpm build` + dev 수동 확인. `@testing-library/react` 미사용.

### Frontmatter / 포스트 데이터

- **Frontmatter `title`/`summary`는 `{ ko, en }` nested object**. 사용처는 `post.title[lang]` / `post.summary[lang]` 접근. Server Component가 lang 없이 렌더하는 곳(`generateMetadata` 등)은 `.ko` 고정 (서버 언어 결정 인프라 없음, hreflang은 후속 PR).
- **Frontmatter `tags`는 lowercase-hyphen**. `backend`, `data-structure`, `distributed-systems` 식. `Backend` / `Data Structure` / 공백 구분자 금지. `app/tags/[tag]/page.tsx`의 `generateStaticParams`가 frontmatter에서 직접 param을 생성하므로 casing 변경은 URL 변경(`/tags/Backend` → `/tags/backend` 404 발생). 2026-04-19 전역 정규화 완료.

## 7. 코드 컨벤션

- Server Component 기본. 클라이언트 상태 필요 leaf에만 `'use client'`.
- 컴포넌트 props는 `interface` (type alias 아님). 컴포넌트 파일명 `PascalCase.tsx`, 유틸 `kebab-case.ts`.
- 반응형 `mobile-first`. 복잡한 조건부 className은 `cn()` (`clsx + tailwind-merge`).
- 접근성: 인터랙티브 요소에 `aria-label`, 키보드 내비게이션, 이미지 `alt`, 색만으로 정보 구분 금지.
- `next/image` width/height 명시 필수.
