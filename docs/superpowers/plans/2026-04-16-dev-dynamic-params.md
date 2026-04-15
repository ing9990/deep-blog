# Dev dynamicParams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 새 MDX 파일을 dev 서버 재시작 없이 `/posts/<slug>`로 즉시 라우팅되게 만든다. 프로덕션에서는 기존 포스트가 여전히 SSG로 prerender되고 알 수 없는 slug는 `notFound()` 404로 떨어지도록 유지한다.

**Architecture:** `app/posts/[slug]/page.tsx`에서 `export const dynamicParams = false` 한 줄을 **삭제**한다. 이렇게 하면 route segment config가 기본값(`dynamicParams = true`)으로 돌아가 dev에서는 알려지지 않은 slug가 컴포넌트로 fall-through 하고, 프로덕션에서는 `generateStaticParams`가 여전히 모든 slug를 빌드 타임에 prerender한다(`● /posts/[slug]`). Next.js 15의 route config 파서가 리터럴만 허용하므로 조건부 값(`process.env.NODE_ENV` 등)은 불가능 — export 생략이 유일한 해결책이다. 나머지(Velite watch, `getPostBySlug`, `notFound()`)는 기존 구현 그대로 사용한다.

**Tech Stack:** Next.js 15 App Router, Velite 0.2 (webpack plugin watch 모드), TypeScript.

**Spec:** `docs/superpowers/specs/2026-04-16-dev-dynamic-params-design.md`

---

## File Structure

이 변경이 건드리는 파일:

- **Modify**: `app/posts/[slug]/page.tsx` — `export const dynamicParams = false` 한 줄 삭제
- **Modify**: `CLAUDE.md` — §13.1 "dev HMR 한계" 항목 정정, §15 "개발 편의" 항목 정리
- **임시 생성·삭제**: `content/posts/_hmr-smoke-test.mdx` — dev 런타임 검증용 임시 포스트. 검증 완료 후 삭제.

파일 수가 극소수이고 각각 책임이 뚜렷하므로 추가 분해는 불필요하다.

## 검증 전제 조건

이 플랜의 여러 스텝이 실행 중인 dev 서버를 요구한다. 시작 전에 반드시 확인:

```bash
lsof -nP -iTCP:3010 -sTCP:LISTEN
```

포트 3010이 비어 있으면 백그라운드로 dev 서버를 띄운다:

```bash
PORT=3010 pnpm dev
```

(Claude 환경에서는 Bash `run_in_background: true`로 실행. CLAUDE.md §0 규칙.)

---

## Task 1: `dynamicParams = false` export 삭제

**History note**: 초기 시도는 `export const dynamicParams = process.env.NODE_ENV !== 'production'`로 조건부 값을 주려 했으나 Next.js 15의 route segment config 파서가 `BinaryExpression`을 거부해 `pnpm build`가 실패했다. top-level `const IS_DEV` 참조도 `Identifier` 거부로 동일하게 실패. Next 15에서는 `dynamicParams`가 반드시 **리터럴**이어야 한다. 유일한 해결책은 export를 완전히 제거해 기본값 `true`로 돌리는 것이며, 이 경우에도 `generateStaticParams` 덕에 프로덕션 SSG prerender는 유지된다.

**Files:**
- Modify: `app/posts/[slug]/page.tsx` (delete the `dynamicParams` export line)

- [ ] **Step 1: 현재 상태 확인**

Read the file and confirm the `export const dynamicParams = false` line exists (around line 15, between `generateStaticParams` and `PostPage`).

- [ ] **Step 2: export 삭제**

Use Edit tool:

- `old_string`:
  ```
  export function generateStaticParams() {
    return getAllSlugs().map((slug) => ({ slug }))
  }

  export const dynamicParams = false

  export default async function PostPage({
  ```
- `new_string`:
  ```
  export function generateStaticParams() {
    return getAllSlugs().map((slug) => ({ slug }))
  }

  export default async function PostPage({
  ```

이 블록은 파일 내 유일하므로 `replace_all` 불필요. 삭제 후 `generateStaticParams`와 `PostPage` 사이에 빈 줄 1개만 남아 있어야 한다.

