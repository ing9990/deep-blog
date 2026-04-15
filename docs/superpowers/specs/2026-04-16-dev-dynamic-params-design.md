# Dev 모드에서 새 MDX 파일 즉시 라우팅 — 설계 문서

- **날짜**: 2026-04-16
- **범위**: 작성 편의성 개선 (Phase 6 필수 항목 단일 건)
- **변경 규모**: 1 파일 / 1 줄 + 문서 동기화

## 배경

`CLAUDE.md §1`에서 정의한 핵심 목표는 "`.mdx` 파일 하나만 만들면 인덱싱·키워드 링크·메타데이터 처리가 자동화"되는 작성 편의성이다. 그러나 현재 dev 서버에서 새 `.mdx` 파일을 추가하면 `/posts/<slug>` 라우트가 **dev 서버 재시작 전까지 404**를 반환한다. 이 통증은 `CLAUDE.md §13.1`의 "dev HMR 한계" 항목과 `§15`의 미결 사항에 이미 기록돼 있다.

Phase 6 재검토 과정에서 로컬 전용·개인 학습 노트라는 현 방향성에 비추어 다른 모든 Phase 6 항목(이미지 blur, 폰트 preload, Playwright E2E, Phase 4.2/4.3 프레임워크 등)은 과잉으로 판단해 제외했다. 오직 이 404 통증만이 작성 흐름을 직접 끊는 "필수"로 남았다.

## 문제 원인

404의 진짜 원인은 키워드 맵 stale이 **아니다**. 원인 분리:

1. **Velite webpack 플러그인은 이미 watch 모드로 동작 중** — `next.config.mjs`의 `VeliteWebpackPlugin`이 `build({ watch: true })`를 호출해 `content/posts/**/*.mdx` 변경을 감시하고 `.velite/posts.json`을 재생성한다. 인덱스 페이지(`/`)의 포스트 목록이 dev에서 갱신되는 이유가 이것.
2. **차단 지점은 `app/posts/[slug]/page.tsx:15`의 `export const dynamicParams = false`** — 이 플래그는 `generateStaticParams`가 반환한 초기 slug 목록 외의 slug를 dev 모드에서도 엄격히 차단한다. 새 MDX 파일은 `.velite/posts.json`에는 반영되지만, Next.js dev 서버는 `dynamicParams = false`를 이유로 그 slug를 라우트하지 않는다.

즉 단 하나의 플래그가 작성 흐름을 끊고 있었다.

## 설계

### 유일한 코드 변경

`app/posts/[slug]/page.tsx`:

```tsx
// 변경 전
export const dynamicParams = false

// 변경 후
// (줄 삭제 — export 자체를 제거)
```

즉, `export const dynamicParams = false` 한 줄을 **완전히 제거**한다. 이렇게 하면 route segment config가 기본값(`dynamicParams: true`)으로 돌아간다.

**작동 방식**

| 모드 | 동작 |
|---|---|
| Development (`next dev`) | `generateStaticParams`가 현재 `.velite/posts.json` 기준으로 slug 목록을 반환. Velite webpack 플러그인이 watch 모드라 새 MDX 파일이 추가되면 `.velite`가 즉시 재생성되고 `getAllSlugs()`가 호출될 때 새 slug가 반환됨. 기본값 `dynamicParams = true`이므로 목록에 없는 slug도 차단 없이 컴포넌트로 내려가 `getPostBySlug` → 없으면 `notFound()`. |
| Production (`next build`) | `generateStaticParams`가 빌드 타임에 모든 slug를 반환 → 각 slug가 **SSG**로 prerender됨 (빌드 출력에 `● /posts/[slug]` + 개별 slug 목록 표시). 알 수 없는 slug는 `dynamicParams = true` 기본값에 의해 런타임 dynamic 렌더를 시도하게 되지만, `getPostBySlug`가 즉시 `undefined`를 반환 → `notFound()` → 404. |

**핵심 포인트**: `dynamicParams` export를 제거해도 `/posts/[slug]`는 프로덕션에서 여전히 SSG(`●`)로 표시된다. `generateStaticParams`가 빌드 타임에 모든 포스트를 prerender하기 때문이다. `dynamicParams = true`(기본값)는 "알 수 없는 slug가 들어왔을 때 dynamic 폴백을 허용할지"만 결정하며, 이미 알려진 slug의 프리렌더링에는 영향을 주지 않는다.

