# Blog Writer Skill — 디자인 명세

**작성일**: 2026-04-15
**선행 조건**: Phase 3 완료 (`phase-3-complete` 태그), Quick Sort 스타일 가이드 완성
**관련 CLAUDE.md 섹션**: §1 (콘텐츠 작성 대원칙), §4 (콘텐츠 작성 규칙), §5 (키워드 자동 링크), §6 (인터랙티브 시각화), §7 (디자인 시스템)

---

## 1. 배경 및 목표

Backend Notes 블로그에 새 MDX 포스트를 작성할 때, **사용자가 직접 파일을 만드는 것이 아니라 Claude Code Skill을 통해서만 작성**하는 워크플로를 구축한다. 스킬은 작성 과정 전체를 3단계로 구조화하고, 블로그 고유의 철학(**No silver bullet + 트레이드오프 우선**)을 선제적으로 강제한다.

### 1.1 블로그 정체성

이 블로그는 단순 "기술 사용법" 블로그가 아니다. 모든 글은 다음 7단계 흐름을 따른다:

1. **Why** — 왜 이 주제를 알아야 하는가
2. **Where** — 어디서 마주치는가 (실제 시나리오)
3. **Alternatives & Tradeoffs** — 대안과 트레이드오프
4. **Root Cause** — 근본 원리 (동작 방식보다 깊은 "왜")
5. **How** — 실제 메커니즘
6. **Anti-use cases** — 언제 쓰지 말 것인가
7. **Gotchas** — 실무 함정

**앞 4단계는 필수**, 뒤 3단계는 권장. 이 구조가 "JPA 사용법" 같은 순수 튜토리얼 주제를 자연스럽게 걸러낸다.

### 1.2 목표

1. **스킬을 MDX 파일 생성의 유일한 경로로 확립** — 사용자와 Claude 모두 `content/posts/*.mdx`를 직접 쓰지 않는다
2. **3단계 워크플로로 품질 담보** — 학습 Q&A → 노트 정리 → MDX 생성, 각 단계에 사용자 체크포인트
3. **블로그 철학의 자동 강제** — 사용법 주제 거절·전환 제안, "No silver bullet" 콜아웃 자동 삽입
4. **기존 글과의 교차 참조 자동화** — 중복 설명 방지, `<RelatedPost />` 컴포넌트로 네비게이션 강화
5. **시각화 생성의 체계화** — 시각화 필요 감지 → 사용자 선택 → 일회성 컴포넌트 생성 → Phase 4 프레임워크 준비
6. **완성도 검증** — MDX 생성 후 `pnpm generate-keyword-map` → `pnpm velite` → `pnpm build`까지 자동 검증

### 1.3 Scope (v1.0)

**포함**:
- 새 MDX 글 작성 (3-stage 워크플로)
- Frontmatter 자동 생성 + 충돌 검증
- 시각화 컴포넌트 신규 생성 (일회성)
- SVG 자산 생성
- `components/mdx/components.tsx` 업데이트
- 빌드 검증 루프

**제외 (v1.1 이상으로 이월)**:
- 기존 글 수정
- 기존 글 삭제
- Git commit / push (사용자 영역)
- `pnpm dev` 실행 (사용자 영역)

---

## 2. 주요 결정 사항

브레인스토밍 단계에서 확정된 결정. 각 결정은 스킬의 동작을 규정한다.

### 2.1 스킬 위치 — 프로젝트 로컬

`.claude/skills/blog-writer/`에 배치. 이유: 스킬이 다루는 포맷과 컴포넌트가 이 리포에 종속되어 있고, 오픈소스 공개 시 clone한 다른 Claude Code 유저가 자동으로 사용 가능.

`.gitignore`에 예외 설정 추가해 커밋 대상으로:
```
!.claude/skills/
!.claude/skills/**
```

### 2.2 Stage 1 — 하이브리드 학습 목차

Claude가 7-섹션 철학 구조에 맞는 학습 목차 초안을 제안하고, 사용자가 수정/추가/제거 후 승인한다. 항목별로 Q&A 루프를 돌며, Claude가 각 항목을 먼저 선제적으로 한 번 설명한 뒤 사용자 질문을 받는다.

이유: 자유형 Q&A는 빠뜨리는 부분이 생기고 Stage 2의 "어려웠던 부분 식별" 기준이 흐려진다. 완전 구조형은 사용자 주도권을 잃는다. 하이브리드가 두 마리 토끼를 잡는다.

### 2.3 Stage 2 — 노트 파일 영구 저장