- [ ] **Step 3: TypeScript 타입 체크 통과 확인**

Run:

```bash
pnpm type-check
```

Expected: exit 0, no errors.

- [ ] **Step 4: ESLint 통과 확인**

Run:

```bash
pnpm lint
```

Expected: no new warnings or errors. (next lint deprecation 경고는 infrastructural, 이 변경과 무관.)

- [ ] **Step 5: `pnpm build`로 route가 여전히 SSG인지 확인**

이 단계가 초기 접근 실패의 교훈이다. Task 3에서 다시 하지만, 코드 변경 직후 한 번 더 확인한다.

Run:

```bash
pnpm build
```

Expected (critical):
- Exit 0
- 빌드 로그 "Route (app)" 섹션에서 `● /posts/[slug]` 표기 확인. 그 아래에 `/posts/quick-sort`, `/posts/b-tree-structure` 등 기존 slug 목록이 나열되어야 함
- `ƒ /posts/[slug]`로 표시되면 설계 실패 — 즉시 중단하고 보고

- [ ] **Step 6: 코드 변경 단독 커밋**

```bash
git add app/posts/[slug]/page.tsx
git commit -m "$(cat <<'EOF'
feat(dev): allow new MDX files to route without server restart

Remove `export const dynamicParams = false` so the route segment
defaults to `true`. `generateStaticParams` still prerenders every known
slug as SSG at build time (verified in build output: `● /posts/[slug]`
with all slugs listed), so production static output is unchanged for
the known-slug path. The only behavioral change is that unknown slugs
in production now fall through to dynamic rendering → getPostBySlug
returns undefined → notFound() → 404, instead of framework-level 404.
For this local-only blog (never exposed via `next start`) the
distinction is cosmetic.

In dev, this unblocks the core pain: newly created MDX files are now
routable at /posts/<slug> without a dev-server restart, because
Velite's watch mode already keeps .velite/posts.json current.

An earlier attempt used `dynamicParams = process.env.NODE_ENV !==
'production'`, but Next.js 15's route segment config parser only
accepts literal values — it rejects BinaryExpression and Identifier
nodes at `dynamicParams`, so any conditional within a single file is
impossible. Dropping the export entirely is the correct fix.

Spec: docs/superpowers/specs/2026-04-16-dev-dynamic-params-design.md
EOF
)"
```

---

## Task 2: Dev 런타임 검증 — 새 MDX 파일이 재시작 없이 라우트되는가

**Files:**
- Create (temporary): `content/posts/_hmr-smoke-test.mdx`
- Delete after verification: `content/posts/_hmr-smoke-test.mdx`

- [ ] **Step 1: Dev 서버 확인**

Run:

```bash
lsof -nP -iTCP:3010 -sTCP:LISTEN
```

Expected: `next-server`가 3010 포트를 점유 중. 비어 있으면 `PORT=3010 pnpm dev`를 백그라운드로 띄우고, 첫 컴파일이 끝날 때까지 `BashOutput`으로 `Ready`가 찍히는지 기다린다.

- [ ] **Step 2: 임시 테스트 MDX 파일 작성**

Use Write tool. Path: `/Users/ing9990/Document/backend-notes/content/posts/_hmr-smoke-test.mdx`

Content:

````markdown
---
title: "HMR Smoke Test"
slug: "hmr-smoke-test"
date: 2026-04-16
tags:
  - Meta
keywords:
  - __hmr_smoke_test_only__
summary: "This is a temporary post created by the dev dynamicParams verification task. It should be deleted immediately after manual verification."
draft: false
---

# HMR Smoke Test

If you can read this at `http://blog.localhost:3010/posts/hmr-smoke-test` without restarting the dev server, the dynamicParams change is working.
````

**중요 사항:**
- `slug: "hmr-smoke-test"`는 lowercase + hyphen (velite 스키마 통과)
- `tags: [Meta]`는 태그 배열 최소 1개 충족. 기존 태그 이름과 충돌해도 무방 (태그 스키마는 그냥 문자열 검증만)
- `keywords: [__hmr_smoke_test_only__]`는 기존 키워드와 절대 충돌하지 않는 고유한 더미 이름 — 빌드 실패 방지
- `summary`는 10자 이상 (스키마 `.min(10)`)