### 초기 설계 실패와 교정

**초기 설계**(`dynamicParams = process.env.NODE_ENV !== 'production'`)는 구현 후 `pnpm build`에서 즉시 실패했다:

```
⨯ Next.js can't recognize the exported `config` field in route "/posts/[slug]/page":
Unsupported node type "BinaryExpression" at "dynamicParams".
```

**원인**: Next.js 15의 route segment config 파서는 export된 값이 **AST 리터럴**이어야 한다고 강제한다. `BinaryExpression`, `Identifier`(top-level const를 통한 참조 포함) 등 비-리터럴 노드는 모두 거부된다. 이는 webpack constant-folding 이전에 Next이 자체 AST 워커로 route config를 수집하기 때문이며, `process.env.NODE_ENV`가 빌드 상수로 대체되는 것과 무관하다.

검증한 두 가지 변형 모두 거부되었다:
1. `export const dynamicParams = process.env.NODE_ENV !== 'production'` → `BinaryExpression` 거부
2. `const IS_DEV = process.env.NODE_ENV !== 'production'; export const dynamicParams = IS_DEV` → `Identifier` 거부 (`Unknown identifier "IS_DEV"`)

**교정**: 단일 파일 내에서 `dynamicParams`를 조건부로 만드는 것은 Next.js 15에서 **불가능**하다. 유일하게 빌드가 통과하는 방법은 리터럴(`true`/`false`) 혹은 export 생략이다. 로컬 전용 블로그에서는 프로덕션의 "알려지지 않은 slug에 대한 프레임워크 레벨 strict-404"와 "dynamic 폴백 후 `notFound()` 404"의 차이가 cosmetic이므로, export를 생략(`dynamicParams = true` 기본값)하는 방향이 최소 변경이며 정확하다.

### 왜 이것이 충분한가

기존 구조에 이미 모든 조각이 준비돼 있다:

1. `VeliteWebpackPlugin`의 watch 모드 → 파일 추가 시 `.velite` 재생성 (`next.config.mjs`)
2. webpack HMR → `.velite/index.js` 변경 감지 → `lib/posts.ts`가 import한 모듈 무효화
3. `getAllSlugs()`/`getPostBySlug`는 호출 시 최신 `rawPosts`를 참조 → 새 포스트 탐색 성공
4. 알 수 없는 slug는 `getPostBySlug`가 `undefined` 반환 → `notFound()` fire (`app/posts/[slug]/page.tsx`)

유일하게 닫혀 있던 문이 `dynamicParams = false`였다. 그 문을 제거하면 된다.

### 범위 밖 (의식적으로 제외)

**키워드 맵 자동 재생성은 이번 범위에 포함하지 않는다.** 새 MDX 파일에서 선언한 새 키워드가 기존 글 본문에 자동 링크되려면 다음 두 가지가 필요한데, 두 번째가 구현 복잡도를 급격히 올린다:

1. `scripts/generate-keyword-map.ts`를 파일 변경 시 재실행 (비교적 쉬움)
2. **Velite config 리로드** — `velite.config.ts`가 module-load time에 `KEYWORD_MAP`을 import해 `remarkAutoLink`에 전달하므로, `lib/generated/keyword-map.ts`가 변해도 이미 실행 중인 Velite watch는 구 맵을 그대로 사용. 새 맵을 반영하려면 Velite 자체를 재시작하거나 config hot-reload 메커니즘이 필요.

현재 방향성(로컬 전용, 개인 학습 노트)에서 이 두 번째 조건의 구현 복잡도는 수용 불가. 새 키워드의 자동 링크 반영은 여전히 수동 워크플로우(`pnpm generate-keyword-map` + dev 재시작)로 남긴다. 필요성을 실제로 체감한 시점에 별도 페이즈로 재평가한다.

### 사용자 체감 변화

| 시나리오 | Before (`dynamicParams = false`) | After (export 제거) |
|---|---|---|
| 새 MDX 파일 추가, 해당 글의 `/posts/<slug>` 접속 | 404 (재시작 필요) | **즉시 렌더** |
| 새 MDX 파일이 인덱스 페이지 `/`에 표시 | 이미 동작 | 동작 (변화 없음) |
| 새 MDX 안에서 선언한 새 키워드가 기존 글에 자동 링크 | 수동 재생성 + 재시작 필요 | 수동 재생성 + 재시작 필요 (변화 없음) |
| 기존 포스트의 SSG prerender | `● /posts/[slug]` | `● /posts/[slug]` (변화 없음) |
| 프로덕션에서 알 수 없는 slug | 프레임워크 404 | dynamic 폴백 → `notFound()` 404 (사용자 관점 동일) |
| 존재하지 않는 slug를 dev에서 접속 | 404 | 404 (`notFound()`) |

