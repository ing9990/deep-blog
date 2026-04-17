# Blog Writer Section Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** blog-writer 스킬의 타입별 섹션 골격을 7단계에서 5단계(What/Why/How/When or Problems/Tradeoffs)로 교체하고, 기존 database-index-deep-dive.mdx를 새 구조로 재작성한다.

**Architecture:** 5개 레퍼런스 파일의 섹션 관련 부분만 교체. 3-Stage 파이프라인, 시각화 규칙, 검증 루프는 변경 없음. 스킬 수정 후 기존 MDX를 새 구조로 재작성하고 빌드 검증.

**Tech Stack:** Markdown (skill references), MDX (blog post), pnpm build pipeline

---

### Task 1: philosophy.md — 섹션 골격 교체

**Files:**
- Modify: `.claude/skills/blog-writer/references/philosophy.md:60-98`

- [ ] **Step 1: 섹션 골격 테이블 교체**

`## 섹션 골격 (Type별 변형)` 부터 `### 공통 원칙` 끝까지를 아래로 교체:

```markdown
## 섹션 골격 (Type별 변형)

주제 유형에 따라 섹션 골격이 분기한다. 두 변형 모두 1~4번이 필수이다.

### Type A — Fundamentals 골격

| 순서 | 섹션 | 필수 여부 | 핵심 질문 |
|---|---|---|---|
| 1 | What | 필수 | 이것은 무엇인가? |
| 2 | Why | 필수 | 왜 필요한가? (없을 때 vs 있을 때 내부 동작 비교) |
| 3 | How | 필수 | 어떻게 동작하는가? (내부 메커니즘, 구조) |
| 4 | When | 필수 | 언제 사용하고 언제 사용하지 말아야 하는가? |
| 5 | Tradeoffs | 권장 | 비용과 트레이드오프는? (쓰기 비용, 메모리 등) |

**Type A의 중심**: Section 3 (How)이 글의 **가장 큰 축**이다. CS 하부 제약이 구조를 강제하는 인과 관계를 여기서 풀어낸다.

### Type B — Tools & Frameworks 골격

| 순서 | 섹션 | 필수 여부 | 핵심 질문 |
|---|---|---|---|
| 1 | What | 필수 | 이것은 무엇인가? |
| 2 | Why | 필수 | 왜 필요한가? (도입 전 vs 후) |
| 3 | How | 필수 | 내부적으로 어떻게 동작하는가? (문법이 아닌 메커니즘) |
| 4 | Problems | 필수 | 사용 시 마주치는 실전 문제들은? |
| 5 | Tradeoffs | 권장 | 도입의 대가는? (사이드 이펙트, 복잡성, 운영 비용) |

**Type B의 중심**: Section 4 (Problems)가 글의 **가장 큰 축**이다. 단순 사용법을 넘어 실전 문제와 사이드 이펙트까지 다룬다.

### 공통 원칙

두 유형 모두 1~4번 중 하나라도 작성이 어렵다면 그 주제는 글감으로 약할 수 있다. 그 경우 사용자와 상의해 각도를 조정한다. 사용자가 6번 이상의 커스텀 항목을 추가하는 것도 허용한다.
```

- [ ] **Step 2: 타입별 글의 초점 차이 업데이트**

`### 타입별 글의 초점 차이` 섹션 (line 55-58)을 아래로 교체:

```markdown
### 타입별 글의 초점 차이

- **Type A에서**: "이것이 무엇이고, 왜 필요하며, 내부에서 어떻게 동작하고, 언제 써야 하는가"를 중심으로 설명한다. 핵심은 **정의 → 필요성 → 메커니즘 → 적용 기준**의 단계적 이해.
- **Type B에서**: "이것이 무엇이고, 왜 필요하며, 내부에서 어떻게 동작하고, 실전에서 어떤 문제를 만나는가"를 중심으로 설명한다. 핵심은 **정의 → 필요성 → 메커니즘 → 실전 문제 + 도입의 대가**.
```

- [ ] **Step 3: 확인**

Read로 수정된 philosophy.md를 다시 읽어 섹션 골격 테이블이 5단계로 정확히 교체되었는지 확인.

---

### Task 2: stage-1-learning.md — 학습 목차 템플릿 교체