`.claude/drafts/<slug>-notes.md`에 학습 노트를 저장한다. 7-섹션 철학 구조 + Q&A 로그 + 난이도 점수 + Related Posts + MDX 구성 계획을 포함한다. 사용자가 리뷰한 뒤 Stage 3로 진입한다.

`.claude/drafts/`는 `.gitignore`에 이미 포함되어 있어 개인 학습 자산으로 로컬에만 남는다. 스킬은 자동으로 삭제하지 않는다 — 학습 여정 자체가 자산.

### 2.4 Stage 3 — 철학 강제 구조 + 자동 콜아웃

MDX 본문은 Stage 2 노트의 7-섹션 구조를 그대로 본문 섹션으로 매핑한다. **자동 삽입되는 3가지 콜아웃**:
- 글 서두 `info`: "이 글의 학습 목표"
- Alternatives 섹션 상단 `warning`: "No Silver Bullet 원칙"
- Root Cause 섹션 `error`: "핵심 통찰" (가정 깨짐/근본 원리)

### 2.5 교차 참조 시스템 — `<RelatedPost />` 컴포넌트

기존 글에 이미 다뤄진 주제가 Q&A 중 등장하면 Claude는 **깊은 설명을 생략하고 한 줄 요약 + 링크로 대체**한다. 최종 MDX에 `<RelatedPost slug="..." type="prerequisite|deep-dive|parallel" />` 컴포넌트로 렌더한다.

Phase 3의 키워드 자동 링크(인디고 점선)는 너무 소극적이다. `<RelatedPost />`는 카드 형태로 눈에 띄게 표시해 "먼저 이것부터 읽으세요"라는 강한 네비게이션 신호를 전달한다.

### 2.6 시각화 컴포넌트 — 감지 + 사용자 선택 + 일회성 생성

Stage 2 노트 작성 시 스킬이 "시각화 필요" 신호(동작 방식/상태 변화/타이밍 키워드 빈도, 난이도 점수)를 자동 감지하고, Stage 3 진입 직전 사용자에게 후보 목록 + 옵션(신규 컴포넌트 / SVG / 건너뜀)을 제시한다.

신규 컴포넌트는 `components/visualizations/<Name>.tsx`에 `QuickSort.tsx` 패턴(useState 스텝, 사전 계산 스냅샷, Prev/Next/Play/Reset)으로 생성. 상단 주석 `// Phase 4 preview`로 추후 리팩토링 대상 표시.

### 2.7 Frontmatter 자동 생성 + 사용자 승인

스킬이 `title`, `slug`, `date`, `tags`, `keywords`, `summary` 초안을 자동 생성한 뒤 **사용자에게 표 형태로 제시하고 승인/수정**을 받는다. 기존 태그/키워드 목록을 스캔해 중복과 충돌을 방지하고, 신규 태그 생성 시 명시적 경고를 표시한다.

키워드 충돌 방지는 `draft: true`로 초기 저장 → `generate-keyword-map` 실행 → 성공 시 `draft: false`로 전환하는 전략을 사용한다.

### 2.8 검증 루프 + 자동 수정 한계

MDX 생성 후 4단계 검증: `generate-keyword-map` → `velite` → `type-check` → `build`. 각 단계 실패 시 원인 파싱 후 자동 수정 최대 2회 시도. 2회 실패 시 사용자에게 에러 로그 노출하고 중단 (무한 루프 방지).

Git commit/push는 스킬 범위 밖. 사용자가 `/commit` 등으로 별도 수행.

### 2.9 주제 적합성 사전 검증

Stage 1 시작 전에 스킬이 주제를 평가해 블로그 철학과 맞지 않으면 전환 제안을 먼저 한다:
- 순수 사용법/튜토리얼 ("JPA 사용법") → 트레이드오프 각도로 전환 제안
- 단편 팁/치트시트 → 거절
- 개인 회고 → 다른 영역(포트폴리오) 안내

사용자가 명시적으로 "그래도 진행" 이라고 하면 스킬은 진행하되, 한 번 부드럽게 경고한다.

---

## 3. 아키텍처

### 3.1 3-Stage 워크플로

