---
name: blog-writer
description: Backend Notes 블로그의 새 MDX 포스트를 3단계(학습 Q&A → 노트 정리 → MDX 생성)로 작성하는 스킬. "블로그 써줘", "새 글 작성", "포스트 만들어줘", "<주제> 블로그", "<주제> 글 쓰자", "글 작성", "블로그 쓰자", "포스트 작성" 등의 요청 시 반드시 사용한다. 이 스킬은 `content/posts/*.mdx` 파일 생성의 유일한 경로이며, 사용자가 직접 MDX를 만들려 하거나 Claude가 다른 방법으로 만들려 하면 즉시 이 스킬로 전환해야 한다. 철학: "No silver bullet + 트레이드오프 우선" — 단순 사용법/튜토리얼 주제(예: "JPA 사용법", "Docker 쓰는 법")는 거절하거나 트레이드오프 각도로 전환 제안한다.
---

# Blog Writer

Backend Notes 블로그(`content/posts/`)의 MDX 포스트를 3단계 워크플로로 생성하는 스킬.

## ⚠️ 절대 규칙

1. **MDX 파일 생성의 유일한 경로**: `content/posts/*.mdx`는 이 스킬 없이 생성하면 안 된다. 사용자나 Claude가 다른 방법(직접 Write, 다른 스킬, 마이그레이션 스크립트 등)으로 MDX를 쓰려 하면 즉시 이 스킬로 전환하라.
2. **철학 기반 거절**: 순수 "사용법/튜토리얼" 주제는 거절하거나 트레이드오프 각도로 전환 제안한다. 거절 기준과 전환 제안 예시는 `references/philosophy.md` 참고.
3. **단일 입구**: 새 글 생성·검증까지가 이 스킬의 범위다. 기존 글 수정·삭제는 v1.1 이후로 이월되었다. 사용자가 수정/삭제를 요청하면 "v1.1에서 지원 예정. 지금은 직접 편집해주세요"로 안내한다.

## 핵심 철학

이 블로그는 **"No silver bullet + 트레이드오프 우선"** 입장을 취한다. 모든 글은 다음 7단계 흐름을 따른다:

1. **Why** — 왜 이 주제를 알아야 하는가
2. **Where** — 어디서 마주치는가 (실제 시나리오)
3. **Alternatives & Tradeoffs** — 대안과 트레이드오프 (필수 비교표)
4. **Root Cause** — 근본 원리 (동작 방식보다 깊은 "왜")
5. **How** — 실제 메커니즘
6. **Anti-use cases** — 언제 쓰지 말 것인가
7. **Gotchas** — 실무 함정

**1~4번은 필수**, 5~7번은 권장. 단순 "X 사용법", "Y 설정 방법" 같은 주제는 이 블로그의 정체성과 어긋난다. 사용자가 그런 주제를 요청하면 `references/philosophy.md`의 거절 기준과 전환 제안 예시를 참고해 트레이드오프 각도로 재구성을 제안하라.

## 3-Stage 워크플로

### Stage 1: 학습 Q&A 루프

사용자가 스킬을 트리거하면 다음 순서로 진행한다:

1. **주제 적합성 사전 검증** — `references/philosophy.md`의 거절 기준 적용
2. **학습 목차 제안** — 7-섹션 철학 골격에 맞춘 초안 제시
3. **사용자 수정/승인** — 1~4번은 필수임을 알리고, 제거 요청 시 재확인
4. **항목별 Q&A 루프** — Claude가 각 항목을 선제적으로 한 번 설명한 뒤 사용자 질문 받기. 난이도 점수 추적
5. **Related Posts 감지** — 기존 글에 이미 다뤄진 주제가 등장하면 깊은 설명 생략하고 한 줄 요약 + `<RelatedPost />` 배치 약속
6. **종료 체크포인트** — 모든 항목 소진 후 사용자 확인

상세: `references/stage-1-learning.md`

### Stage 2: 노트 파일 작성

Stage 1이 끝나면 `.claude/drafts/<slug>-notes.md`에 학습 노트를 저장한다. 7-섹션 철학 구조 + Q&A 로그 + 난이도 점수 + Related Posts 목록 + MDX 구성 계획이 포함된다. 사용자에게 리뷰 체크포인트를 제공한 뒤 Stage 3로 진입한다. `.claude/drafts/`는 `.gitignore` 처리되어 로컬 전용 학습 자산으로 보존된다.

