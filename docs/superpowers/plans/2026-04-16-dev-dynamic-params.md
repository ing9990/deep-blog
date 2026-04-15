# Dev dynamicParams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 새 MDX 파일을 dev 서버 재시작 없이 `/posts/<slug>`로 즉시 라우팅되게 만들되, 프로덕션의 엄격한 SSG 404 정책은 유지한다.

**Architecture:** `app/posts/[slug]/page.tsx`의 route segment config `dynamicParams`를 `process.env.NODE_ENV !== 'production'`로 전환한다. Next.js/webpack이 이 값을 빌드 상수로 치환하므로 dev에서는 `true`, production에서는 `false`가 된다. 나머지(Velite watch, `getPostBySlug`, `notFound()`)는 기존 구현 그대로 사용한다.

**Tech Stack:** Next.js 15 App Router, Velite 0.2 (webpack plugin watch 모드), TypeScript.

**Spec:** `docs/superpowers/specs/2026-04-16-dev-dynamic-params-design.md`

---

## File Structure

이 변경이 건드리는 파일:

- **Modify**: `app/posts/[slug]/page.tsx` — `dynamicParams` export 한 줄 교체
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

## Task 1: `dynamicParams`를 NODE_ENV에 따라 분기

**Files:**
- Modify: `app/posts/[slug]/page.tsx:15`

- [ ] **Step 1: 현재 상태 확인**

Read the file to see the exact context around line 15:

```bash
# Use Read tool: /Users/ing9990/Document/backend-notes/app/posts/[slug]/page.tsx
```

Expected line 15: `export const dynamicParams = false`

- [ ] **Step 2: 한 줄 교체**

Use Edit tool:

- `old_string`: `export const dynamicParams = false`
- `new_string`: `export const dynamicParams = process.env.NODE_ENV !== 'production'`

이 문자열은 파일 전체에서 유일하므로 `replace_all` 불필요.

- [ ] **Step 3: TypeScript 타입 체크 통과 확인**

Run:

```bash
pnpm type-check
```

Expected: 에러 없이 종료 (exit 0). `dynamicParams`의 타입은 `boolean | 'force-static' | ...`로 정의돼 있고 `process.env.NODE_ENV !== 'production'`는 `boolean`이므로 통과해야 한다.

만약 TypeScript가 `dynamicParams`에 literal 값을 요구한다고 에러를 낸다면, `as const` 같은 hack 없이는 해결이 어려우므로 즉시 중단하고 사람에게 보고. (현재 Next.js 15에서는 문제 없음을 확인했지만 minor 버전 업데이트로 변경 가능성은 존재.)

- [ ] **Step 4: ESLint 통과 확인**

Run:

```bash
pnpm lint
```

Expected: 새로운 경고/에러 없음.

- [ ] **Step 5: 코드 변경 단독 커밋**

```bash
git add app/posts/[slug]/page.tsx
git commit -m "$(cat <<'EOF'
feat(dev): allow new MDX files to route without server restart

Switch dynamicParams on NODE_ENV so dev mode accepts arbitrary slugs
(falling through to getPostBySlug → notFound() for unknown ones) while
production keeps strict SSG 404 behavior.

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

- [ ] **Step 2: 빌드 출력에서 `/posts/[slug]` 라우트가 static으로 prerender 되는지 확인**

빌드 로그 끝부분의 "Route" 테이블을 본다. Next.js는 각 라우트를 다음 기호로 표시:

- `○ (Static)` — 정적으로 prerender됨 ✓ **기대값**
- `● (SSG)` — `generateStaticParams`로 prerender됨 ✓ **기대값 (이쪽이 더 정확할 수 있음)**
- `ƒ (Dynamic)` — 서버 런타임 렌더 ✗ **실패 — 변경이 production에 누수됐다는 뜻**

`/posts/[slug]`가 `ƒ (Dynamic)`으로 표시되면 이 플랜의 핵심 전제가 깨진 것이다. 즉시 중단하고 사람에게 보고. (예상 원인: `process.env.NODE_ENV`가 Next 15 build에서 상수 치환되지 않는 환경 문제, 혹은 config parsing 버그.)

`○` 또는 `●`로 표시되면 계속.

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
| `dynamicParams = process.env.NODE_ENV !== 'production'` | production에서는 알 수 없는 slug 즉시 404 (100% SSG 유지), dev에서는 새 MDX 파일이 재시작 없이 라우트됨 | **잔존 한계**: 새 MDX 안에서 선언한 *새 키워드*의 기존 글 자동 링크는 여전히 `pnpm generate-keyword-map` + dev 재시작 필요. Velite config가 로드 타임에 키워드 맵을 캡처하기 때문 |
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
# pattern: dynamicParams = process.env.NODE_ENV
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

> "Phase 6 필수 기능 완료. `app/posts/[slug]/page.tsx`의 `dynamicParams`가 dev에서는 `true`, production에서는 `false`가 되도록 변경했고, 임시 MDX 파일로 dev 라우팅을 실제로 검증했습니다. 프로덕션 빌드도 기존과 동일한 SSG 출력. CLAUDE.md §13.1/§15도 동기화. 커밋 2건 추가."

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

**Type consistency:** 단일 파일 1줄 변경이라 타입 교차 의존 없음. `dynamicParams` 값은 spec/plan 전체에서 `process.env.NODE_ENV !== 'production'`로 일관.