```
[User: "캐시 스탬피드 블로그 써줘"]
        │
        ▼
[Skill 트리거 감지] → SKILL.md 로드
        │
        ▼
[주제 적합성 검증] — references/philosophy.md
        │  적합
        ▼
┌───────────────────────────────────────┐
│  Stage 1: 학습 Q&A 루프                 │
│  references/stage-1-learning.md        │
│                                         │
│  1. 학습 목차 제안 (7-섹션)              │
│  2. 사용자 승인                          │
│  3. 항목별 Q&A 루프                      │
│     - Claude 선제 설명                  │
│     - 사용자 질문 → Claude 답변          │
│     - 난이도 점수 추적                   │
│     - Related Posts 감지                │
│  4. 모든 항목 소진 → 종료 체크포인트       │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Stage 2: 노트 파일 작성                 │
│  references/stage-2-note.md            │
│                                         │
│  1. 7-섹션 철학 구조로 정리               │
│  2. Q&A 로그 + 난이도 점수 기록          │
│  3. Related Posts 목록                  │
│  4. MDX 구성 계획                       │
│  → .claude/drafts/<slug>-notes.md      │
│  5. 사용자 리뷰 체크포인트                │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Stage 3: MDX 생성 + 자산 생성 + 검증     │
│  references/stage-3-mdx.md             │
│  references/frontmatter-rules.md       │
│  references/visualization-rules.md     │
│  references/validation-loop.md         │
│                                         │
│  1. Frontmatter 초안 → 사용자 승인        │
│  2. 시각화 후보 제시 → 사용자 선택         │
│  3. MDX 본문 생성 (자동 콜아웃 3종 포함)   │
│  4. 신규 컴포넌트 생성 (필요 시)          │
│  5. SVG 자산 생성 (필요 시)              │
│  6. components/mdx/components.tsx 업데이트│
│  7. 검증 루프:                          │
│     generate-keyword-map → velite      │
│       → type-check → build             │
│  8. 최종 보고                           │
└───────────────────────────────────────┘
        │
        ▼
[완성 — 사용자는 dev 서버에서 결과 확인 후 커밋]
```

### 3.2 컴포넌트 계층

| 계층 | 역할 | 파일 |
|---|---|---|
| **스킬 정의** | 트리거, 흐름, 규칙 | `.claude/skills/blog-writer/SKILL.md` + `references/` |
| **작성 산출물** | 학습 노트 (로컬 전용) | `.claude/drafts/<slug>-notes.md` |
| **출력물** | 블로그 포스트 | `content/posts/<slug>.mdx` |
| **시각화 자산** | 컴포넌트 + SVG | `components/visualizations/<Name>.tsx`, `public/images/<slug>-*.svg` |
| **MDX 컴포넌트 등록** | 신규 시각화 등록 | `components/mdx/components.tsx` |
| **교차 참조 컴포넌트** | 기존 글로의 강한 링크 | `components/blog/RelatedPost.tsx` (선행 생성) |
| **키워드 맵 재생성** | 빌드 타임 자동 | `lib/generated/keyword-map.ts` |

---

## 4. 스킬 파일 구조

### 4.1 디렉토리

```
.claude/
└── skills/
    └── blog-writer/
        ├── SKILL.md                   ← 진입점 (YAML frontmatter + 본문)
        └── references/
            ├── philosophy.md          ← No silver bullet, 거절 기준, 전환 제안
            ├── stage-1-learning.md    ← Stage 1 Q&A 루프 상세
            ├── stage-2-note.md        ← 노트 템플릿 + 작성 지침
            ├── stage-3-mdx.md         ← MDX 본문 구조 + 자동 콜아웃
            ├── frontmatter-rules.md   ← Frontmatter 생성 로직 + 충돌 해결
            ├── visualization-rules.md ← 시각화 감지/생성/재사용
            ├── validation-loop.md     ← 검증 루프 + 에러 복구
            └── style-guide.md         ← 컴포넌트 레퍼런스 (quick-sort.mdx 기반)
```

### 4.2 Progressive Disclosure 전략

`SKILL.md`는 **얇은 진입점** (~150줄)으로 유지. 각 스테이지별 상세는 `references/*.md`에 분리한다. Claude가 스킬을 호출하면 `SKILL.md`를 먼저 로드하고, 해당 스테이지 진입 시 필요한 레퍼런스만 Read 도구로 **그때그때** 읽는다.

이 패턴은 Anthropic 공식 스킬 작성 가이드(`superpowers:writing-skills`)의 권장 방식이며, 컨텍스트 부담을 최소화한다.

### 4.3 SKILL.md 구조

```markdown
---
name: blog-writer
description: [트리거 구절 + 유일 경로 원칙 + 철학 강제]
---

# Blog Writer

## ⚠️ 절대 규칙
1. MDX 파일 생성의 유일한 경로
2. 철학 기반 거절
3. 단일 입구 (생성·검증만, 수정·삭제 제외)

## 핵심 철학
(No silver bullet, 7-섹션 구조 요약)

## 3-Stage 워크플로
(각 스테이지 1문단 요약 + references/ 포인터)

## 스킬 레퍼런스 (when to read)
(표: 파일명 + 읽는 시점)

## 출력 파일 요약
## 금지 사항 (안티패턴)
```