## 구현 체크리스트

1. **코드 변경** — `app/posts/[slug]/page.tsx`에서 `export const dynamicParams = false` 한 줄을 **삭제**. 다른 수정 없음.
2. **CLAUDE.md 업데이트** — §13.1의 "dev HMR 한계" 항목을 "`/posts/[slug]`는 `generateStaticParams` + 기본 `dynamicParams = true` 조합. 프로덕션에서 기존 포스트는 SSG로 prerender, 알 수 없는 slug는 `notFound()`로 fall-through. dev에서는 Velite watch 덕에 새 MDX 파일이 재시작 없이 라우트됨"으로 정정.
3. **CLAUDE.md §15 정리** — HMR 미결 항목에서 404 부분을 제거하고 "키워드 맵 자동 재생성 + Velite config 리로드 (작성자가 체감하면 재평가)"로 좁힘.

## 검증 계획

수동 검증만 수행 (route segment config는 단위 테스트 대상이 아님):

### 1. Dev 모드 즉시 반영

- 이미 떠 있는 `pnpm dev` 세션(포트 3010) 유지
- `content/posts/` 하위에 테스트용 임시 MDX 파일 생성 (frontmatter는 스키마 통과하도록 완비)
- 브라우저에서 `http://blog.localhost:3010/posts/<new-slug>` 접속
- **기대**: 재시작 없이 페이지 렌더됨
- 테스트 파일 삭제, `.velite` 자동 재생성 확인

### 2. 프로덕션 빌드 불변

- `pnpm build` 실행 → 성공 (exit 0)
- 빌드 로그의 "Route (app)" 테이블에서 `/posts/[slug]`가 `● (SSG)`로 표시되고, 아래에 모든 기존 slug가 나열되는지 확인. `ƒ (Dynamic)` 로 표시되면 설계 실패
- `pnpm type-check` 통과
- `pnpm lint` 통과

### 3. 잘못된 slug 404

- dev에서 `http://blog.localhost:3010/posts/does-not-exist-xyz` 접속
- **기대**: Next.js 기본 404 페이지 (또는 프로젝트의 not-found UI)

### 4. Velite watch 자체 검증 (참고)

- dev 로그에 `VeliteWebpackPlugin` 또는 Velite watcher 관련 출력이 있는지 확인
- 테스트 MDX 생성 후 `.velite/posts.json`의 mtime이 갱신되는지 확인

## 리스크 평가

| 리스크 | 확률 | 영향 | 완화 |
|---|---|---|---|
| 알려지지 않은 slug에 렌더 시도 → 런타임 에러 | 낮음 | dev/prod 화면 깨짐 | `getPostBySlug`가 즉시 `undefined` 반환 → `notFound()` fire. 코드상 검증됨 |
| 프로덕션 SSG 속성 손실 | 없음 | — | `generateStaticParams`가 모든 slug를 여전히 반환 → 빌드 출력 `● (SSG)` 확인됨 |
| 프로덕션 "알 수 없는 slug" 처리가 dynamic 폴백으로 바뀜 | 없음 (수용) | cosmetic | 로컬 전용 블로그라 `next start` 노출이 없음. 사용자 관점에서 응답은 동일한 404 |
| Next.js 15가 비-리터럴 `dynamicParams` 값을 거부 | **확정** (초기 설계에서 실현됨) | 빌드 실패 | 리터럴이 아닌 값을 쓰지 않는다. export 자체를 생략하는 방식으로 우회 |

## 완료 정의 (Definition of Done)

- [ ] `app/posts/[slug]/page.tsx`에서 `export const dynamicParams = false` 삭제 커밋
- [ ] 검증 계획 1~3 모두 통과 (4는 참고)
- [ ] CLAUDE.md §13.1, §15 업데이트 커밋
- [ ] `pnpm build` + `pnpm type-check` + `pnpm lint` 통과
- [ ] 빌드 출력에서 `/posts/[slug]`가 `● (SSG)`로 표시됨을 확인