파일명은 `_`로 시작시켜 실수로 커밋되지 않도록 한다 (작성자가 한눈에 임시 파일임을 인지).

- [ ] **Step 3: Velite watch가 새 포스트를 감지했는지 확인**

Run:

```bash
# Use BashOutput tool to read the background dev server log
```

Expected: 로그에 Velite rebuild 또는 webpack recompile 관련 출력이 나타남. 컴파일 에러가 찍히면 즉시 중단하고 에러 메시지 조사.

10초 기다려도 반응이 없으면:

```bash
ls -la /Users/ing9990/Document/backend-notes/.velite/posts.json
```

`mtime`이 방금 찍혔어야 한다.

- [ ] **Step 4: 새 slug 라우팅 수동 검증**

**이 스텝은 자동화할 수 없다.** 사용자에게 브라우저에서 직접 확인해달라고 요청:

> "Dev 서버에서 임시 포스트가 라우트되는지 확인해주세요: http://blog.localhost:3010/posts/hmr-smoke-test
>
> 기대: 'HMR Smoke Test' 제목과 본문이 **재시작 없이** 렌더됨.
> 실패: 404 또는 컴파일 에러."

사용자의 승인을 받기 전에는 다음 스텝으로 진행하지 않는다.

- [ ] **Step 5: 존재하지 않는 slug가 여전히 404인지 검증 요청**

사용자에게 두 번째 URL을 요청:

> "두 번째로, 존재하지 않는 slug도 확인해주세요: http://blog.localhost:3010/posts/this-slug-does-not-exist-xyz
>
> 기대: Next.js not-found 페이지 (`notFound()`가 호출된 결과)."

사용자의 승인 이후 계속.

- [ ] **Step 6: 임시 파일 삭제**

```bash
rm /Users/ing9990/Document/backend-notes/content/posts/_hmr-smoke-test.mdx
```

삭제 후 dev 서버 로그(`BashOutput`)에서 Velite가 다시 rebuild 하는지 확인. 오류 없이 사라져야 한다.

- [ ] **Step 7: 임시 파일이 git에 추적되지 않는지 확인**

```bash
git status --short content/posts/
```

Expected: `content/posts/_hmr-smoke-test.mdx` 라인이 출력되지 않아야 한다 (방금 삭제됐으므로). 만약 추적된다면 `git rm --cached`로 내리고 재확인.

---

## Task 3: 프로덕션 빌드 동작 불변 검증

**Files:** (변경 없음 — 순수 검증 태스크)

- [ ] **Step 1: Production build 실행**

Run:

```bash
pnpm build
```

Expected: 성공 종료 (exit 0). prebuild hook(`generate-keyword-map`)이 먼저 돌고, 이후 `next build`가 Velite와 함께 완료됨.

실패 시 즉시 중단.

- [ ] **Step 2: 빌드 출력에서 `/posts/[slug]` 라우트가 SSG로 prerender 되는지 확인**

빌드 로그 끝부분의 "Route (app)" 테이블을 본다. Next.js는 각 라우트를 다음 기호로 표시:

- `● (SSG)` — `generateStaticParams`로 prerender됨 ✓ **기대값**
- `○ (Static)` — 파라미터 없는 정적 라우트 (일반 페이지)
- `ƒ (Dynamic)` — 서버 런타임 렌더 ✗ **실패**

`/posts/[slug]`는 반드시 `● (SSG)`로 표시되어야 하며, 바로 아래에 기존 포스트 slug 목록이 들여쓰기로 나열되어야 한다. 예:

```
● /posts/[slug]                         8.1 kB         141 kB
  ├ /posts/quick-sort
  ├ /posts/b-tree-structure
  ├ /posts/database-index-basics
  └ [+2 more paths]
```

`ƒ (Dynamic)`로 표시되거나 기존 slug 목록이 보이지 않으면 이 플랜의 핵심 전제가 깨진 것이다. 즉시 중단하고 보고.

- [ ] **Step 3: 기존 포스트 페이지 수가 build 전과 동일한지 확인**

