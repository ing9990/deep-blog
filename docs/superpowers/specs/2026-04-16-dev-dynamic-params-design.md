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

`app/posts/[slug]/page.tsx:15`:

```tsx
// 변경 전
export const dynamicParams = false

// 변경 후
export const dynamicParams = process.env.NODE_ENV !== 'production'
```

**작동 방식**

| 모드 | `dynamicParams` | 동작 |
|---|---|---|
| Development (`next dev`) | `true` | 임의의 slug도 컴포넌트 실행. `getPostBySlug(slug)`가 Velite watch로 갱신된 `.velite/posts.json`에서 찾으면 렌더, 없으면 `notFound()`. |
| Production (`next build`) | `false` | 빌드 타임 `generateStaticParams` 목록 외의 slug는 엄격히 404. **기존 동작과 동일**. |

`process.env.NODE_ENV`는 Next.js/webpack이 빌드 시 상수 치환하므로 Next.js의 route segment config 요구사항(정적 분석 가능한 값)을 만족한다. `next build`에서는 `'production'` 문자열로 치환되어 `dynamicParams = false`가, `next dev`에서는 `'development'`로 치환되어 `dynamicParams = true`가 된다.

### 왜 이 1줄로 충분한가

기존 구조에 이미 모든 조각이 준비돼 있다:

1. `VeliteWebpackPlugin`의 watch 모드 → 파일 추가 시 `.velite` 재생성
2. webpack HMR → `.velite/index.js` 변경 감지 → `lib/posts.ts`가 import한 모듈 무효화
3. `getPostBySlug`는 호출 시 최신 `rawPosts`를 참조 → 새 포스트 탐색 성공
4. 기존 slug가 없으면 `getPostBySlug`가 `undefined` 반환 → `notFound()` fire (이미 구현됨, `app/posts/[slug]/page.tsx:24`)

유일하게 닫혀 있던 문이 `dynamicParams = false`였다.

### 범위 밖 (의식적으로 제외)

**키워드 맵 자동 재생성은 이번 범위에 포함하지 않는다.** 새 MDX 파일에서 선언한 새 키워드가 기존 글 본문에 자동 링크되려면 다음 두 가지가 필요한데, 두 번째가 구현 복잡도를 급격히 올린다:

1. `scripts/generate-keyword-map.ts`를 파일 변경 시 재실행 (비교적 쉬움)
2. **Velite config 리로드** — `velite.config.ts`가 module-load time에 `KEYWORD_MAP`을 import해 `remarkAutoLink`에 전달하므로, `lib/generated/keyword-map.ts`가 변해도 이미 실행 중인 Velite watch는 구 맵을 그대로 사용. 새 맵을 반영하려면 Velite 자체를 재시작하거나 config hot-reload 메커니즘이 필요.

현재 방향성(로컬 전용, 개인 학습 노트)에서 이 두 번째 조건의 구현 복잡도는 수용 불가. 새 키워드의 자동 링크 반영은 여전히 수동 워크플로우(`pnpm generate-keyword-map` + dev 재시작)로 남긴다. 필요성을 실제로 체감한 시점에 별도 페이즈로 재평가한다.

### 사용자 체감 변화

| 시나리오 | Before | After |
|---|---|---|
| 새 MDX 파일 추가, 해당 글의 `/posts/<slug>` 접속 | 404 (재시작 필요) | **즉시 렌더** |
| 새 MDX 파일이 인덱스 페이지 `/`에 표시 | 이미 동작 | 동작 (변화 없음) |
| 새 MDX 안에서 선언한 새 키워드가 기존 글에 자동 링크 | 수동 재생성 + 재시작 필요 | 수동 재생성 + 재시작 필요 (변화 없음) |
| 프로덕션에서 알 수 없는 slug | 404 | 404 (변화 없음) |
| 존재하지 않는 slug를 dev에서 접속 | 404 | 404 (`notFound()`) |

## 구현 체크리스트

1. **코드 변경** — `app/posts/[slug]/page.tsx:15`를 `export const dynamicParams = process.env.NODE_ENV !== 'production'`으로 교체.
2. **CLAUDE.md 업데이트** — §13.1의 "dev HMR 한계" 항목을 "dev에서는 `dynamicParams`를 자동으로 풀어 새 MDX 파일을 재시작 없이 라우트. 단, 새 키워드의 기존 글 자동 링크는 여전히 `pnpm generate-keyword-map` + 재시작 필요"로 정정.
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

- `pnpm build` 실행
- 빌드 로그에서 `/posts/[slug]`가 정적(○) 페이지로 prerender 되는지 확인. `ƒ (Dynamic)` 로 표시되면 설계 실패
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
| Next.js 15가 `dynamicParams`의 non-literal 표현을 거부 | 낮음 | 빌드 실패 | `process.env.NODE_ENV`는 Next이 권장하는 빌드 상수. 다른 오픈소스 Next 프로젝트에서도 동일 패턴 사용 확인 가능. 빌드 실패 시 즉시 감지되므로 프로덕션 사고 불가 |
| dev에서 알려지지 않은 slug에 렌더 시도 → 런타임 에러 | 낮음 | dev 화면 깨짐 | `getPostBySlug`가 이미 `undefined` 반환 → `notFound()` fire. 코드상 검증됨 |
| 프로덕션 동작 변경 | 없음 | — | `NODE_ENV === 'production'`에서 `dynamicParams = false`는 기존과 동일 |

## 완료 정의 (Definition of Done)

- [ ] `app/posts/[slug]/page.tsx:15` 한 줄 변경 커밋
- [ ] 검증 계획 1~3 모두 통과 (4는 참고)
- [ ] CLAUDE.md §13.1, §15 업데이트 커밋
- [ ] `pnpm build` + `pnpm type-check` + `pnpm lint` 통과