각 `references/*.md`는 자립적 가이드로 작성 — 해당 파일만 읽어도 그 스테이지 실행 가능.

### 4.4 파일 분량 추정

| 파일 | 예상 줄 수 |
|---|---|
| `SKILL.md` | ~150 |
| `philosophy.md` | ~150 |
| `stage-1-learning.md` | ~200 |
| `stage-2-note.md` | ~250 |
| `stage-3-mdx.md` | ~300 |
| `frontmatter-rules.md` | ~150 |
| `visualization-rules.md` | ~180 |
| `validation-loop.md` | ~120 |
| `style-guide.md` | ~200 |
| **합계** | **~1,700** |

---

## 5. Stage 1 — Learning Loop

### 5.1 흐름 5단계

1. 주제 적합성 사전 검증 (§2.9 거절 기준)
2. 학습 목차 제안 (7-섹션 철학 골격)
3. 사용자 수정/승인
4. 항목별 Q&A 루프 + 난이도 추적
5. 종료 체크포인트 → Stage 2 전환

### 5.2 학습 목차 템플릿

```
1. Why — 왜 이 주제를 알아야 하는가 (필수)
2. Where — 어디서 마주치는가 (필수)
3. Alternatives & Tradeoffs — 대안과 트레이드오프 (필수)
4. Root Cause — 왜 이 문제가 존재하는가 (필수)
5. How — 실제 메커니즘 (권장)
6. Anti-use cases — 언제 쓰지 말 것인가 (권장)
7. Gotchas — 실무 함정 (권장)
```

1~4번은 사용자가 제거 요청해도 스킬이 "이 블로그 철학상 이 섹션은 필수입니다. 정말 제거할까요?"로 재확인한다. 명시적 강제 요구 시 따르되, 블로그 철학에서 벗어남을 경고한다.

### 5.3 항목별 Q&A 루프 패턴

각 항목에서 Claude가 **선제적으로 한 번 설명**한 뒤 사용자 질문을 받는다. "다음" 또는 유사 신호가 있으면 다음 항목으로 진행.

### 5.4 난이도 추적

Stage 1 동안 Claude가 각 항목의 난이도 점수를 내부적으로 추적:
- 사용자 재질문 수
- 오해 교정 횟수 (Claude가 "사실은 반대입니다"로 정정)
- Claude의 자발적 부가 설명 횟수

점수 기준:
- 0~1: 쉬움 (글에서 간단 설명)
- 2~3: 보통 (별도 섹션 + 일반 텍스트)
- 4 이상: 어려움 — MDX에서 콜아웃/시각화 강조 대상

점수는 Stage 2 노트 파일에 기록되어 Stage 3에서 강조 배치의 근거가 된다.

### 5.5 Related Posts 감지

Stage 1 시작 시 스킬이 `lib/generated/keyword-map.ts`를 읽어 기존 글 목록을 파악한다. Q&A 루프 중 사용자 질문이 기존 글의 키워드와 매칭되면:

```
User: 분산 락은 어떻게 동작하는 거예요?

Skill: [내부 감지: SLUG_TO_ENTRY에 "distributed-lock" 존재]

       분산 락은 이 블로그에 이미 별도 글이 있습니다: "Distributed Lock 완벽 가이드".
       거기서 Redlock, Kleppmann 비판, 대안을 깊이 다룹니다.

       여기 캐시 스탬피드 맥락에서 알아야 할 건 딱 한 가지:
       "락으로 스탬피드를 막을 때 락 자체의 정합성도 의심해야 한다"

       최종 MDX의 해당 지점에 <RelatedPost slug="distributed-lock" type="prerequisite" />를
       배치합니다. 다음으로 넘어갈까요?
```

감지된 Related Posts는 Stage 2 노트 파일의 전용 섹션에 기록된다.

### 5.6 종료 조건

- **정상 종료**: 모든 목차 항목 소진
- **조기 종료 (사용자 요청)**: 미진행 항목 목록 표시 + 필수 항목(1~4) 미진행 시 재확인
- **강제 종료 (Claude 판단)**: 토큰 임박/비생산적 반복 시 사용자 승인 요청

---

## 6. Stage 2 — Note Artifact

### 6.1 파일 위치

`.claude/drafts/<slug>-notes.md`. `.gitignore`에 포함되어 로컬 전용.

### 6.2 노트 파일 구조

