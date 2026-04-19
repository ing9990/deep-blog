# DEEP 기여 가이드

관심 가져주셔서 감사합니다. DEEP은 개인 블로그라 외부 코드 기여 범위는 제한적이지만, 오타 수정·콘텐츠 정정·작은 버그 수정은 환영합니다. 이 문서는 로컬 워크플로, 브랜치 전략, 포스트 작성 규칙을 다룹니다.

> English: [CONTRIBUTING.md](./CONTRIBUTING.md)

## 행동 강령

이슈와 PR에서 서로 존중해주세요. 사람이 아니라 아이디어를 비평해주세요.

## 로컬 셋업

사전 요구사항과 부트스트랩 명령은 [README.ko.md](./README.ko.md#시작하기)를 참고하세요. 요약하면 다음과 같습니다.

```bash
corepack enable
pnpm install
PORT=3010 pnpm dev   # http://blog.localhost:3010/ 접속
```

## 브랜치 전략

`develop → feature → main` 흐름을 따릅니다.

| 브랜치 | 용도 |
| --- | --- |
| `main` | 프로덕션 (<https://ing9990.com> 배포). `develop`에서 리뷰 완료된 PR로만 갱신. |
| `develop` | 통합 브랜치. 릴리스 준비가 되면 `main`으로 머지. |
| `feature/<주제>` | 작업 단위 1개당 1 브랜치. `develop`에 squash-merge. |

- 기능 작업은 `develop`에서 분기: `git checkout -b feature/<short-topic>`.
- 브랜치는 짧게 유지하세요. `develop`이 많이 진행되면 rebase 합니다.
- **`main` 또는 `develop`에 force-push 금지.** 본인 feature 브랜치에서, 다른 사람이 협업하지 않을 때만 force-push.

## 커밋 메시지

기존 컨벤션(`type(scope): subject`)을 따릅니다. `git log` 최근 예시:

```
fix(header,mobile): move post TOC out of header into a right-edge clip FAB
fix(css,mobile): clip horizontal overflow at html, not just body
docs(claude-md): document emphasis guard and tag taxonomy invariants
fix(mdx,ci): enforce bold+punctuation emphasis guard via prebuild
```

자주 쓰는 type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`.

- subject는 ~72자 이내.
- 무엇이 아니라 **왜** 바뀌었는지 본문에 설명하세요. diff가 무엇은 이미 보여줍니다.
- 1 커밋 = 1 논리 변경. 무관한 수정을 묶지 마세요.

## 제출 전 체크리스트

PR 열기 전에 로컬에서 실행하세요.

```bash
pnpm type-check        # tsc --noEmit
pnpm lint              # next lint + stylelint (토큰 규칙)
pnpm test              # velite build + vitest run
pnpm build             # 변경 규모가 크면 전체 프로덕션 빌드
```

MDX frontmatter를 수정했다면 추가로 실행하세요.

```bash
pnpm generate-keyword-map
```

…그리고 재생성된 `lib/generated/keyword-map.ts`를 같이 커밋하세요.

UI를 수정했다면 수동 확인:

- 라이트 + 다크 테마
- 모바일 너비 (375px) — 브라우저 기기 툴바 사용
- 키워드 링크 Popover 정상 동작
- dev 서버 로그(`BashOutput`)에 신규 에러 없음

## Pull Request

- PR 1개당 주제 1개. 브랜치가 커졌다면 리뷰 요청 전에 분리하세요.
- 제목: 커밋 subject와 동일 컨벤션.
- 설명: 짧은 요약, 동기, 테스트 플랜(실행한 명령, 수동 확인 항목).
- 관련 이슈가 있다면 링크.

## 포스트 작성

> **`content/posts/` 하위 모든 신규 MDX 포스트는 `blog-writer` 스킬로 생성합니다.** 직접 파일을 `Write`하는 경로는 지원하지 않습니다. 스킬이 frontmatter, validation, 시각화 규칙을 강제합니다.

기존 포스트의 콘텐츠 정정(오타, 깨진 링크, 사실 수정)은 MDX를 직접 편집해도 괜찮습니다. *신규* 포스트는 주제 논의를 위해 이슈를 먼저 열어주세요.

포스트 파이프라인:

1. **Frontmatter validation** — `velite.config.ts`의 Zod 스키마 (`title`/`summary`는 `{ ko, en }`, `tags`는 lowercase-hyphen, 유효한 `category`).
2. **Emphasis 가드** — `scripts/check-mdx-emphasis.ts`가 `predev` / `prebuild` / `pretest`에서 `**"…"**` 와 `**(…)**` 패턴을 차단합니다. 구두점은 bold 바깥으로: `"**X**"`, `**X**(Y)`.
3. **키워드 맵 재생성** — `scripts/generate-keyword-map.ts`가 모든 포스트의 `keywords`로부터 `lib/generated/keyword-map.ts`를 만듭니다. **1 키워드 = 1 글**, 충돌 시 빌드 중단. 생성된 파일은 커밋 대상.
4. **Velite 빌드** — MDX를 `.velite/` 하위 타입 콜렉션으로 컴파일.
5. **자동 링크** — `plugins/remark-auto-link.ts`가 MDX 컴파일 시 키워드 언급을 `<KeywordLink>` Popover로 치환합니다. 자기-링크 방지는 파일 basename ↔ slug 비교로 동작하므로, 파일명은 반드시 `slug` 필드와 동일해야 합니다.

### 사용 가능한 MDX 컴포넌트

- `<Callout type="info|warning|note">…</Callout>`
- `<Tabs group?="lang">` 안에 `<Tab label="…">…</Tab>`. `<Tabs>` 래퍼는 Server Component, `<TabsView>`가 Client Component입니다. `Tabs.tsx`에 `'use client'`를 다시 붙이지 **마세요** — RSC 스트리밍이 깨져 Shiki 블록이 포함된 탭이 사라집니다.
- `components/visualizations/` 하위 인터랙티브 시각화. 신규 추가는 해당 디렉토리에 Client Component를 만들고 `components/mdx/components.tsx`에 등록하면 됩니다.
- KaTeX (`$inline$`, `$$block$$`) 및 Shiki 펜스드 코드 블록 (라인 하이라이트 주석 `// [!code highlight]`).

### 스타일 하드코딩은 차단됩니다

ESLint와 Stylelint가 하드코딩된 디자인 값을 거부합니다. 새 상수가 필요하면 `app/globals.css`에 CSS 변수로 정의하고(`@theme inline`에 primitive, `:root`에 semantic alias), [`docs/design-tokens.md`](./docs/design-tokens.md)에 문서화한 뒤, 컴포넌트에서 변수를 참조하세요. 전체 금지 목록은 `CLAUDE.md` §5 / §6, 규칙은 `.eslintrc.json`과 `.stylelintrc.json`에 있습니다.

## 이슈 보고

이슈에 다음을 포함해주세요.

- 짧은 제목.
- 재현 절차 (영향받는 페이지 URL, 브라우저, 뷰포트 크기).
- 예상 동작 vs 실제 동작.
- 관련된 경우 스크린샷 또는 녹화.

보안 이슈는 공개 이슈 대신 메인테이너에게 이메일로 알려주세요.

## 질문

이 문서가 불명확하다면 `question` 태그를 단 디스커션이나 이슈를 열어주세요.
