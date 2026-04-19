# DEEP

> *"기술 주제를 최대한 이해하기 쉽게 정리"*

DEEP은 **내부 동작 원리**, **기술이 필요한 이유**, **대안과의 트레이드오프**에 집중하는 개인 기술 블로그입니다. 백엔드, 컴퓨터 과학, 자료구조, 데이터베이스, 프레임워크 등 인접 주제를 다룹니다.

- **운영 사이트**: <https://ing9990.com>
- **로컬 개발**: <http://blog.localhost:3010/>
- **English README**: [README.md](./README.md)

## 스택

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Velite** — MDX → 타입 안전 콜렉션 (Zod 스키마)
- **Tailwind CSS v4** + **shadcn/ui** primitive
- **Shiki** 코드 하이라이팅 (`one-light` / `one-dark-pro`) + 라인 하이라이트 transformer
- **KaTeX** 수식
- **Vitest** 단위 테스트, **Stylelint** + **ESLint** 토큰 강제
- **pnpm 9.15.4** (Node 23.5 keyid 버그 회피용으로 Corepack pinned)
- **Vercel** 배포

## 프로젝트 구조

```
app/                  # App Router 라우트 + globals.css
content/posts/        # MDX 포스트 (blog-writer 스킬로만 생성)
components/
  blog/               # Header, Footer, 포스트 레이아웃
  layout/             # DocShell, FAB, hydration gate
  mdx/                # MDXContent, Tabs, Callout, table override
  ui/                 # shadcn primitive
  visualizations/     # 포스트에서 사용하는 인터랙티브 React 컴포넌트
  providers/          # 테마, 설정, 모바일 UI provider
lib/                  # 유틸 + lib/generated/keyword-map.ts (커밋 대상)
plugins/
  remark-auto-link.ts # 키워드 자동 링크 remark 플러그인
public/fonts/         # Paperlogy (9 weights) + Pretendard + JetBrains Mono
scripts/
  generate-keyword-map.ts  # frontmatter에서 키워드 → slug 맵 생성
  check-mdx-emphasis.ts    # `**"…"**` / `**(…)**` 패턴 차단
velite.config.ts      # Frontmatter Zod 스키마 + MDX 파이프라인
```

## 시작하기

### 사전 요구사항

- Node.js (LTS 권장)
- Corepack 활성화 (`corepack enable`) — `package.json`에 pnpm 버전이 고정되어 있음

### 설치 및 실행

```bash
pnpm install
PORT=3010 pnpm dev
```

<http://blog.localhost:3010/> 에서 접속합니다.

> bare `blog`가 아닌 `blog.localhost`를 사용하세요. Safari는 bare `blog`를 검색어로 처리하고 HTTPS로 강제 승격합니다.

> `dev` 스크립트는 `predev`(emphasis 가드 + 키워드 맵 생성)를 자동 실행합니다. 첫 부팅은 Velite가 모든 MDX를 컴파일하기 때문에 몇 초 더 걸립니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | Next dev 서버 (predev: emphasis 가드 + 키워드 맵) |
| `pnpm build` | 프로덕션 빌드 (prebuild: emphasis 가드 + 키워드 맵 + Velite) |
| `pnpm start` | 프로덕션 빌드 서빙 |
| `pnpm type-check` | `tsc --noEmit` |
| `pnpm lint` | `next lint` + Stylelint (토큰 규칙) |
| `pnpm lint:fix` | lint 및 Stylelint 자동 수정 |
| `pnpm test` | `velite build` 후 `vitest run` |
| `pnpm test:unit` | `vitest run`만 실행 |
| `pnpm generate-keyword-map` | frontmatter 수정 후 키워드 맵 수동 재생성 |
| `pnpm check-mdx-emphasis` | emphasis 가드 단일 실행 |

## 포스트 작성

**포스트는 `content/posts/`의 MDX 파일이며, frontmatter 스키마가 엄격합니다.** 모든 포스트는 `title` / `summary`를 `{ ko, en }` 객체로 선언하고, `tags`는 lowercase-hyphen 형식, `keywords`는 키워드 자동 링크에 사용되며, `category`는 `CATEGORY_IDS` 열거형(`computer-science`, `data-structure`, `language`, `database`, `frameworks`, `library`, `ai`, `knowledge`, `etc`)에서 선택합니다.