```markdown
# 학습 노트: <주제>

**작성일**: YYYY-MM-DD
**목표 slug**: `<slug>`
**한 줄 주제**: <한 줄 요약>

## 1. Why
## 2. Where
## 3. Alternatives & Tradeoffs
## 4. Root Cause
## 5. How
## 6. Anti-use cases
## 7. Gotchas

## ─── Stage 1 Q&A 로그 ───
### Section N (항목명) — 난이도 X
**Q**: ...
**A**: ...

## Stage 2 정리: MDX 구성 계획

### 가장 강조할 3가지
### 난이도 높았던 부분 (강조 대상)
### 사용할 MDX 요소
### 교차 참조 (Related Posts)
### 사용할 키워드 (frontmatter 초안)
```

### 6.3 체크포인트

노트 저장 후 Stage 3 진입 전 사용자에게 리뷰 요청:

```
학습 노트를 .claude/drafts/<slug>-notes.md 에 저장했습니다.
파일을 열어 확인하시고 수정하거나 추가할 게 있으면 알려주세요.
수정할 게 없으면 "OK" 라고 말씀해주시면 Stage 3 (MDX 작성) 으로 진행합니다.
```

사용자가 노트를 직접 편집한 경우 스킬은 편집된 버전을 Stage 3의 입력으로 사용한다.

---

## 7. Stage 3 — MDX Generation

### 7.1 본문 구조 매핑

Stage 2 노트의 7-섹션을 MDX 본문 섹션으로 그대로 매핑한다.

```mdx
---
frontmatter
---

[Hook paragraph — 2~3 문장]

<Callout type="info" title="이 글의 학습 목표">
  [자동 삽입 — 3가지 학습 목표]
</Callout>

## 왜 이 주제를 알아야 하는가 (Why)

## 어디서 마주치는가 (Where)

## 대안 비교 — No Silver Bullet (Alternatives & Tradeoffs)

<Callout type="warning" title="No Silver Bullet 원칙">
  [자동 삽입 — 정답 없음, 가정 정의 우선]
</Callout>

| 비교표 |

<RelatedPost slug="..." type="prerequisite" />  (있으면)

## 왜 이 문제가 존재하는가 (Root Cause)

<Callout type="error" title="핵심 통찰">
  [자동 삽입 — 가정 깨짐 / 근본 원리]
</Callout>

## 어떻게 동작하는가 (How)

```python title="..."
...
```

<VisualizationComponent .../>  (필요 시)

## 언제 쓰지 말아야 하는가 (Anti-use cases)

## 실무 함정 (Gotchas)

## 마무리

## 참고 자료
```

### 7.2 자동 삽입 콜아웃

| 위치 | 타입 | 내용 | 필수/선택 |
|---|---|---|---|
| 글 서두 | `info` | "이 글의 학습 목표" (3가지) | 필수 |
| Alternatives 섹션 상단 | `warning` | "No Silver Bullet 원칙" | 필수 |
| Root Cause 섹션 | `error` | "핵심 통찰" (가정 깨짐) | 필수 |

사용자가 "콜아웃 과해, 빼자"라고 하면 제거 가능. 기본값은 3개 모두 삽입.

### 7.3 Hook Paragraph 작성법

2~3 문장. "이 글을 읽으면 무엇을 얻는가" 관점으로 작성. 독자가 본문에 진입할 동기를 부여.

### 7.4 마무리 / 참고 자료 섹션

모든 글이 다음 두 섹션으로 끝난다:
- **마무리**: 핵심 메시지 재강조 ("정답은 없다, 가정을 정의하라" 같은 철학적 닫음)
- **참고 자료**: 외부 링크 (논문, 문서, 참고 서적)

---

## 8. Operational Layer

### 8.1 Frontmatter 자동 생성 규칙

| 필드 | 로직 |
|---|---|
| `title` | Stage 1 주제 + 부제 (노트 한 줄 주제에서 추출) |
| `slug` | 소문자 + 하이픈, 한글은 영문 대표어로 변환 |
| `date` | 오늘 (`YYYY-MM-DD`) |
| `tags` | 기존 태그 우선, 카테고리 상위 태그 1개 이상 필수 |
| `keywords` | 영문 + 한글 + 동의어 1개, 대소문자 정규화 후 충돌 체크 |
| `summary` | 노트 Why 섹션 기반, 10~300자, "읽으면 무엇을 이해하게 되는가" 관점 |

### 8.2 Frontmatter 승인 흐름

```
Skill: Frontmatter 초안을 준비했습니다. 검토해주세요:

  title:    [...]
  slug:     [...]
  date:     2026-04-15
  tags:     [...]
            └─ 기존 태그 N개 중 X개 재사용, Y개 신규
  keywords: [...]
            └─ 기존 키워드 맵과 충돌 체크: 충돌 없음 ✓
  summary:  [...]
            (한 문장 N자)

수정할 항목이 있나요?
```