**Files:**
- Modify: `.claude/skills/blog-writer/references/stage-1-learning.md:210-274`

- [ ] **Step 1: Type A 학습 목차 템플릿 교체**

`### Type A — Fundamentals 템플릿` 의 코드 블록 (line 218-243)을 아래로 교체:

```
주제: <주제>
타입: Type A (CS 지식)

이 타입은 "이것이 무엇이고, 어떻게 동작하는가"를 중심 축으로 합니다.
다음 학습 목차를 제안합니다:

  1. What — 이것은 무엇인가 (필수)
  2. Why — 왜 필요한가 (필수)
  3. How — 어떻게 동작하는가 (필수)
  4. When — 언제 사용하고 언제 피해야 하는가 (필수)
  5. Tradeoffs — 비용과 트레이드오프 (권장)

Type A에서는 3번 (How)이 글의 가장 큰 축입니다.
CS 하부 제약이 구조를 강제하는 인과 관계를 여기서 풀어냅니다.

수정하거나 추가할 항목이 있으면 알려주세요. 예:
  - "3번은 더 자세히 — 디스크 I/O 레벨까지"
  - "5번 제외"
  - "6번으로 '실측 벤치마크' 추가"

수정 없으면 "OK"라고 말씀해주세요. 1번부터 시작합니다.
```

- [ ] **Step 2: Type B 학습 목차 템플릿 교체**

`### Type B — Tools & Frameworks 템플릿` 의 코드 블록 (line 247-272)을 아래로 교체:

```
주제: <주제>
타입: Type B (기술·도구)

이 타입은 "내부 동작 + 실전 문제"를 중심 축으로 합니다.
다음 학습 목차를 제안합니다:

  1. What — 이것은 무엇인가 (필수)
  2. Why — 왜 필요한가 (필수)
  3. How — 내부적으로 어떻게 동작하는가 (필수)
  4. Problems — 사용 시 마주치는 실전 문제들 (필수)
  5. Tradeoffs — 도입의 대가 (권장)

Type B에서는 4번 (Problems)이 글의 가장 큰 축입니다.
단순 사용법이 아닌, 도입 후 마주치는 실전 문제와 사이드 이펙트까지 다룹니다.

수정하거나 추가할 항목이 있으면 알려주세요. 예:
  - "4번은 더 자세히"
  - "5번은 제외"
  - "6번으로 '운영 모니터링' 추가"

수정 없으면 "OK"라고 말씀해주세요. 1번부터 시작합니다.
```

- [ ] **Step 3: §4 Q&A 타입별 강조점 업데이트**

`### 타입별 Q&A 강조점` 섹션 (line 328-333)을 아래로 교체:

```markdown
### 타입별 Q&A 강조점

Claude의 선제 설명과 사용자 질문 유도는 타입별로 다른 각도를 향한다.

- **Type A (CS 지식)** — "이것이 무엇이고 왜 존재하며 내부에서 어떻게 동작하는가"를 파고드는 질문을 유도한다. 예: "이 구조 없이 더 단순하게 만들 수 없나요?", "내부에서 실제로 어떤 일이 일어나나요?", "언제 이걸 쓰면 안 되나요?". Claude의 선제 설명은 개념의 정의에서 시작해 내부 메커니즘으로 자연스럽게 이어지도록 구성한다.
- **Type B (기술·도구)** — "내부 동작과 실전 문제"를 파고드는 질문을 유도한다. 예: "이걸 도입하면 어떤 문제가 생기나요?", "사이드 이펙트는 뭐가 있나요?", "내부에서 이 동작이 왜 이렇게 설계되었나요?". Claude의 선제 설명은 내부 메커니즘을 먼저 풀어낸 뒤, 실전에서 마주치는 문제들로 이어진다.
```

- [ ] **Step 4: 확인**

Read로 수정된 stage-1-learning.md의 §2, §4 섹션을 다시 읽어 템플릿이 정확히 교체되었는지 확인.

---

### Task 3: stage-2-note.md — 노트 템플릿 교체

**Files:**
- Modify: `.claude/skills/blog-writer/references/stage-2-note.md:20-84`

- [ ] **Step 1: 노트 파일 헤더 + 섹션 뼈대 교체**

노트 파일 템플릿 (line 21-77 내부의 마크다운 코드 블록)을 아래로 교체:

