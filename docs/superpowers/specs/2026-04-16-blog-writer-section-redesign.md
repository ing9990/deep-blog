# Blog Writer Skill — Section Redesign

**날짜**: 2026-04-16
**범위**: blog-writer 스킬의 타입별 섹션 골격, MDX 매핑, 제목 규칙 변경

---

## 배경

기존 blog-writer 스킬의 섹션 골격(Why→Where→Root Cause→How→Alternatives→Anti-use cases→Gotchas)이 면접 준비 관점에 치우쳐 있었다. 블로그 글은 면접 프레이밍이 아닌 **기술 습득** 관점에서, 제3자가 읽어도 해당 주제에 대한 폭넓은 지식을 얻을 수 있어야 한다.

## 변경 사항

### 1. 타입별 섹션 골격 (7단계 → 5단계)

#### Type A — CS 지식 (Fundamentals)

| 순서 | 섹션 | 필수 | 핵심 질문 |
|---|---|---|---|
| 1 | **What** | 필수 | 이것은 무엇인가? |
| 2 | **Why** | 필수 | 왜 필요한가? (없을 때 vs 있을 때 내부 동작 비교) |
| 3 | **How** | 필수 | 어떻게 동작하는가? (내부 메커니즘, 구조) |
| 4 | **When** | 필수 | 언제 사용하고 언제 사용하지 말아야 하는가? |
| 5 | **Tradeoffs** | 권장 | 비용과 트레이드오프는? (쓰기 비용, 메모리 등) |

**Type A 중심축**: Section 3 (How)이 글의 가장 큰 축. CS 하부 제약이 구조를 강제하는 인과 관계를 여기서 풀어낸다.

#### Type B — 기술/도구 (Tools & Frameworks)

| 순서 | 섹션 | 필수 | 핵심 질문 |
|---|---|---|---|
| 1 | **What** | 필수 | 이것은 무엇인가? |
| 2 | **Why** | 필수 | 왜 필요한가? (도입 전 vs 후) |
| 3 | **How** | 필수 | 내부적으로 어떻게 동작하는가? (문법이 아닌 메커니즘) |
| 4 | **Problems** | 필수 | 사용 시 마주치는 실전 문제들은? |
| 5 | **Tradeoffs** | 권장 | 도입의 대가는? (사이드 이펙트, 복잡성, 운영 비용) |

**Type B 중심축**: Section 4 (Problems)가 글의 가장 큰 축. 단순 사용법을 넘어 실전 문제와 사이드 이펙트까지 다룬다.

#### 공통 원칙

- 1~4번 필수, 5번 권장
- 사용자가 커스텀 항목을 추가할 수 있음 (6번 이상)
- 1~4번 중 하나라도 작성이 어려우면 글감으로 약한 것 — 사용자와 각도 조정

#### 기존 대비 제거된 것

- **Where** (어디서 마주치는가): What과 Why에 자연스럽게 흡수
- **Root Cause** (별도 섹션): How 안에서 "왜 이 구조인가"를 함께 설명
- **Alternatives & Tradeoffs** (대안 비교): 타 기술 비교 제거. Tradeoffs는 "도입의 대가"로 재정의
- **Anti-use cases** (별도 섹션): When 섹션에 "사용하지 말아야 할 때"로 흡수
- **Gotchas** (실무 함정): Tradeoffs 또는 Problems에 흡수

### 2. MDX 구조 매핑

#### Type A MDX 헤딩

| 노트 섹션 | MDX H2 |
|---|---|
| 1. What | `## <주제>란 (What)` |
| 2. Why | `## 왜 필요한가 (Why)` |
| 3. How | `## 어떻게 동작하는가 (How)` |
| 4. When | `## 언제 사용하고 언제 피해야 하는가 (When)` |
| 5. Tradeoffs | `## 비용과 트레이드오프 (Tradeoffs)` |

#### Type B MDX 헤딩

| 노트 섹션 | MDX H2 |
|---|---|
| 1. What | `## <주제>란 (What)` |
| 2. Why | `## 왜 필요한가 (Why)` |
| 3. How | `## 내부적으로 어떻게 동작하는가 (How)` |
| 4. Problems | `## 실전에서 마주치는 문제들 (Problems)` |
| 5. Tradeoffs | `## 도입의 대가 (Tradeoffs)` |

**H2 제목 규칙**: `## <주제 맥락에 맞는 자연스러운 한국어> (<영문 섹션명>)`. 고정 문구가 아니라 주제에 따라 자연스러운 한국어 제목.

#### 자동 콜아웃 3종 배치

| 콜아웃 | 타입 | 위치 |
|---|---|---|
| info (학습 목표) | 공통 | Hook paragraph 직후, 첫 H2 직전 |
| warning (핵심 포인트) | 공통 | How 섹션 상단 |
| error (핵심 통찰) | 공통 | How 섹션 내부, 핵심 메커니즘 직전 |

### 3. 제목 생성 규칙

- **제목 = 주제명**. 짧고 간결하게.
- 부제 없음. 콜론 이후 설명 없음.
- 예시: "데이터베이스 인덱스", "Redis", "JVM Garbage Collection"
- summary 필드가 글의 내용을 설명하므로 제목이 중복할 필요 없음

### 4. 변경하지 않는 것

- 3-Stage 파이프라인 (면접 Q&A 학습 → 노트 최종화 → MDX 생성 + 검증)
- Stage 1의 면접 꼬리질문 방식 (사용자 이해도 파악 수단)
- 노트 live 로깅, 시각화 후보 감지, Related Posts 감지
- 검증 루프 (keyword-map → velite → type-check → build)
- style-guide.md, visualization-rules.md, validation-loop.md

## 수정 대상 파일

| 파일 | 변경 내용 |
|---|---|
| `references/philosophy.md` | Type A/B 섹션 골격 테이블을 5단계로 교체 |
| `references/stage-1-learning.md` | §2 학습 목차 제안 템플릿, §4 Q&A 강조점 업데이트 |
| `references/stage-2-note.md` | 노트 파일 템플릿 섹션 뼈대를 5단계로 교체 |
| `references/stage-3-mdx.md` | 본문 구조 매핑, 콜아웃 배치 위치 조정 |
| `references/frontmatter-rules.md` | title 생성 규칙 변경 (주제명만) |

## 후속 작업

스킬 수정 완료 후, 현재 `database-index-deep-dive.mdx`를 새 구조에 맞게 재작성한다.