### 8.3 충돌 방지 전략 — draft:true 우회

1. frontmatter 초안 확정 → MDX 파일을 `draft: true`로 `content/posts/<slug>.mdx`에 저장
2. `pnpm generate-keyword-map` 실행 (draft 제외되므로 충돌 없음)
3. 사용자 승인 + 검증 루프 성공 → `draft: false`로 전환
4. `pnpm generate-keyword-map` 재실행 (정식 등록)

이 전략은 키워드 충돌 dry-run 로직을 재구현할 필요를 없앤다.

### 8.4 신규 태그 경고

```
⚠️ 신규 태그 2개를 만들려 합니다: [GraphQL], [API]
   기존 태그 8개 중 0개 재사용, 신규 2개.
   진행할까요? (또는 기존 태그로 대체 요청)
```

### 8.5 시각화 생성 흐름

**감지** (Stage 2 노트 작성 시):
- "동작 방식", "상태 변화", "타이밍" 등 키워드 빈도 3회 이상
- Q&A 난이도 점수 3 이상
- Root Cause 섹션에 race condition/병렬 키워드

**제안** (Stage 3 진입 직전):

```
Skill: 시각화 후보를 발견했습니다:

  1. "<주제 1>" (Section N) — 난이도 X
     기존 컴포넌트: [있음/없음]
     [A] 신규 컴포넌트 / [B] 정적 SVG / [C] 건너뜀

  2. "<주제 2>" ...

선택: "1-A, 2-B" 또는 "기본값으로"
```

**기본값 판단 기준**:
- **React 컴포넌트 (`[A]`)**: 시간에 따른 상태 변화, 단계별 진행, 동시 실행, 사용자 조작으로 결과가 달라지는 개념 — 알고리즘 단계, Lock 경합 타임라인, GC 마킹 과정, 트랜잭션 Isolation Level playground
- **정적 SVG (`[B]`)**: 관계도, 구조도, 함수 곡선, 트레이드오프 매트릭스 — 캐시 스탬피드 타임라인 개념도, β 파라미터 확률 곡선, B-Tree 노드 구조 스냅샷
- **건너뜀 (`[C]`)**: 텍스트와 코드만으로 충분하거나, 시각화가 오히려 혼란을 주는 경우

### 8.6 신규 컴포넌트 규약

- 경로: `components/visualizations/<PascalCase>.tsx`
- `'use client'` 필수
- `QuickSort.tsx` 패턴 재사용 (useState + 사전 계산 스냅샷 + Prev/Next/Play/Reset)
- CLAUDE.md §6.4 색상 시맨틱
- 상단 주석: `// Phase 4 preview — will be refactored with VisualContainer/StepController`
- `components/mdx/components.tsx`에 자동 등록

### 8.7 중복 검사

신규 컴포넌트 생성 전 `components/visualizations/`를 스캔:
- 정확 매치: 재사용
- 유사 매치: 사용자에게 확인
- 매치 없음: 신규 생성

### 8.8 검증 루프

```
단계 1: pnpm generate-keyword-map
  실패 → 충돌 파싱 → 사용자 해결 옵션 → 재실행 (최대 2회)

단계 2: pnpm velite
  실패 → schema 에러 파싱 → 필드 수정 → 재실행 (최대 2회)

단계 3: pnpm type-check
  실패 → 컴포넌트 import 누락 등 수정 → 재실행 (최대 2회)

단계 4: pnpm build
  실패 → 원인 분석 → 수정 또는 중단
```

자동 수정 최대 2회 한계. 2회 실패 시 에러 노출 + 사용자 개입 요청.

**type-check를 별도 단계로 두는 이유**: Next.js `pnpm build`가 내부적으로 타입 검증을 수행하므로 기능적으로는 중복이다. 그러나 `pnpm type-check`는 5~10초에 실패 신호를 주는 반면 `pnpm build`는 30초 이상 걸린다. 타입 에러는 새 글에서 자주 발생하는 오류(컴포넌트 import 누락, 잘못된 props 타입 등)이므로 **빠른 피드백을 위해** 별도 단계로 유지한다. 사용자 경험상 이 5초가 "스킬이 작동 중"에서 "고칠 게 있음"으로의 전환을 체감적으로 빠르게 만든다.

### 8.9 최종 보고