````markdown
# 학습 노트: <주제>

**작성일**: YYYY-MM-DD
**목표 slug**: `<slug>`
**타입**: Type <A | B> — <"CS 지식" | "기술·도구">
**한 줄 주제**: <한 줄 요약>

> **⚠️ 타입에 따라 섹션 4 구성이 달라진다**. Type A는 When, Type B는 Problems.

---

## 1. What

<!-- 이것은 무엇인가 — 핵심 정의 -->
<!-- 독자가 이 개념을 한 문장으로 설명할 수 있게 -->

## 2. Why

<!-- 왜 필요한가 — 없을 때 vs 있을 때 비교 -->
<!-- 흔한 오해 1개 이상 -->
<!-- 이 글을 다 읽으면 이해하는 것 3~5개 -->

## 3. How

<!-- 내부적으로 어떻게 동작하는가 -->
<!-- 단계별 메커니즘, 어려운 부분에 ⚠️ 마크 -->
<!-- Type A: CS 제약이 구조를 강제하는 인과 관계 포함 -->
<!-- Type B: 문법이 아닌 내부 메커니즘 중심 -->

## 4. When  *(Type A)*

<!-- 언제 사용하고 언제 사용하지 말아야 하는가 -->
<!-- 적합한 상황 + 부적합한 상황 각각 2~3개 -->

## 4. Problems  *(Type B)*

<!-- 사용 시 마주치는 실전 문제들 -->
<!-- 각 문제의 원인과 완화 방법 -->
<!-- 사이드 이펙트, 운영 이슈 -->

## 5. Tradeoffs

<!-- 도입/사용의 대가 -->
<!-- 비용, 복잡성, 운영 부담 -->
<!-- Type A: 쓰기 비용, 메모리 등 구조적 비용 -->
<!-- Type B: 사이드 이펙트, 운영 비용, 복잡성 -->

---

## ─── 라이브 로깅 필드 (Stage 1 §4 Q&A 중 append-only) ───
````

- [ ] **Step 2: Type A 변형 섹션 교체**

`## Type A 변형 — 섹션 3/4/5 교체` (line 175-203)를 아래로 교체:

```markdown
## Type A 변형

Type A에서는 메인 템플릿의 Section 4를 When으로 사용한다. Section 1, 2, 3, 5와 라이브 로깅 필드, MDX 구성 계획 부분은 두 타입 공통이다.

**Type A 핵심**: Section 3 (How)이 글 전체의 지적 무게 중심이다. CS 하부 제약이 이 구조를 어떻게 강제했는지의 인과 관계를 여기서 풀어내며, 가장 긴 본문이 되도록 구성한다.
```

- [ ] **Step 3: 각 섹션 작성 지침 업데이트**

`## 각 섹션 작성 지침` (line 207~) 의 내용을 새 5단계에 맞게 교체:

```markdown
## 각 섹션 작성 지침

### 1. What

- 이 주제의 핵심 정의를 기술한다 — 독자가 한 문장으로 설명할 수 있는 수준
- 필요하면 비유를 사용한다 (예: "인덱스는 책의 목차와 같다")
- 관련 용어를 정리한다 (예: 클러스터드 인덱스, 세컨더리 인덱스)

### 2. Why

- 이 기술이 없을 때 발생하는 구체적인 문제를 기술한다
- 없을 때 vs 있을 때의 내부 동작 차이를 비교한다
- 흔한 오해를 하나 이상 나열한다
- "이 글을 다 읽으면 이해하는 것" 3~5개 항목으로 마무리한다

### 3. How

- Type A: CS 하부 제약(디스크 I/O, 메모리 계층 등)이 이 구조를 강제하는 인과 관계를 드러낸다
- Type B: 문법이 아닌 내부 메커니즘을 설명한다
- 단계별 동작을 작성한다. 어려운 부분에 ⚠️ 마크
- 이 섹션이 글에서 가장 길고 깊어야 한다

### 4. When (Type A) / Problems (Type B)

**Type A — When**:
- 언제 사용하고 언제 사용하지 말아야 하는가를 구체화한다
- 적합한 상황 2~3개 + 부적합한 상황 2~3개

**Type B — Problems**:
- 사용 시 마주치는 실전 문제들을 구체화한다
- 각 문제의 원인, 증상, 완화 방법을 포함한다
- 사이드 이펙트, 운영 이슈를 다룬다

### 5. Tradeoffs

- 도입/사용의 대가를 구체화한다
- 비용, 복잡성, 운영 부담을 포함한다
- Type A: 구조적 비용 (쓰기 비용, 메모리, 공간 등)
- Type B: 사이드 이펙트, 운영 비용, 시스템 복잡성
```

