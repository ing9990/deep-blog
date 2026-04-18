---
name: blog-writer
description: DEEP 블로그의 새 MDX 포스트를 3단계(학습 Q&A → 노트 정리 → MDX 생성)로 작성하는 스킬. "블로그 써줘", "새 글 작성", "포스트 만들어줘", "<주제> 블로그", "<주제> 글 쓰자", "글 작성", "블로그 쓰자", "포스트 작성" 등의 요청 시 반드시 사용한다. 이 스킬은 `content/posts/*.mdx` 파일 생성의 유일한 경로이며, 사용자가 직접 MDX를 만들려 하거나 Claude가 다른 방법으로 만들려 하면 즉시 이 스킬로 전환해야 한다. 철학: "기술 주제를 최대한 이해하기 쉽게 정리" — 내부적 작동, 기술이 필요한 이유, 트레이드오프 비교를 다룬다.
---

# Blog Writer

DEEP 블로그(`content/posts/`)의 MDX 포스트를 3단계 워크플로로 생성하는 스킬.

## ⚠️ 절대 규칙

1. **MDX 파일 생성의 유일한 경로**: `content/posts/*.mdx`는 이 스킬 없이 생성하면 안 된다. 사용자나 Claude가 다른 방법(직접 Write, 다른 스킬, 마이그레이션 스크립트 등)으로 MDX를 쓰려 하면 즉시 이 스킬로 전환하라.
2. **철학 기반 주제 안내**: 단편 팁/치트시트, 개인 회고는 이 블로그의 방향과 맞지 않으므로 전환 제안한다. 거절 기준은 `references/philosophy.md` 참고. 사용법/튜토리얼 주제도 "내부 작동 원리 + 왜 필요한가" 각도로 깊이를 더해 진행할 수 있다.
3. **단일 입구**: 새 글 생성·검증까지가 이 스킬의 범위다. 기존 글 수정·삭제는 v1.1 이후로 이월되었다. 사용자가 수정/삭제를 요청하면 "v1.1에서 지원 예정. 지금은 직접 편집해주세요"로 안내한다.

## 핵심 철학

이 블로그는 **기술 주제를 최대한 이해하기 쉽게 정리**하는 것을 목표로 한다. 이해를 돕기 위해 **내부적 작동, 기술이 필요한 이유, 트레이드오프 비교**를 다룬다. 모든 글은 다음 7단계 흐름을 따른다:

1. **Why** — 왜 이 주제를 알아야 하는가
2. **Where** — 어디서 마주치는가 (실제 시나리오)
3. **Alternatives & Tradeoffs** — 대안과 트레이드오프 (필수 비교표)
4. **Root Cause** — 근본 원리 (동작 방식보다 깊은 "왜")
5. **How** — 실제 메커니즘
6. **Anti-use cases** — 언제 쓰지 말 것인가
7. **Gotchas** — 실무 함정

**1~4번은 필수**, 5~7번은 권장. 사용법/튜토리얼 주제도 "왜 필요한가 + 내부 작동 + 트레이드오프" 각도를 더해 깊이 있게 다룰 수 있다.

## 진입 모드 (Entry Modes)

이 스킬에 들어오는 경로는 두 가지다. 두 모드 모두 **노트가 Stage 1 시작 시점에 생성되어 Q&A 동안 live로 업데이트된다**는 점은 동일하며, §1 주제 검증 이후의 흐름도 동일하다.

- **Mode A — 직접 트리거**: 사용자가 "블로그 써줘", "X 포스트 만들어줘", "X 글 작성" 등으로 명시적 트리거. 즉시 Stage 1 §1로 진입.
- **Mode B — 프로액티브 Offer**: 사용자가 기술 질문을 이어갈 때 Claude가 "이 주제 블로그로 정리해둘까요?"를 선제 제안하는 경로. 사용자가 수락하면 이미 나눈 대화 맥락을 노트에 append하고 Stage 1으로 합류. Mode B 발동 기준(원리·설계 질문, 주제당 1회, 거절 대상 제외)은 `references/stage-1-learning.md` §0.5 참조.

두 모드 모두 **노트는 Stage 2에서 새로 만드는 것이 아니다** — Stage 1 시작 시점에 `.claude/drafts/<slug>-notes.md`에 생성되고, Q&A 루프 동안 비유 후보, 콜아웃 후보, 시각화 후보, 원본 Q&A가 live로 append된다. Stage 2는 그 노트를 **최종화**하고 MDX 구성 계획을 추가하는 단계다.

## 3-Stage 워크플로

### Stage 1: 인터뷰 & 노트 live 로깅

진입 모드에 따라 시작이 다르지만, §1 이후는 동일한 흐름이다.