Frontmatter 형식 (전체 Zod 스키마는 `velite.config.ts` 참고):

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

frontmatter 수정 후 키워드 맵을 재생성하세요.

```bash
pnpm generate-keyword-map
```

생성된 `lib/generated/keyword-map.ts`는 **커밋 대상**입니다. 빌드 타임 키워드 자동 링커(`plugins/remark-auto-link.ts`)가 이 파일을 사용해 등록된 키워드 언급을 `<KeywordLink>` Popover로 변환합니다. **1 키워드 = 1 글** 원칙이며, 충돌 시 빌드가 중단됩니다.

### 포스트에서 사용 가능한 MDX 기능

- Shiki 펜스드 코드 블록 (`one-light` / `one-dark-pro`)
- KaTeX 수식 (`$inline$`, `$$block$$`)
- 커스텀 컴포넌트: `<Callout>`, `<Tabs>` / `<Tab>`, `components/visualizations/` 하위의 인터랙티브 시각화
- 자동 링크 키워드 (Popover 미리보기)
- 테이블 자동 래핑 (overflow 시 가로 스크롤)

### Emphasis 가드

`scripts/check-mdx-emphasis.ts`는 `predev`, `prebuild`, `pretest`에서 실행되며 다음 패턴을 발견하면 **빌드를 중단**합니다.

- `**"…"**` (인용문 전체 bold)
- `**(…)**` (괄호 전체 bold)

이 패턴은 Remark/Shiki 파이프라인에서 한글 조사와 결합 시 렌더링이 불안정합니다. 구두점은 bold 바깥으로 빼세요: `"**X**"`, `**X**(Y)`.

## 디자인 토큰

`app/globals.css`의 CSS 변수는 2-tier 시스템으로 분리되어 있습니다.

1. **Primitive** — `@theme inline` (typography scale `--text-*`, `--leading-*`, `--weight-*`, `--tracking-*`, shadcn `--radius-*`).
2. **Semantic alias** — `:root` (`--layout-*`, `--z-*`, `--callout-*`, `--keyword`, `--code-*`, `--viz-*`, `--shadow-*`).

하드코딩된 값(arbitrary `text-[Npx]`, `z-[N]`, `bg-[#...]`, `tracking-[Nem]` 등)은 `eslint`(`no-restricted-syntax`)와 `stylelint`(`declaration-property-value-disallowed-list`)가 차단합니다. 전체 토큰 표는 [`docs/design-tokens.md`](./docs/design-tokens.md)에 있습니다.

사용자 조정 가능 폰트 스케일은 `html[data-font-size="small|normal|large"]`로 노출되며 `SettingsProvider`로 동기화됩니다. FOUC는 `next/script strategy="beforeInteractive"`로 방지합니다.

## 테스트

Vitest는 **`node`를 기본 환경**으로 사용합니다. DOM이 필요한 spec은 파일 상단에 다음을 선언해야 합니다.

```ts
// @vitest-environment jsdom
```

테스트는 순수 유틸리티(`lib/filters.ts`, `lib/posts.ts`, frontmatter 스키마)에 집중되어 있습니다. UI 회귀는 `pnpm build`와 dev URL에서의 수동 확인으로 잡습니다.

## 배포

`main` 브랜치 기준으로 Vercel에 배포됩니다. SEO 메타데이터, `sitemap.ts`, `robots.ts`, Open Graph는 모두 `https://ing9990.com` 기준으로 연결되어 있습니다.

## 기여

브랜치 전략, 커밋 메시지, 포스트 작성 워크플로는 [CONTRIBUTING.ko.md](./CONTRIBUTING.ko.md) (English: [CONTRIBUTING.md](./CONTRIBUTING.md)) 참고.

## 라이선스

개인 블로그 — 콘텐츠 재사용 라이선스를 부여하지 않습니다. 코드는 참고용 구현으로 제공되며, 상당 부분을 재사용하려면 이슈를 먼저 열어주세요.