빌드 로그에서 `/posts/[slug]` 아래에 prerender된 slug들이 나열되는지 확인. 작성 시점 기준 포스트 수와 일치해야 한다. (정확한 개수는 현재 `content/posts/` 내 `.mdx` 파일 수 — `ls content/posts/*.mdx | wc -l`로 기준치 확보 가능.)

---

## Task 4: CLAUDE.md 동기화

**Files:**
- Modify: `CLAUDE.md:845` — §13.1 "dev HMR 한계" 항목 정정
- Modify: `CLAUDE.md:946-947` — §15 "개발 편의" 항목 정리

- [ ] **Step 1: §13.1의 해당 줄 정정**

Use Edit tool on `/Users/ing9990/Document/backend-notes/CLAUDE.md`:

- `old_string`:
```
| `dynamicParams = false` (100% SSG) | 알 수 없는 slug는 즉시 404 | **dev HMR 한계**: 새 MDX 파일 추가 시 `/posts/<slug>` 라우트는 dev 서버 재시작 전까지 404. 인덱스 링크는 갱신됨. 프로덕션 `pnpm build`는 정상 |
```
- `new_string`:
```
| `generateStaticParams` + 기본 `dynamicParams = true` (export 없음) | 기존 포스트는 빌드 타임 SSG prerender(빌드 출력 `● /posts/[slug]`), 알 수 없는 slug는 dynamic 폴백 → `getPostBySlug` → `notFound()` → 404. dev에서는 Velite watch가 `.velite/posts.json`을 즉시 재생성하므로 새 MDX 파일이 재시작 없이 라우트됨 | **Next.js 15 제약**: `dynamicParams` 값은 반드시 **리터럴**이어야 함. `BinaryExpression`/`Identifier` 거부. 조건부 값이 필요하면 export 자체를 생략해 기본값(`true`)로 돌아가는 것이 유일한 해결책. **잔존 한계**: 새 MDX 안에서 선언한 *새 키워드*의 기존 글 자동 링크는 여전히 `pnpm generate-keyword-map` + dev 재시작 필요 (Velite config가 로드 타임에 키워드 맵을 캡처) |
```

- [ ] **Step 2: §15 "개발 편의" 항목 정리**

Use Edit tool on `/Users/ing9990/Document/backend-notes/CLAUDE.md`:

- `old_string`:
```
**개발 편의**
- HMR: dev 모드에서 새 MDX 파일 추가 시 키워드 맵/검색 인덱스 자동 재생성 (현재 `pnpm dev` 재시작 필요)
- 신규 태그 HMR 인식 (현재 `pnpm dev` 재시작 필요)
- `series`/`seriesOrder` 정합성 `.refine()` — 시리즈 UI 도입 전 추가
```
- `new_string`:
```
**개발 편의**
- 새 키워드의 기존 글 자동 링크 HMR: `content/posts/**/*.mdx` 변경 시 `lib/generated/keyword-map.ts` 자동 재생성 + Velite config 리로드 (현재 수동 재생성 + `pnpm dev` 재시작 필요). Velite config가 로드 타임에 맵을 캡처하는 구조라 config hot-reload 메커니즘 필요 → 작성자가 실제로 통증을 체감하면 재평가
- 신규 태그 HMR 인식 (현재 `pnpm dev` 재시작 필요)
- `series`/`seriesOrder` 정합성 `.refine()` — 시리즈 UI 도입 전 추가
```

- [ ] **Step 3: CLAUDE.md 수정이 의도한 줄에만 적용됐는지 확인**

```bash
# Use Grep tool:
# pattern: generateStaticParams` + 기본 `dynamicParams = true
# path: /Users/ing9990/Document/backend-notes/CLAUDE.md
```

Expected: §13.1의 해당 줄 한 건만 매치.

```bash
# pattern: HMR: dev 모드에서 새 MDX 파일 추가 시 키워드 맵
# path: /Users/ing9990/Document/backend-notes/CLAUDE.md
```

Expected: 0 매치 (옛 문구가 완전히 제거됨).

- [ ] **Step 4: 문서 변경 단독 커밋**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: update CLAUDE.md for dev dynamicParams change