상세: `references/stage-2-note.md`

### Stage 3: MDX 생성 + 자산 생성 + 검증

노트를 입력으로 실제 MDX 파일, 필요 시 신규 시각화 컴포넌트, SVG 자산을 생성한다. 자동 콜아웃 3종(학습 목표 / No silver bullet / 핵심 통찰)과 `<RelatedPost />` 교차 참조를 정해진 위치에 배치한다. 마지막으로 검증 루프(`generate-keyword-map` → `velite` → `type-check` → `build`)를 실행해 완성도를 보장한다.

상세: `references/stage-3-mdx.md`, `references/frontmatter-rules.md`, `references/visualization-rules.md`, `references/validation-loop.md`

## 스킬 레퍼런스 (when to read)

| 파일 | 언제 읽는가 |
|---|---|
| `references/philosophy.md` | **매 트리거 시작 시점** — 주제 적합성 검증에 필수 |
| `references/stage-1-learning.md` | Stage 1 진입 시 |
| `references/stage-2-note.md` | Stage 1 → Stage 2 전환 시 |
| `references/stage-3-mdx.md` | Stage 2 → Stage 3 전환 시 |
| `references/frontmatter-rules.md` | Stage 3 진입 직후 frontmatter 초안 생성 시 |
| `references/visualization-rules.md` | Stage 3 중 시각화 필요성 감지 시 |
| `references/validation-loop.md` | Stage 3 후반 검증 단계 진입 시 |
| `references/style-guide.md` | MDX 본문 작성 중 컴포넌트/코드블록 문법 확인 필요 시 |

레퍼런스는 **on-demand**로 읽는다. 모든 파일을 미리 읽지 말고, 해당 스테이지에 진입할 때 Read 도구로 그때그때 로드하라. 이는 Anthropic 공식 progressive disclosure 패턴을 따른다.

## 출력 파일 요약

이 스킬이 성공적으로 완료되면 다음이 생성/수정된다:

- **필수**: `content/posts/<slug>.mdx` (검증 후 `draft: false`로 확정)
- **필수**: `lib/generated/keyword-map.ts` (재생성)
- **선택**: `components/visualizations/<Name>.tsx` (시각화 필요 시 신규)
- **선택**: `public/images/<slug>-<descriptor>.svg` (정적 다이어그램 필요 시)
- **선택**: `components/mdx/components.tsx` (신규 시각화 컴포넌트 등록 시)
- **보존**: `.claude/drafts/<slug>-notes.md` (학습 노트, 자동 삭제 안 함)

## 금지 사항 (안티패턴)

- ❌ "사용법" 주제를 받아들이고 그대로 진행 — 철학 전환 제안을 건너뛰지 말 것
- ❌ Stage 1을 건너뛰고 곧바로 MDX 작성 — 학습 기반이 없으면 글 품질이 무너짐
- ❌ 기존 글이 있는 개념을 또다시 깊게 설명 — 중복. 반드시 `<RelatedPost />`로 대체
- ❌ 자동 수정 루프를 3회 이상 반복 — 무한 루프 위험. 2회 실패 시 사용자에게 에러 노출
- ❌ 사용자 승인 없이 frontmatter 확정 — 키워드 충돌 위험. 반드시 표 형태로 제시 후 "OK" 대기
- ❌ 검증 루프 생략 — 생성 완료 선언 전에 반드시 `pnpm build`까지 녹색 확인
- ❌ Git commit/push — 사용자 영역. 스킬은 작성과 검증까지만
- ❌ `pnpm dev` 자동 실행 — 사용자 영역
- ❌ 기존 글 수정/삭제 — v1.1 이월. v1.0에서는 거절하고 사용자에게 직접 편집 안내

## 사용자에게 진입 시 보이는 첫 메시지 (참고)

스킬이 트리거되면 다음 형태로 시작:

```
[blog-writer 스킬 진입]

주제: <사용자가 말한 주제>

이 블로그는 "No silver bullet + 트레이드오프 우선" 철학을 따릅니다.
주제가 이 철학과 맞는지 먼저 확인합니다...

[philosophy.md 로드 후 주제 적합성 검증 진행]
```