```
✅ "<제목>" 블로그 생성 완료

작성된 파일:
  ✓ content/posts/<slug>.mdx
  ✓ components/visualizations/<Name>.tsx (신규)
  ✓ public/images/<slug>-*.svg (신규)
  ✓ components/mdx/components.tsx 업데이트
  ✓ lib/generated/keyword-map.ts 재생성

검증 결과:
  ✓ pnpm generate-keyword-map
  ✓ pnpm velite
  ✓ pnpm type-check
  ✓ pnpm build — SSG 성공

테스트: 87개 모두 통과

학습 노트: .claude/drafts/<slug>-notes.md (보존됨)

다음 단계 (사용자 영역):
  - http://localhost:3000/posts/<slug> 에서 직접 확인
  - 커밋: /commit
```

---

## 9. 교차 참조 시스템

### 9.1 `<RelatedPost />` 컴포넌트 스펙

```tsx
interface RelatedPostProps {
  slug: string
  type?: 'prerequisite' | 'deep-dive' | 'parallel'
  label?: string
}
```

### 9.2 3가지 variant

| type | 라벨 기본값 | 시각 스타일 | 사용 시점 |
|---|---|---|---|
| `prerequisite` | "먼저 읽어야 할 글" | 강조 박스, 본문 흐름 중단 | "이 개념을 모르면 이해 어려움" |
| `deep-dive` | "더 깊이 알아보기" | 카드형, 본문 자연스럽게 | "간단히만 언급, 자세한 건 다른 글" |
| `parallel` | "함께 읽으면 좋은 글" | 약한 강조, 작은 카드 | "같은 영역의 다른 각도" |

### 9.3 렌더 내용

모든 variant가 `SLUG_TO_ENTRY`에서 대상 글의 `title` + `summary` 조회해 표시 (Phase 3 KeywordLink Popover와 동일 메커니즘 재활용).

### 9.4 컴포넌트 생성의 선후 관계

`RelatedPost.tsx`는 스킬 구현의 **선행 태스크**로 생성한다. 스킬 배포 시점에 이 컴포넌트가 이미 리포에 존재해야 한다. 스킬은 "이 컴포넌트가 존재한다고 가정"하고 사용한다.

### 9.5 중복 방지

한 MDX 안에 같은 `slug`의 `<RelatedPost />`가 여러 번 등장하는 것은 금지. Stage 3 생성 시 검증. 첫 등장만 유지, 이후는 키워드 자동 링크에 맡김.

---

## 10. 철학 강제 메커니즘

### 10.1 주제 적합성 사전 검증

Stage 1 시작 전 스킬이 주제를 평가해 블로그 철학과 맞지 않으면 전환 제안:

**거절 대상**:
- 순수 사용법/튜토리얼 (예: "JPA 사용법", "Docker 쓰는 법")
- 단편 팁/치트시트 (예: "VS Code 단축키 모음")
- 개인 회고/경력 일기 (포트폴리오 영역)

**전환 제안 템플릿**:

```
Skill: 이 블로그는 "사용법" 중심의 글을 지양합니다.
       철학은 "No silver bullet + 트레이드오프 비교"입니다.

       <주제>를 주제로 가되, 트레이드오프 관점에서 다룰 수 있는 각도:
       1. <대안 각도 1>
       2. <대안 각도 2>
       3. <대안 각도 3>

       이 중 하나로 진행하거나, 다른 각도가 있으면 알려주세요.
       (또는 지금 주제를 "사용법"으로 진행하고 싶다면 그렇게 말씀해주세요.
        강하게 권하진 않지만 사용자 결정을 존중합니다.)
```

### 10.2 거절의 강도

사용자가 명시적으로 "그래도 사용법으로 진행"이라고 말하면 스킬은 진행한다. 철학은 **기본값**이지 **강제**가 아니다. 다만 명시적 재확인을 요구한다.

### 10.3 자동 콜아웃 3종 — 철학 강제의 구조적 장치

- 서두 `info` (학습 목표): 독자가 글을 읽을 이유 명시
- Alternatives `warning` (No silver bullet): 정답 없음 철학 반복 주입
- Root Cause `error` (핵심 통찰): "동작 방식보다 깊은 이해" 강조

이 3종이 매 글에 반복되면서 블로그의 정체성이 자연스럽게 축적된다.

---

## 11. 구현 순서 (6단계)

실제 스킬 배포를 위한 구현 순서.

### 1단계 — 지원 컴포넌트 생성 (스킬 외부)
1. `components/blog/RelatedPost.tsx` 생성 — 3 variant
2. `components/mdx/components.tsx`에 `RelatedPost` 등록
3. `.gitignore` 수정 — `.claude/skills/**` 예외 처리