- **Mode B에서만**: §0.5 프로액티브 offer 판정 → §0.6 노트 즉시 생성 + 기존 대화 append
- **공통 흐름 (양 모드)**:
  1. **주제 적합성 사전 검증** — `references/philosophy.md`의 거절 기준 적용
  2. **주제 타입 분류** (§1.5) — Type A (Fundamentals) vs Type B (Tools & Frameworks)
  3. **학습 목차 제안** — 확정된 타입에 맞는 섹션 골격 템플릿
  4. **사용자 수정/승인** — 1~4번 필수 안내
  5. **항목별 Q&A 루프** — Claude 선제 설명 + 사용자 질문. **매 체크포인트 또는 신호 감지 시 노트를 live 업데이트** (비유·콜아웃·시각화 후보 플래그).
  6. **Related Posts 감지** — 기존 글과 중복 감지 시 `<RelatedPost />` 배치 약속
  7. **MDX 전환 체크포인트** — 사용자 명시 트리거 OR Claude 1회 제안 (1~4번 필수 섹션이 충분히 쌓인 시점)

상세: `references/stage-1-learning.md`

### Stage 2: 노트 최종화 + MDX 구성 계획

**노트는 이미 Stage 1에서 live로 쌓여 있다**. Stage 2는 그 노트를 검토·최종화하는 단계로, 빈 섹션을 보완하고 라이브 로깅 필드(비유·콜아웃·시각화 후보)를 Stage 3 MDX의 강조 수단으로 변환한다. Related Posts 매핑, 난이도 점수, frontmatter 초안도 이 시점에 확정된다. 노트는 **사용자에게 보이지 않는 agent 전용 산물**이므로 기본적으로 리뷰 체크포인트 없이 Stage 3로 진입한다. `.claude/drafts/`는 `.gitignore` 처리되어 로컬 전용 학습 자산으로 보존된다.

상세: `references/stage-2-note.md`

### Stage 3: MDX 생성 + 자산 생성 + 검증

최종화된 노트를 입력으로 실제 MDX 파일과 필요 시 신규 시각화 컴포넌트(React, [A-1] 인터랙티브 또는 [A-2] 정적)를 생성한다. 자동 콜아웃 3종(학습 목표 / 핵심 포인트 / 핵심 통찰)과 `<RelatedPost />` 교차 참조를 정해진 위치에 배치한다. 마지막으로 검증 루프(`generate-keyword-map` → `velite` → `type-check` → `build`)를 실행해 완성도를 보장한다.

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
- **선택**: `components/visualizations/<Name>.tsx` (시각화 필요 시 신규 — React [A-1] 또는 [A-2])
- **선택**: `components/mdx/components.tsx` (신규 시각화 컴포넌트 등록 시)
- **보존**: `.claude/drafts/<slug>-notes.md` (학습 노트, 자동 삭제 안 함)

## 금지 사항 (안티패턴)

- ❌ 단편 팁/치트시트/개인 회고를 그대로 진행 — 전환 제안을 건너뛰지 말 것
- ❌ Stage 1을 건너뛰고 곧바로 MDX 작성 — 학습 기반이 없으면 글 품질이 무너짐
- ❌ 기존 글이 있는 개념을 또다시 깊게 설명 — 중복. 반드시 `<RelatedPost />`로 대체
- ❌ 자동 수정 루프를 3회 이상 반복 — 무한 루프 위험. 2회 실패 시 사용자에게 에러 노출
- ❌ 사용자 승인 없이 frontmatter 확정 — 키워드 충돌 위험. 반드시 표 형태로 제시 후 "OK" 대기
- ❌ 검증 루프 생략 — 생성 완료 선언 전에 반드시 `pnpm build`까지 녹색 확인
- ❌ Git commit/push — 사용자 영역. 스킬은 작성과 검증까지만
- ❌ `pnpm dev` 자동 실행 — 사용자 영역
- ❌ 기존 글 수정/삭제 — v1.1 이월. v1.0에서는 거절하고 사용자에게 직접 편집 안내

## 사용자에게 진입 시 보이는 첫 메시지 (참고)

### Mode A (직접 트리거)

```
[blog-writer 스킬 진입]

주제: <사용자가 말한 주제>

이 블로그는 "기술 주제를 최대한 이해하기 쉽게 정리"하는 철학을 따릅니다.
주제를 어떤 각도로 다룰지 확인합니다...

[philosophy.md 로드 후 주제 적합성 검증 진행]
```

### Mode B (프로액티브 offer 수락 후)

```
[blog-writer 스킬 진입 — offer 수락 경로]

주제: <offer에서 언급한 주제>

노트를 .claude/drafts/<slug>-notes.md 에 생성하고, 지금까지 나눈 대화를
노트에 append했습니다. 앞으로 대화 동안 노트가 계속 쌓일 예정입니다.

타입 분류와 간단한 목차 확인을 진행합니다...

[stage-1-learning.md 로드 후 §0.6 즉시 생성 → §1.5 타입 분류 → §2 목차]
```