- [ ] **Step 4: 확인**

Read로 수정된 stage-2-note.md를 확인.

---

### Task 4: stage-3-mdx.md — MDX 매핑 + 콜아웃 배치 교체

**Files:**
- Modify: `.claude/skills/blog-writer/references/stage-3-mdx.md:7-40`
- Modify: `.claude/skills/blog-writer/references/stage-3-mdx.md:59-139`
- Modify: `.claude/skills/blog-writer/references/stage-3-mdx.md:270-363`

- [ ] **Step 1: 본문 구조 매핑 교체**

`## 본문 구조 매핑` 섹션 (line 7-40)을 아래로 교체:

```markdown
## 본문 구조 매핑

노트의 5-섹션을 MDX H2 섹션으로 매핑한다. **타입에 따라 섹션 4의 매핑이 달라지므로**, Stage 2 노트 헤더의 `타입` 필드를 먼저 확인한 뒤 해당 타입의 매핑을 그대로 따른다.

### Type A 매핑 (CS 지식)

| 노트 섹션 | MDX 헤딩 |
|---|---|
| 1. What | `## <주제>란 (What)` |
| 2. Why | `## 왜 필요한가 (Why)` |
| 3. How | `## 어떻게 동작하는가 (How)` |
| 4. When | `## 언제 사용하고 언제 피해야 하는가 (When)` |
| 5. Tradeoffs | `## 비용과 트레이드오프 (Tradeoffs)` |

### Type B 매핑 (기술·도구)

| 노트 섹션 | MDX 헤딩 |
|---|---|
| 1. What | `## <주제>란 (What)` |
| 2. Why | `## 왜 필요한가 (Why)` |
| 3. How | `## 내부적으로 어떻게 동작하는가 (How)` |
| 4. Problems | `## 실전에서 마주치는 문제들 (Problems)` |
| 5. Tradeoffs | `## 도입의 대가 (Tradeoffs)` |

### 공통 규칙

H2 제목은 주제 맥락에 맞는 자연스러운 한국어 + 영문 섹션명을 병기한다 (예: `어떻게 동작하는가 (How)`). 고정 문구가 아니라 주제에 따라 자연스러운 한국어 제목을 쓴다. Section 5는 노트에 해당 내용이 실질적으로 기술되어 있을 때만 생성한다.

**두 타입 모두**: Section 3 (How)이 글 전체 분량의 큰 부분을 차지해야 한다 — 이 섹션이 짧으면 미완성이다.
```

- [ ] **Step 2: 자동 콜아웃 3종 배치 교체**

`## 자동 삽입 콜아웃 3종` 섹션 (line 59-139)에서 warning과 error 콜아웃의 위치를 수정:

**warning (핵심 포인트)**:
- 위치: **Section 3 (How) 상단**, 메커니즘 설명 직전
- Type A: `"이 구조를 이해하는 핵심"` — CS 제약 언급
- Type B: `"이 기술의 핵심 동작"` — 내부 메커니즘 요약

**error (핵심 통찰)**:
- 위치: **Section 3 (How) 내부**, 핵심 메커니즘 직전
- Type A: CS 제약의 필연성
- Type B: 내부 동작의 핵심 원리

- [ ] **Step 3: 전체 MDX 골격 예시 교체**

`## 전체 MDX 골격 예시` 섹션 (line 270-363)을 새 5단계 구조에 맞게 교체. Type A 기준 골격:

````mdx
---
title: "<주제명>"
slug: "<slug>"
date: <YYYY-MM-DD>
tags:
  - <태그>
keywords:
  - <키워드>
summary: "<요약>"
---

[Hook paragraph — 2~3문장]

<Callout type="info" title="이 글의 학습 목표">
  1. <~을 이해한다>
  2. <~을 구분할 수 있다>
  3. <~하는 기준을 얻는다>