§13.1: replace "dev HMR 한계" entry with the new conditional
dynamicParams behavior and the remaining keyword-map reload limitation.
§15: narrow the HMR open item to keyword-map auto-regen + Velite
config reload (the only piece still requiring manual intervention).
EOF
)"
```

---

## Task 5: 최종 점검

**Files:** (변경 없음 — 순수 점검)

- [ ] **Step 1: Git 상태가 깨끗한지 확인**

```bash
git status --short
```

Expected: 출력 없음 (all clean). 있다면 의도치 않은 잔존 파일 (임시 MDX 삭제 누락, .velite 캐시 등)이 있는지 조사.

- [ ] **Step 2: 커밋 히스토리 확인**

```bash
git log --oneline -5
```

Expected (위에서 아래로):
- 최신: `docs: update CLAUDE.md for dev dynamicParams change`
- 그 아래: `feat(dev): allow new MDX files to route without server restart`
- 그 아래: `docs: add dev dynamicParams design spec (Phase 6 essential)` (이미 커밋됨)

- [ ] **Step 3: 전체 파이프라인 재검증**

```bash
pnpm type-check && pnpm lint && pnpm build
```

Expected: 모두 성공.

- [ ] **Step 4: 완료 보고**

사용자에게 간결히 보고:

> "Phase 6 필수 기능 완료. `app/posts/[slug]/page.tsx`에서 `export const dynamicParams = false` 한 줄을 삭제해 기본값(`true`)으로 돌렸고, 임시 MDX 파일로 dev 라우팅을 실제로 검증했습니다. 프로덕션 빌드도 여전히 `● /posts/[slug]` SSG 출력 유지. CLAUDE.md §13.1/§15 동기화. 커밋 2건 추가 (+ spec/plan 정정 커밋 1건)."

---

## Self-Review (plan-writer)

**Spec coverage:**
- Spec §"구현 체크리스트" 1 (코드 변경) → Task 1 ✓
- Spec §"구현 체크리스트" 2 (CLAUDE.md §13.1) → Task 4 Step 1 ✓
- Spec §"구현 체크리스트" 3 (CLAUDE.md §15) → Task 4 Step 2 ✓
- Spec §"검증 계획" 1 (dev 즉시 반영) → Task 2 ✓
- Spec §"검증 계획" 2 (프로덕션 빌드 불변) → Task 3 ✓
- Spec §"검증 계획" 3 (잘못된 slug 404) → Task 2 Step 5 ✓
- Spec §"검증 계획" 4 (Velite watch 참고) → Task 2 Step 3 ✓
- Spec §"완료 정의" 모든 체크 → Tasks 1/3/4 종합 ✓

**Placeholder scan:** 모든 스텝에 구체 명령·파일 경로·기대 출력이 있음. TBD/TODO 없음.

**Type consistency:** 단일 파일 1줄 삭제라 타입 교차 의존 없음. 접근은 spec/plan 전체에서 "`export const dynamicParams = false` 삭제 → 기본값 `true`로 복귀"로 일관.

---

## Addendum: Plan Correction (post-initial-attempt)

최초 버전은 `export const dynamicParams = process.env.NODE_ENV !== 'production'` 접근을 명시했다. 구현 후 `pnpm build`에서 즉시 실패:

```
⨯ Unsupported node type "BinaryExpression" at "dynamicParams"
```

Next.js 15의 route segment config 파서는 **literal 값만** 허용한다. top-level `const` 참조도 `Identifier` 거부로 실패. 단일 파일 내 조건부 `dynamicParams`는 불가능.

교정: export를 완전히 제거. `generateStaticParams`가 여전히 모든 slug를 prerender(빌드 출력 `● /posts/[slug]` 확인)하므로 프로덕션 SSG는 유지된다. 로컬 전용 블로그에서 "알 수 없는 slug → dynamic 폴백 → `notFound()`" 경로는 프레임워크 레벨 strict-404와 사용자 관점 동일.

Task 1의 Step들, Task 3의 기대 출력, Task 4의 CLAUDE.md 정정 내용 모두 이 접근에 맞춰 업데이트됨.