### 2단계 — 스킬 디렉토리 셋업
1. `.claude/skills/blog-writer/` 생성
2. `SKILL.md` 작성 (얇은 진입점)

### 3단계 — Core references 작성
1. `references/philosophy.md`
2. `references/stage-1-learning.md`
3. `references/stage-2-note.md`

### 4단계 — MDX generation references 작성
1. `references/stage-3-mdx.md`
2. `references/frontmatter-rules.md`

### 5단계 — Operational references 작성
1. `references/visualization-rules.md`
2. `references/validation-loop.md`
3. `references/style-guide.md` (quick-sort.mdx 요약)

### 6단계 — 실제 사용 테스트
1. 시범 주제(예: "Cache Stampede")로 스킬 트리거
2. Stage 1 → Stage 2 → Stage 3 전체 흐름 검증
3. 빌드 녹색 확인
4. 문제 발견 시 해당 references 수정

---

## 12. 완료 기준 (Definition of Done)

- [ ] `components/blog/RelatedPost.tsx` 생성 + mdx 등록
- [ ] `.gitignore` 예외 처리로 `.claude/skills/`가 추적 대상이 됨
- [ ] `.claude/skills/blog-writer/SKILL.md` 작성
- [ ] 8개 references 파일 작성
- [ ] 시범 주제로 전체 워크플로 검증 성공
- [ ] 생성된 MDX가 `pnpm build` 통과
- [ ] 자동 콜아웃 3종이 정확한 위치에 삽입됨
- [ ] Related Posts 감지 → `<RelatedPost />` 배치 확인
- [ ] 시각화 감지 → 사용자 선택 → 컴포넌트 생성 경로 확인
- [ ] 검증 루프가 실패 시 자동 수정(최대 2회) 동작 확인

---

## 13. 알려진 미결 사항 (v1.1 이후)

- **기존 글 수정 모드**: 섹션 추가/교체 등
- **기존 글 삭제 모드**: `draft: true` 전환 또는 파일 삭제
- **Phase 4 시각화 프레임워크 리팩토링**: v1에서 생성된 일회성 컴포넌트들을 `VisualContainer`/`StepController` 기반으로 통합
- **다국어 지원**: 영문 버전 자동 번역 (현재는 한국어 전용)
- **시리즈 글 지원**: `series`/`seriesOrder` 필드를 활용한 연작 글 작성
- **스킬 활용 통계**: 얼마나 자주 사용됐고 어느 스테이지에서 중단/재시도가 많았는지 추적

---

## 14. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|---|---|---|
| Stage 1 Q&A가 너무 길어져 대화가 비대해짐 | 스킬 실행 효율 저하 | Claude는 토큰 한계를 직접 감지할 수 없음. 대신 휴리스틱으로 "한 항목에서 재질문 5회 이상" 또는 "전체 Q&A 라운드 30회 이상" 도달 시 사용자에게 "이 정도면 Stage 2로 넘어가도 될 것 같습니다"라고 제안. 사용자 승인 시에만 전환 |
| 사용자가 철학에 안 맞는 주제를 고집 | 블로그 정체성 희석 | 부드럽게 경고 + 사용자 결정 존중. 궁극적으로는 사용자 판단이 우선 |
| 시각화 컴포넌트 양산 → 중복/품질 저하 | `components/visualizations/` 복잡도 증가 | 중복 검사 + Phase 4 리팩토링 준비 주석. 시범 사용 후 기준 재조정 |
| 자동 수정 루프가 무한 반복 | 스킬 hang | 각 단계 2회 한계. 초과 시 사용자 에러 노출하고 중단 |
| Velite schema 변경으로 스킬이 frontmatter 생성 실패 | 빌드 실패 | frontmatter 생성 로직을 `references/frontmatter-rules.md`로 분리해 schema 변경 시 이 파일만 업데이트 |
| `RelatedPost` 컴포넌트가 스킬 배포 전에 없음 | 스킬 첫 사용 실패 | 구현 1단계에서 선행 생성. 스킬 자체는 이 컴포넌트 존재를 가정 |
| Stage 2 노트 편집 후 Stage 3가 편집된 내용을 못 읽음 | 사용자 편집 유실 | Stage 3 진입 시 반드시 노트 파일을 다시 Read 도구로 읽어 최신 상태 사용 |
| `content/posts/` 직접 편집 경로가 막혀도 우회 시도 가능 | 규칙 회피 | Claude가 사용자/자신이 `content/posts/*.mdx`를 직접 쓰려는 시도를 감지하면 즉시 스킬로 전환 유도. SKILL.md 상단의 "절대 규칙"으로 강제 |