</Callout>

## <주제>란 (What)

[정의, 핵심 개념, 관련 용어]

## 왜 필요한가 (Why)

[없을 때 vs 있을 때 비교, 흔한 오해]

## 어떻게 동작하는가 (How)

<Callout type="warning" title="이 구조를 이해하는 핵심">
  [핵심 메커니즘 요약]
</Callout>

<Callout type="error" title="핵심 통찰: <한 줄>">
  [가장 중요한 한 문장]
</Callout>

[내부 메커니즘 상세 — 글에서 가장 긴 섹션]

## 언제 사용하고 언제 피해야 하는가 (When)

[적합한 상황 + 부적합한 상황]

## 비용과 트레이드오프 (Tradeoffs)

[도입의 대가]

## 마무리

[핵심 메시지 재강조]

## 참고 자료

- [제목](URL)
````

- [ ] **Step 4: 확인**

Read로 수정된 stage-3-mdx.md를 확인.

---

### Task 5: frontmatter-rules.md — 제목 규칙 변경

**Files:**
- Modify: `.claude/skills/blog-writer/references/frontmatter-rules.md:22-31`

- [ ] **Step 1: title 생성 로직 교체**

`### title` 섹션 (line 22-31)을 아래로 교체:

```markdown
### title

제목은 주제명 그 자체다. 짧고 간결하게.

- 부제 없음. 콜론 이후 설명 없음.
- summary 필드가 글의 내용을 설명하므로 제목이 중복할 필요 없음.

예시:
- "데이터베이스 인덱스"
- "Redis"
- "JVM Garbage Collection"
- "Kafka Consumer Group"
```

- [ ] **Step 2: 확인**

Read로 수정된 frontmatter-rules.md의 title 섹션을 확인.

---

### Task 6: database-index-deep-dive.mdx — 새 구조로 재작성

**Files:**
- Modify: `content/posts/database-index-deep-dive.mdx` (전체 재작성)

- [ ] **Step 1: frontmatter 수정**

title을 `"데이터베이스 인덱스"`로 변경. 기타 frontmatter 유지.

- [ ] **Step 2: MDX 본문을 새 5단계 구조로 재작성**

기존 내용(Q&A에서 학습한 지식)을 활용하되, What → Why → How → When → Tradeoffs 흐름으로 재구성:

1. **What**: 데이터베이스 인덱스란 — 정의, 클러스터드/세컨더리/복합 인덱스 용어 정리
2. **Why**: 왜 필요한가 — Full Table Scan vs Index Scan 내부 동작 비교, 2,100만 건 사례
3. **How**: 어떻게 동작하는가 — B+Tree 디스크 I/O 제약, 리프 노드 배치, 복합 인덱스 컬럼 순서, 등호-정렬 원칙, 중간 컬럼 건너뛰기, 커버링 인덱스. 시각화 컴포넌트와 SVG 유지.
4. **When**: 언제 사용하고 언제 피해야 하는가 — 적합한 상황 (읽기 중심, 필터+정렬) + 부적합한 상황 (쓰기 중심, 카디널리티 극히 낮은 단독 인덱스)
5. **Tradeoffs**: 비용과 트레이드오프 — 쓰기 비용, 메모리, 인덱스 개수 결정, OFFSET 문제

- [ ] **Step 3: 콜아웃 배치 조정**

info (학습 목표) → Hook 직후, warning + error → How 섹션 내부로 이동.

- [ ] **Step 4: 확인**

Read로 재작성된 MDX를 확인.

---

### Task 7: 빌드 검증

**Files:**
- 변경 없음 (검증만)

- [ ] **Step 1: 키워드 맵 재생성**

Run: `pnpm generate-keyword-map`
Expected: 키워드 7개, 충돌 없음

- [ ] **Step 2: 타입 체크**

Run: `pnpm type-check`
Expected: 에러 0

- [ ] **Step 3: 프로덕션 빌드**

Run: `pnpm build`
Expected: SSG 성공, `/posts/database-index-deep-dive` 경로 생성

- [ ] **Step 4: dev 서버에서 확인**

Run: `PORT=3010 pnpm dev` (백그라운드)
확인: `http://blog.localhost:3010/posts/database-index-deep-dive`
