# CLAUDE.md — Backend Notes

> 이 문서는 Claude Code 에이전트가 이 프로젝트에서 작업할 때 반드시 따라야 하는 컨텍스트, 규칙, 컨벤션을 정의합니다.
> **코드를 생성하거나 수정하기 전에 이 문서를 반드시 읽고, 모든 작업이 이 문서와 일치하는지 검증하세요.**

---

## 1. 프로젝트 개요

개인 기술 블로그입니다. 백엔드 엔지니어로서 학습한 기술 주제(Spring, Kafka, JVM, DB, 분산 시스템 등)를 MDX로 작성하고, 키워드 간 자동 링크를 통해 위키처럼 연결된 지식 그래프를 구축합니다.

> **⚠️ 이 프로젝트는 로컬 환경에서만 동작합니다.**
> 외부 배포(Vercel, Netlify 등)를 하지 않으며, `pnpm dev`로 로컬 개발 서버를 실행하여 사용합니다.
> SEO, RSS, sitemap, robots.txt, Open Graph 등 외부 노출 관련 기능은 포함하지 않습니다.

### 핵심 목표

- **작성 편의성**: `.mdx` 파일 하나만 만들면 인덱싱, 키워드 링크, 메타데이터 처리가 자동화
- **조회 가독성**: Toss/두들린 수준의 깔끔하고 현대적인 UI, 높은 정보 밀도 + 가시성
- **키워드 연결**: 본문에 등장하는 기술 키워드가 해당 글로 자동 링크
- **탐색 용이성**: 검색, 태그 필터링, 정렬, 관련 글 추천
- **인터랙티브 시각화**: 글만으로 이해하기 어려운 개념은 HTML/CSS/JS 기반 인터랙티브 시각화로 반드시 보충

### 콘텐츠 작성 대원칙

> **"이해하기 쉽게 구성" + "이해하기 어려운 부분에 대해서는 시각화 필수"**
>
> 모든 글은 이 원칙을 따릅니다. 텍스트로 충분히 전달되는 내용은 텍스트로,
> 동작 과정/상태 변화/시간 흐름/공간 관계가 핵심인 개념은 반드시 인터랙티브 시각화를 포함합니다.

---

## 2. 기술 스택

| 영역 | 기술 | 버전/비고 |
|---|---|---|
| Framework | **Next.js** (App Router) | 최신 stable, `app/` 디렉토리 구조 |
| Language | **TypeScript** | strict mode 필수 |
| Content | **MDX** + Frontmatter | `.mdx` 파일 기반, YAML frontmatter |
| Content Layer | **Velite** | MDX → 타입 안전 데이터 변환 (Zod 스키마 기반, 빌드 타임 검증) |
| Styling | **Tailwind CSS v4** + **shadcn/ui** | 미니멀 디자인 시스템 |
| Code Highlighting | **Shiki** | VS Code 테마 기반 신택스 하이라이팅 |
| Search | 클라이언트 사이드 (FlexSearch) | 빌드 시 인덱스 생성, 런타임 검색 |
| 실행 환경 | **로컬 개발 서버** | `pnpm dev` → localhost:3000 |
| Package Manager | **pnpm** | lockfile 커밋 필수 |

### 사용하지 않는 것

- 외부 배포 (Vercel, Netlify 등 — 로컬 전용)
- SEO, RSS, sitemap, robots.txt, Open Graph 메타데이터
- 별도 백엔드 서버 (SSG로 충분)
- CMS (파일 기반 콘텐츠 관리)
- CSS-in-JS (Tailwind로 통일)
- 클래스형 컴포넌트 (함수형 컴포넌트 + Hooks만 사용)

---

## 3. 디렉토리 구조

```
/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (폰트, 테마, 네비게이션)
│   ├── page.tsx                # 인덱스 페이지 (글 목록, 검색, 필터)
│   ├── posts/
│   │   └── [slug]/
│   │       └── page.tsx        # 개별 글 상세 페이지
│   ├── tags/
│   │   └── [tag]/
│   │       └── page.tsx        # 태그별 글 목록
│   └── globals.css             # Tailwind 기본 + 커스텀 CSS 변수
├── content/
│   └── posts/                  # ⭐ MDX 파일 저장 위치
│       ├── database-index.mdx
│       ├── b-tree-structure.mdx
│       ├── kafka-consumer-group.mdx
│       └── ...
├── components/
│   ├── ui/                     # shadcn/ui 기반 원자 컴포넌트
│   ├── blog/                   # 블로그 전용 컴포넌트
│   │   ├── PostCard.tsx        # 인덱스 카드
│   │   ├── PostList.tsx        # 카드 리스트 + 페이지네이션
│   │   ├── TagChip.tsx         # 태그 필터 칩
│   │   ├── SearchBar.tsx       # 검색 입력
│   │   ├── TableOfContents.tsx # 우측 TOC 사이드바
│   │   ├── KeywordLink.tsx     # 자동 키워드 링크 컴포넌트
│   │   ├── RelatedPosts.tsx    # 관련 글 추천
│   │   └── Callout.tsx         # MDX 내 Callout 블록
│   ├── mdx/                    # MDX에서 사용하는 커스텀 컴포넌트
│   │   ├── CodeBlock.tsx       # Shiki 기반 코드 블록
│   │   ├── Diagram.tsx         # Mermaid 다이어그램 래퍼
│   │   └── index.ts            # MDX 컴포넌트 매핑
│   └── visualizations/         # ⭐ 인터랙티브 시각화 컴포넌트
│       ├── common/             # 시각화 공용 유틸 (애니메이션, 색상, 컨트롤)
│       │   ├── VisualContainer.tsx  # 시각화 래퍼 (제목, 설명, 리셋 버튼)
│       │   ├── StepController.tsx   # 단계별 진행 컨트롤러 (Prev/Next/Play)
│       │   ├── SpeedSlider.tsx      # 애니메이션 속도 조절
│       │   └── colors.ts           # 시각화 전용 컬러 토큰
│       ├── algorithm/          # 알고리즘 시각화
│       │   ├── QuickSort.tsx
│       │   ├── BTreeInsert.tsx
│       │   └── HashMapCollision.tsx
│       ├── database/           # DB 관련 시각화
│       │   ├── LockVisualizer.tsx
│       │   ├── IsolationLevel.tsx
│       │   ├── MVCCTimeline.tsx
│       │   └── IndexScanVsFullScan.tsx
│       ├── concurrency/        # 동시성 시각화
│       │   ├── ThreadLifecycle.tsx
│       │   ├── ContextSwitch.tsx
│       │   └── DeadlockDetector.tsx
│       └── distributed/        # 분산 시스템 시각화
│           ├── KafkaPartition.tsx
│           ├── ConsumerRebalance.tsx
│           └── TwoPhaseCommit.tsx
├── lib/
│   ├── content.ts              # 콘텐츠 조회/필터링 유틸
│   ├── keyword-map.ts          # 키워드 → slug 맵 생성
│   ├── search-index.ts         # FlexSearch 인덱스 빌드
│   └── utils.ts                # 공통 유틸리티
├── plugins/
│   └── remark-auto-link.ts     # ⭐ 키워드 자동 링크 Remark 플러그인
├── velite.config.ts            # Velite 스키마 정의 (Zod + MDX 옵션)
├── tailwind.config.ts
├── tsconfig.json
└── CLAUDE.md                   # 이 파일
```

---

## 4. 콘텐츠 작성 규칙

### 4.1 Frontmatter 스키마

모든 MDX 파일은 아래 frontmatter를 **반드시** 포함해야 합니다:

```yaml
---
title: "데이터베이스 인덱스의 동작 원리"        # 필수 — 글 제목
slug: "database-index"                          # 필수 — URL 경로 (/posts/database-index)
date: 2026-04-10                                # 필수 — 작성일 (YYYY-MM-DD)
updatedAt: 2026-04-12                           # 선택 — 수정일
tags:                                           # 필수 — 분류 태그 (1개 이상)
  - Database
  - Index
  - PostgreSQL
keywords:                                       # 필수 — 자동 링크 대상 키워드
  - B-Tree
  - B+Tree
  - 해시 인덱스
  - 클러스터 인덱스
summary: "DB 인덱스가 왜 빠른지 설명합니다."    # 필수 — 인덱스 카드에 표시될 요약 (1~2문장)
series: "Database Deep Dive"                    # 선택 — 시리즈 이름
seriesOrder: 2                                  # 선택 — 시리즈 내 순서
draft: false                                    # 선택 — true이면 빌드에서 제외
---
```

### 4.2 태그 규칙

- 태그는 **PascalCase** 또는 **공식 명칭** 그대로 사용: `Spring`, `Kafka`, `JVM`, `B-Tree`, `PostgreSQL`
- 카테고리 성격의 상위 태그를 반드시 1개 이상 포함: `Backend`, `Database`, `Infrastructure`, `CS`, `DevOps`, `Architecture`
- 태그 수는 글당 2~5개 권장

### 4.3 키워드 규칙

- `keywords` 배열에는 **이 글이 권위를 가지는 용어**만 등록
- 한 키워드는 프로젝트 전체에서 **단 하나의 글**에만 등록 (1:1 매핑)
- 키워드 충돌 발생 시 더 전문적/심화된 글이 해당 키워드를 가짐
- 대소문자 구분: `B-Tree`와 `b-tree`는 같은 키워드로 취급 (case-insensitive matching)

### 4.4 MDX 본문 작성 컨벤션

```mdx
## 본문에서 사용 가능한 커스텀 컴포넌트

<Callout type="info">
  이 글은 B-Tree의 기본 개념을 다룹니다.
</Callout>

<Callout type="warning">
  프로덕션에서는 반드시 인덱스 사용 계획을 검토하세요.
</Callout>

{/* 코드 블록은 언어 + 선택적 파일명/하이라이트 라인 지원 */}

```kotlin title="IndexService.kt" {3-5}
class IndexService {
    fun createIndex(table: String, column: String) {
        // 이 부분이 하이라이트됩니다
        val sql = "CREATE INDEX idx_${column} ON $table ($column)"
        jdbcTemplate.execute(sql)
    }
}
```

{/* Mermaid 다이어그램 */}
<Diagram>
graph TD
    A[Query] --> B{Index Exists?}
    B -->|Yes| C[Index Scan]
    B -->|No| D[Full Table Scan]
</Diagram>

{/* ⭐ 인터랙티브 시각화 — 복잡한 동작을 시각적으로 설명 */}
<QuickSort
  initialArray={[38, 27, 43, 3, 9, 82, 10]}
  description="피벗을 기준으로 배열이 분할되는 과정을 단계별로 확인하세요."
/>

<IsolationLevel
  description="각 격리 수준에서 어떤 이상 현상이 허용/차단되는지 직접 조작해보세요."
/>

<LockVisualizer
  scenario="shared-exclusive"
  description="Transaction A가 Shared Lock을 잡은 상태에서 Transaction B가 Exclusive Lock을 요청하면?"
/>
```

### 4.5 시각화 삽입 판단 기준

글을 작성할 때 아래 질문에 하나라도 해당되면 **인터랙티브 시각화를 반드시 포함**합니다:

| 질문 | 해당 예시 |
|---|---|
| 상태가 시간에 따라 변화하는가? | 퀵소트 분할 과정, GC 마킹/스위핑, Kafka 리밸런싱 |
| 여러 주체가 동시에 상호작용하는가? | DB Lock 경합, Thread 컨텍스트 스위칭, 2PC |
| 조건에 따라 결과가 달라지는가? | Transaction Isolation Level, Cache Hit/Miss |
| 공간적 구조가 핵심인가? | B-Tree 노드 분할, HashMap 버킷 충돌, Kafka 파티션 배치 |
| "만약 ~하면 어떻게 되는가?"라는 질문이 자연스러운가? | Deadlock 조건, 낙관적 락 충돌, Consumer 장애 시 리밸런싱 |

**시각화가 필요 없는 경우**: 단순 개념 정의, 설정 방법 나열, API 사용법, 코드 예제만으로 충분한 내용

---

## 5. 키워드 자동 링크 시스템

이 시스템은 **빌드 타임**에 동작하며, 런타임 비용은 0입니다. Phase 3에서 구현 완료 (`phase-3-complete` 태그).

### 5.1 파이프라인 개요

```
prebuild hook → scripts/generate-keyword-map.ts
  ↓
lib/generated/keyword-map.ts (KEYWORD_MAP, KEYWORDS_BY_LENGTH, SLUG_TO_ENTRY)
  ↓
velite build → remarkAutoLink plugin (plugins/remark-auto-link.ts)
  ↓
each MDX body gets <a href="/posts/..." data-keyword-link="true"> inline
  ↓
next build → mdxComponents.a detects data-keyword-link → renders <KeywordLink>
```

### 5.2 충돌 정책

`scripts/generate-keyword-map.ts`는 같은 키워드가 두 글 이상에서 선언되면 빌드를 실패시킨다 (`process.exit(1)`). CLAUDE.md §4.3의 "1:1 매핑" 원칙을 빌드 타임에 강제한다. 충돌 감지는 키워드를 lowercase로 정규화한 후 수행하므로 "B-Tree"와 "b-tree"도 충돌로 간주된다.

### 5.3 경계 규칙

`lib/keyword-matcher.ts`의 `hasBoundary`는 한글/영문 비대칭 경계를 적용한다:
- **영문 앞/뒤**: `[A-Za-z0-9_]` 기준 엄격
- **한글 앞**: 엄격 (`재인덱싱`의 `인덱스` 탈락)
- **한글 뒤**: 완화 — 한국어 조사 허용 (`인덱스를`, `B-Tree가`)

### 5.4 자기 링크 방지

Remark 플러그인은 현재 파일의 basename(확장자 제거)을 `excludeSlug`로 사용해, 한 글이 자기 자신의 키워드를 링크하는 것을 방지한다. 예: `b-tree-structure.mdx` 본문의 "B-Tree"는 링크되지 않는다.

### 5.5 중첩 방지 규칙

- 코드 블록(`code`, `inlineCode`) 내부 키워드 제외
- 기존 `link` 노드 안의 키워드 제외 (이중 링크 방지)
- 한 글에서 같은 키워드(대소문자 무시)는 첫 등장만 링크
- Greedy matching: 긴 키워드 우선 (예: `"Kafka Consumer Group"` > `"Kafka"`)

### 5.6 KeywordLink 컴포넌트

`components/blog/KeywordLink.tsx`는 `'use client'` 래퍼로, 데스크톱에서는 shadcn Popover로 글 제목/요약 프리뷰를 보여주고 모바일에서는 일반 링크로 degrade한다. `hidden md:contents` + `md:hidden` 이중 렌더 패턴으로 `@media (hover: hover)` 분기를 달성한다. Popover는 `SLUG_TO_ENTRY.get(slug)`로 O(1) 조회해 제목/요약을 표시한다.

---

## 6. 인터랙티브 시각화 시스템

### 6.1 설계 철학

시각화는 "예쁜 그림"이 아니라 **"동작하는 설명"**입니다. 독자가 직접 조작하고, 상태 변화를 눈으로 확인하며, "이렇게 하면 어떻게 되지?"라는 궁금증을 즉시 해소할 수 있어야 합니다.

**3가지 시각화 유형:**

| 유형 | 설명 | 사용 시점 | 예시 |
|---|---|---|---|
| **Step-by-step** | 단계별 진행, Prev/Next/Auto Play 제공 | 알고리즘, 프로토콜 핸드셰이크 | 퀵소트, 2PC, TCP 3-way |
| **Interactive Playground** | 사용자가 파라미터를 조절하며 결과 확인 | 조건에 따라 동작이 달라지는 개념 | Isolation Level, Cache TTL, GC 임계값 |
| **Timeline / Concurrent** | 여러 주체의 동시 행동을 시간축으로 표현 | 동시성, 락, 트랜잭션 | DB Lock 경합, Thread 스케줄링, MVCC |

### 6.2 공통 컴포넌트 아키텍처

모든 시각화는 `VisualContainer`로 감싸며, 일관된 UX를 제공합니다:

```
┌─ VisualContainer ──────────────────────────────────┐
│                                                     │
│  📊 퀵소트 분할 과정                          [↻]   │
│  피벗을 기준으로 배열이 분할되는 과정을 확인하세요    │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │          (시각화 본체 영역)                   │   │
│  │   [ 38 ] [ 27 ] [ 43 ] [ 3 ] [ 9 ] [▌82▐] │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [◀ Prev]  Step 3 / 7  [Next ▶]  [▶ Auto Play]    │
│  속도: [■■■□□] ──────────────────────────────────  │
│                                                     │
│  💡 현재 단계: 피벗(82)보다 작은 원소를 왼쪽으로    │
│     이동시킵니다.                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**공통 컴포넌트** (Phase 4.1에서 구현, `components/visualizations/common/`):

- **`useStepController(totalSteps, options?)`** — 상태 관리 훅. `step / isPlaying / speed / canPrev / canNext / progress / reducedMotion` 상태와 `prev / next / play / pause / toggle / reset / setSpeed / goTo` 액션을 반환. `prefers-reduced-motion: reduce` 자동 감지.
- **`<VisualContainer title description onReset?>`** — 시각화 외곽 래퍼(`figure` + `figcaption`). 선택적 리셋 버튼.
- **`<StepController {...controller} stepDescription? showSpeedSlider? showProgressBar?>`** — 컨트롤 UI(리셋/이전/재생/다음 + 진행 바 + 속도 슬라이더). 훅 반환값을 spread로 전달.
- **`<SpeedSlider speed onChange>`** — 5 세그먼트 배터리 게이지 스타일 속도 조절.

**표준 패턴** (새 Step-by-step 시각화 작성 시):

```tsx
'use client'

import { useMemo } from 'react'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

function computeSnapshots(input: Input): Snapshot[] { /* 알고리즘 */ }

export function MyViz({ input }: { input: Input }) {
  const snapshots = useMemo(() => computeSnapshots(input), [input])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="..." description="...">
      {/* 현재 스냅샷 렌더 — 상태에 따라 vizStateClasses(state) 적용 */}
      <StepController {...controller} stepDescription={current.note} />
    </VisualContainer>
  )
}
```

### 6.3 시각화 유형별 구현 패턴

#### A. Step-by-step (알고리즘, 프로토콜)

상태를 미리 전체 계산해두고, 스텝 인덱스로 현재 프레임을 렌더링합니다.

```typescript
// 패턴: 전체 스냅샷 배열 사전 계산
function useAlgorithmSteps<T>(initialState: T, computeSteps: (state: T) => T[]) {
  const steps = useMemo(() => computeSteps(initialState), [initialState]);
  const [currentStep, setCurrentStep] = useState(0);
  // ...Prev/Next/AutoPlay 로직
  return { currentStep, totalSteps: steps.length, currentState: steps[currentStep], ... };
}

// 예: QuickSort
const steps = useMemo(() => {
  const snapshots: QuickSortState[] = [];
  quickSortWithTracking(initialArray, (snapshot) => snapshots.push(snapshot));
  return snapshots;
}, [initialArray]);
```

**시각적 규칙:**
- 비교 중인 요소: **강조 색상** (accent) + 미세한 scale 애니메이션
- 확정된 위치의 요소: **성공 색상** (green계열) + 체크 아이콘
- 피벗/기준 요소: **별도 색상** (amber) + 테두리 강조
- 이동 중인 요소: CSS `transform` + `transition`으로 부드러운 이동
- 모든 전환: `transition-all duration-300 ease-out`

#### B. Interactive Playground (파라미터 조절)

사용자가 직접 조건을 바꾸며 결과를 탐색합니다.

```typescript
// 패턴: 상태 + 컨트롤 분리
function IsolationLevel() {
  const [level, setLevel] = useState<'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE'>('READ_COMMITTED');
  const [scenario, setScenario] = useState<'dirty_read' | 'non_repeatable' | 'phantom'>('dirty_read');

  // level + scenario 조합에 따라 시각화 변경
  const result = useMemo(() => simulateIsolation(level, scenario), [level, scenario]);

  return (
    <VisualContainer title="Transaction Isolation Level">
      {/* 좌측: 컨트롤 패널 */}
      {/* 우측: 타임라인 시각화 */}
    </VisualContainer>
  );
}
```

**컨트롤 UI 규칙:**
- 2~4개 선택지: 라디오 버튼 그룹 또는 세그먼트 컨트롤
- 연속 값 (속도, 크기): 슬라이더
- On/Off: 토글 스위치
- 컨트롤은 시각화 **위** 또는 **좌측**에 배치 (모바일에서는 위)

#### C. Timeline / Concurrent (동시성, 락)

시간축(X)과 주체축(Y)으로 동시 행동을 표현합니다.

```typescript
// 패턴: 타임라인 기반 이벤트 렌더링
interface TimelineEvent {
  actor: string;        // "Transaction A", "Thread 1"
  action: string;       // "LOCK", "READ", "WRITE", "WAIT", "COMMIT"
  startTime: number;    // 타임라인 상 시작 위치
  duration: number;     // 지속 시간
  status: 'active' | 'waiting' | 'blocked' | 'completed';
}

// 시각적 표현:
// - 각 actor는 수평 트랙 (swim lane)
// - active: 채워진 바
// - waiting/blocked: 빗금 패턴 + 경고 색상
// - Lock 범위: 반투명 오버레이
// - 충돌 지점: 빨간 번개 아이콘 + 설명 툴팁
```

### 6.4 시각화 디자인 규칙

**색상 — CSS 변수 + Tailwind 유틸리티:**

시각화 전용 색상은 `app/globals.css`의 `:root` / `[data-theme="dark"]` 에 정의된 `--viz-<state>-{border,bg,fg}` 18개 변수가 단일 진실 소스입니다. `@theme inline` 블록에서 `--color-viz-*` 매핑으로 Tailwind 유틸리티를 자동 생성:

| State | Tailwind 유틸리티 | 용도 |
|---|---|---|
| pivot | `border-viz-pivot` / `bg-viz-pivot-bg` / `text-viz-pivot-fg` | 피벗/기준 요소 (amber) |
| comparing | `border-viz-comparing` / … | 비교 중 요소 (blue) |
| confirmed | `border-viz-confirmed` / … | 확정/완료 요소 (emerald) |
| blocked | `border-viz-blocked` / … | 차단/충돌 요소 (red) |
| waiting | `border-viz-waiting` / … | 대기 중 요소 (gray) |
| highlight | `border-viz-highlight` / … | 특별 강조 요소 (purple) |

`components/visualizations/common/colors.ts`의 `vizStateClasses(state)` 헬퍼는 세 유틸리티를 한 번에 반환합니다:

```tsx
import { vizStateClasses } from './common/colors'

<div className={vizStateClasses('pivot')}>pivot element</div>
// → "border-viz-pivot bg-viz-pivot-bg text-viz-pivot-fg"
```

새 상태 추가 절차는 Phase 4.1 스펙 §6.6 참고 (4곳 동시 편집: `:root` / dark / `@theme inline` / `VIZ_STATES`).

**애니메이션 규칙:**
- 모든 상태 전환에 `transition: all 300ms ease-out`
- 요소 이동은 `transform: translateX/Y` 사용 (layout thrashing 방지)
- 자동 재생 기본 속도: 스텝당 800ms (속도 슬라이더로 400ms~1600ms 조절 가능)
- `prefers-reduced-motion: reduce`일 때 애니메이션 비활성화 필수

**반응형 규칙:**
- 배열/리스트 시각화: 모바일에서 요소 크기 축소 (48px → 36px)
- 타임라인: 모바일에서 가로 스크롤 허용 (단, 스크롤 가능함을 시각적으로 표시)
- 컨트롤 패널: `md:` 이상에서 좌측 배치, 모바일에서 상단 배치

**텍스트 규칙:**
- 시각화 내부 텍스트는 12~14px, 배경과 충분한 대비 확보
- 현재 단계 설명은 시각화 **아래**에 배치, 1~2문장으로 간결하게
- 전문 용어 첫 등장 시 짧은 괄호 설명 추가: "피벗(pivot: 분할 기준 값)"

### 6.5 시각화 필수 포함 주제 목록

이 블로그에서 다루는 주제 중, 아래 주제는 **반드시** 인터랙티브 시각화를 포함해야 합니다:

**알고리즘 / 자료구조:**
- 정렬 알고리즘 (Quick, Merge, Heap) → Step-by-step
- B-Tree / B+Tree 삽입/삭제/검색 → Step-by-step
- HashMap 충돌 해결 (Chaining, Open Addressing) → Step-by-step
- LRU Cache 동작 → Step-by-step

**데이터베이스:**
- Lock (Shared/Exclusive/Intent) 경합 → Timeline
- Transaction Isolation Level (Dirty Read, Phantom 등) → Interactive Playground
- MVCC 동작 원리 → Timeline
- Index Scan vs Full Table Scan 비교 → Interactive Playground
- Deadlock 발생 조건 → Timeline + Step-by-step

**동시성 / JVM:**
- Thread 상태 전이 (NEW → RUNNABLE → WAITING...) → Step-by-step
- 컨텍스트 스위칭 → Timeline
- GC (Mark-Sweep, G1) → Step-by-step
- Synchronized vs ReentrantLock → Timeline

**분산 시스템 / Kafka:**
- Kafka Partition 할당 → Interactive Playground
- Consumer Group 리밸런싱 → Step-by-step
- 2PC / SAGA 패턴 → Step-by-step
- Cache Stampede / Thundering Herd → Timeline

---

## 7. 페이지 상세 설계

### 6.1 인덱스 페이지 (`/`)

**레이아웃 구조:**

```
┌─────────────────────────────────────────────────┐
│  [로고]                       [GitHub] [다크모드]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Backend Notes                                  │
│  백엔드 엔지니어의 학습 기록                       │
│                                                  │
│  🔍 [검색어를 입력하세요...]                      │
│                                                  │
│  [Backend] [Database] [Kafka] [JVM] [Spring] ... │
│  ─────────────────────────────────────────────── │
│  📊 전체 42개  |  정렬: [최신순 ▼]               │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ 데이터베이스 인덱스의 동작 원리            │   │
│  │ DB 인덱스가 왜 빠른지, B-Tree 구조를...   │   │
│  │ [Database] [Index] [PostgreSQL]  4/10     │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ Kafka Consumer Group 리밸런싱 전략        │   │
│  │ Consumer Group의 리밸런싱이 발생하는...    │   │
│  │ [Kafka] [Backend]               4/08     │   │
│  └──────────────────────────────────────────┘   │
│  ...                                             │
└─────────────────────────────────────────────────┘
```

**동작 규칙:**
- 검색/필터/정렬 상태는 **URL 쿼리 파라미터**로 관리: `/?tag=Database&q=인덱스&sort=latest`
- 태그 칩은 토글 방식 (활성/비활성), 복수 선택 가능
- 검색은 제목 + 요약 + 태그 + 키워드를 대상으로 클라이언트 사이드 검색 (FlexSearch)
- 정렬 옵션: 최신순(기본), 오래된 순, 제목 가나다순
- 빈 결과 시 친절한 안내 메시지 표시
- 카드 호버 시 미세한 elevation 변화 (subtle shadow transition)

### 6.2 글 상세 페이지 (`/posts/[slug]`)

**레이아웃 구조:**

```
┌─────────────────────────────────────────────────────────┐
│  [← 목록으로]                      [GitHub] [다크모드]   │
├────────────────────────────────────┬────────────────────┤
│                                    │                     │
│  [Database] [Index]                │  목차               │
│                                    │  ─────              │
│  # 데이터베이스 인덱스의 동작 원리  │  1. 인덱스란?       │
│  2026.04.10 · 읽기 8분             │  2. B-Tree 구조     │
│  ──────────────────────────        │  3. 인덱스 생성     │
│                                    │  4. 성능 비교       │
│  본문 내용...                      │                     │
│  ...B-Tree(← 자동 링크)를         │                     │
│  사용합니다...                      │                     │
│                                    │                     │
│  ──────────────────────────        │                     │
│  관련 글                            │                     │
│  ┌────────┐ ┌────────┐            │                     │
│  │B-Tree  │ │ Hash   │            │                     │
│  │구조    │ │ Index  │            │                     │
│  └────────┘ └────────┘            │                     │
├────────────────────────────────────┴────────────────────┤
│  © 2026 Backend Notes                                   │
└─────────────────────────────────────────────────────────┘
```

**동작 규칙:**
- 본문 영역 max-width: **720px** (가독성 최적 폭)
- TOC 사이드바: 스크롤 따라 현재 섹션 하이라이트 (Intersection Observer)
- TOC는 데스크탑에서만 표시, 모바일에서는 글 상단에 접이식으로 제공
- 키워드 링크: 점선 밑줄 스타일, 호버 시 프리뷰 Popover
- 관련 글: 동일 태그를 가진 글 중 최대 4개, 태그 겹침 수 기준 정렬
- 읽기 시간: 한국어 기준 분당 500자로 계산

---

## 8. 디자인 시스템

### 7.1 디자인 원칙

- **미니멀**: 불필요한 장식 요소 배제, 콘텐츠가 주인공
- **정보 밀도**: 카드 하나에 제목 + 요약 + 태그 + 날짜를 담되 답답하지 않게
- **여백의 미**: 요소 간 충분한 spacing (Tailwind `space-y-6`, `gap-4` 등)
- **일관성**: 모든 페이지에서 동일한 컬러, 타이포그래피, spacing 사용

### 7.2 컬러 팔레트

shadcn/ui 컨벤션의 CSS 변수(`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, `--accent`)를 사용한다. 프로젝트 고유 확장 토큰은 `--keyword`, `--keyword-bg`, `--border-strong`. shadcn 프리미티브(Button, Input, Badge, Select)는 `--popover`, `--input`, `--secondary`, `--destructive` 등의 토큰도 참조하므로 `app/globals.css`의 `:root`와 `[data-theme="dark"]` 블록 모두에 정의되어 있다. 실제 값은 `app/globals.css`를 참고하고, 이 문서에서는 핵심 원칙만 기술한다.

**핵심 원칙**
- 그림자 대신 **테두리 변화로 상태 표현** (카드 호버: `border-border-strong` + `bg-muted/40`)
- 단일 블루 액센트 (`--primary: #3B82F6` / dark `#60A5FA`) — 링크, 포커스 링, 활성 필터 칩
- 완전 검정 회피 — foreground는 `#09090B`(light) / `#FAFAFA`(dark)로 안정감 확보
- **WCAG 대비 예외**: 라이트 모드 `--primary: #3B82F6`는 백색 배경에서 16px 본문 텍스트 기준 WCAG AA 대비율(4.5:1) 미달(3.68:1). Toss 블루의 시각적 톤 유지를 우선해 의도적으로 수용. 링크 텍스트가 본문에 드물게 등장하고 대부분 큰 제목·카드 호버·활성 필터에 사용되어 실사용 영향은 제한적. 다크 모드 `--primary: #60A5FA`는 AA 통과(7.83:1).

다크 모드 전환: `next-themes`의 `ThemeProvider`를 `attribute="data-theme"`로 설정. Tailwind는 `darkMode: ['selector', '[data-theme="dark"]']`로 variant를 생성.

### 7.3 타이포그래피

**폰트**
- 본문/제목: **Pretendard Variable** (`next/font/local`, `public/fonts/PretendardVariable.woff2`, 2.0MB, weight 100-900)
- 코드: **JetBrains Mono Variable** (`next/font/local`, `public/fonts/JetBrainsMono-Variable.ttf`, ~293KB, weight 100-800) + `ui-monospace` fallback 스택

**스케일** (모바일 기본, 데스크탑 `md:` 확장)

| 용도 | 모바일 | 데스크탑 | weight | line-height | letter-spacing |
|---|---|---|---|---|---|
| Display | 32px | 40px | 700 | 1.2 | -0.02em |
| H1 | 28px | 32px | 700 | 1.3 | -0.015em |
| H2 | 22px | 24px | 600 | 1.4 | -0.01em |
| H3 | 18px | 19px | 600 | 1.5 | 0 |
| Body | 16px | 17px | 400 | 1.8 | 0 |
| Body Small | 14px | 15px | 400 | 1.7 | 0 |
| Caption | 13px | 13px | 500 | 1.5 | 0 |
| Code inline | 14px | 14px | 500 | 1.6 | 0 |

본문 `line-height: 1.8`은 Toss 기술 블로그 기준. 한국어 긴 글 가독성의 공식. H1 이상의 음수 letter-spacing은 Pretendard 큰 굵기의 자간 보정용. 실제 타입 스케일 적용은 `app/globals.css`의 `.prose-kr` 클래스와 페이지별 유틸리티 클래스로 처리된다.

### 7.4 컴포넌트 스타일 가이드

**PostCard:**
- 배경: `bg-white dark:bg-gray-900`
- 테두리: `border border-gray-200 dark:border-gray-800`
- 라운딩: `rounded-xl`
- 패딩: `p-5`
- 호버: `hover:shadow-md transition-shadow duration-200`
- 태그 배지: `text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent`

**TagChip (필터용):**
- 비활성: `border border-gray-300 text-gray-600 bg-transparent`
- 활성: `bg-accent text-white border-accent`
- 전환: `transition-colors duration-150`

**SearchBar:**
- 전체 너비, `h-11`, `rounded-lg`
- 좌측 돋보기 아이콘, `placeholder="검색어를 입력하세요..."`
- 포커스: `ring-2 ring-accent/30`

---

## 9. 코드 컨벤션

### 8.1 TypeScript

- `strict: true` 필수
- `any` 사용 금지, 불가피하면 `unknown` + 타입 가드
- 컴포넌트 props는 `interface`로 정의 (type alias 아닌 interface)
- 파일명: 컴포넌트는 `PascalCase.tsx`, 유틸은 `kebab-case.ts`

### 8.2 React / Next.js

- Server Component 기본, 클라이언트 상태가 필요한 경우에만 `'use client'`
- `'use client'` 경계를 최대한 말단(leaf)으로 내림
- 데이터 페칭은 Server Component에서 수행
- 이미지: `next/image` 사용 필수, width/height 명시

### 8.3 스타일링

- Tailwind 유틸리티 클래스 사용, 인라인 `style` 지양
- 복잡한 조건부 클래스: `cn()` 유틸 (clsx + tailwind-merge)
- 반응형: `mobile-first` (기본이 모바일, `md:`, `lg:`로 확장)
- 다크모드: `dark:` variant 사용, CSS 변수와 병행

### 8.4 접근성 (a11y)

- 모든 인터랙티브 요소에 적절한 `aria-label`
- 키보드 네비게이션 지원 (Tab, Enter, Escape)
- 색상만으로 정보를 구분하지 않음
- 이미지에 `alt` 텍스트 필수

---

## 10. 자기 검증 프로토콜

코드를 생성하거나 수정한 후, 아래 체크리스트를 반드시 확인합니다:

### 빌드 검증

```bash
pnpm build        # 빌드 에러 없음 확인
pnpm lint         # ESLint 경고/에러 없음
pnpm type-check   # TypeScript 타입 에러 없음
```

### 콘텐츠 검증

- [ ] 새 MDX 파일의 frontmatter가 스키마를 충족하는가?
- [ ] `keywords` 배열의 키워드가 다른 글과 충돌하지 않는가?
- [ ] `tags`가 기존 태그 목록에 있는 값인가? (새 태그 추가 시 의도적인지 확인)
- [ ] `slug`가 URL-safe한가? (소문자, 하이픈만 사용)

### UI 검증

- [ ] 라이트/다크 모드 모두에서 정상 표시되는가?
- [ ] 모바일 뷰포트(375px)에서 레이아웃이 깨지지 않는가?
- [ ] 키워드 링크가 올바른 글로 연결되는가?
- [ ] 인덱스 페이지에서 검색/필터/정렬이 정상 동작하는가?

### 키워드 링크 검증

- [ ] 코드 블록 내부의 키워드가 링크되지 않는가?
- [ ] 이미 링크 안에 있는 키워드가 이중 링크되지 않는가?
- [ ] 자기 자신의 키워드가 링크되지 않는가?
- [ ] 한 글에서 같은 키워드가 첫 등장만 링크되는가?

### 시각화 검증

- [ ] 시각화가 필요한 주제에 인터랙티브 시각화가 포함되어 있는가? (섹션 6.5 참고)
- [ ] StepController의 Prev/Next/Reset이 모든 단계에서 정상 동작하는가?
- [ ] Auto Play가 마지막 단계에서 정지하는가?
- [ ] 각 단계에 `stepDescription`(현재 단계 설명)이 제공되는가?
- [ ] 라이트/다크 모드에서 시각화 색상이 구분 가능한가?
- [ ] 모바일에서 시각화가 잘리지 않고 조작 가능한가?
- [ ] `prefers-reduced-motion: reduce` 설정 시 애니메이션이 비활성화되는가?

---

## 11. 금지 사항

이 프로젝트에서 **절대 하지 않을 것**:

1. **존재하지 않는 API/라이브러리를 생성하지 마세요** — 불확실하면 공식 문서를 먼저 확인
2. **동작하지 않는 코드를 제안하지 마세요** — 코드는 빌드 가능한 상태여야 함
3. **디자인 시스템을 임의로 변경하지 마세요** — 색상, 폰트, spacing은 이 문서의 규칙을 따름
4. **SSR이 불필요한 곳에 SSR을 사용하지 마세요** — 블로그 콘텐츠는 SSG, 검색/필터만 CSR
5. **외부 배포 관련 코드를 추가하지 마세요** — SEO, RSS, sitemap, robots.txt, Open Graph 등 불필요
6. **키워드 맵을 런타임에 생성하지 마세요** — 반드시 빌드 타임에 생성
7. **`any` 타입을 사용하지 마세요** — unknown + 타입 가드로 대체
8. **인라인 style을 남용하지 마세요** — Tailwind 유틸리티 클래스 우선
9. **시각화 없이 복잡한 동작 개념을 텍스트만으로 설명하지 마세요** — 섹션 4.5 판단 기준 참고
10. **시각화 구현 시 검증된 외부 라이브러리를 적극 활용하세요** — 코드 단축, 더 나은 디자인, 성능 향상을 위해 D3, Framer Motion, Three.js, visx 등 검증된 라이브러리 사용 권장

---

## 12. 작업 우선순위

새로운 작업 요청 시 아래 순서를 참고합니다:

1. **Phase 1 — 기반 구축** ✅ **완료** (`phase-1-complete` 태그): Next.js 프로젝트 초기화, Velite 설정, MDX 파이프라인, 샘플 글 렌더링. 세부 내역은 §13 참고.
2. **Phase 2 — 핵심 UI** ✅ **완료** (`phase-2-complete` 태그): 디자인 토큰, Pretendard/JetBrains Mono 폰트, 다크모드(토글 포함), 인덱스 페이지(URL 동기화 검색/필터/정렬), 글 상세 페이지(TOC 사이드바), shadcn/ui 도입, Shiki 라인 하이라이트. 세부 내역은 §14 참고.
3. **Phase 3 — 키워드 시스템** ✅ **완료** (`phase-3-complete` 태그): scripts/generate-keyword-map.ts 빌드 전 맵 생성, plugins/remark-auto-link.ts Remark 플러그인, components/blog/KeywordLink.tsx Popover 래퍼. 세부 내역은 §15 참고.
4. **Phase 4.1 — 시각화 프레임워크 (Step-by-step)** ✅ **완료** (`phase-4-1-complete` 태그): `VisualContainer`, `StepController`, `SpeedSlider`, `useStepController` 훅, `--viz-*` 색상 토큰 18개, QuickSort 리팩토링. 세부 내역은 §16 참고.
   - Phase 4.2 (Interactive Playground), Phase 4.3 (Timeline/Concurrent)은 해당 유형의 첫 시각화가 등장할 때 서브 페이즈로 도입.
5. **Phase 5 — 탐색 기능**: FlexSearch 통합, 관련 글 추천, 태그 전용 페이지 `/tags/[tag]`
6. **Phase 6 — 마무리**: 반응형 미세 조정, 성능 최적화

> **시각화 컴포넌트 개별 구현**은 Phase 4 이후 각 글을 작성할 때 해당 주제에 맞게 함께 구현합니다.
> 예: "퀵소트" 글 작성 시 → `QuickSort.tsx` 시각화 컴포넌트도 함께 구현

---

## 13. Phase 1 구현 현황

> 이 섹션은 Phase 1 완료 시점(2026-04-14)의 실제 구현 상태와 향후 에이전트가 반드시 알아야 할 의사결정/제약을 기록합니다. §3 디렉토리 구조는 Phase 6까지의 **목표**이며, 아래는 **현재 실재하는** 파일/설정입니다.

### 13.1 존재하는 파일 (Phase 1)

```
app/
├── layout.tsx                 # 루트 레이아웃 (html lang="ko", globals.css 임포트)
├── page.tsx                   # 임시 dev 인덱스 (Phase 2에서 전면 재작성 예정)
├── globals.css                # @import "tailwindcss" + @plugin typography + system font
└── posts/[slug]/page.tsx      # 글 상세 페이지 (generateStaticParams + dynamicParams=false)

components/mdx/
├── index.ts                   # mdxComponents = {} (Phase 2+에서 채움)
└── MDXContent.tsx             # Velite 컴파일 본문을 evaluate하는 Server Component

content/posts/
└── hello-world.mdx            # 파이프라인 검증 샘플

lib/
└── posts.ts                   # getAllPosts / getPostBySlug / getAllSlugs (draft 필터, 날짜 내림차순)

tests/
├── smoke.test.ts              # Vitest 동작 검증
├── velite-schema.test.ts      # postFrontmatterSchema 단위 테스트 (6개)
├── velite-build.test.ts       # Velite 빌드 결과 통합 테스트 (4개)
└── posts.test.ts              # lib/posts.ts 단위 테스트 (vi.mock 사용, 6개)

velite.config.ts               # 스키마 + rehype-pretty-code 설정
next.config.mjs                # VeliteWebpackPlugin으로 velite build 호출
tsconfig.json                  # strict + paths: @/* → ./, #site/content → ./.velite
vitest.config.ts               # 별칭 미러링, environment: node, globals: false
tailwind.config.ts             # content 글롭 + typography 플러그인
postcss.config.mjs             # @tailwindcss/postcss
.eslintrc.json                 # next/core-web-vitals (레거시; Next 16에서 ESLint CLI 전환 필요)
.gitignore                     # .next, .velite, *.tsbuildinfo, .claude/ 포함
```

**§3에 있지만 아직 없는 디렉토리**: `components/ui/`, `components/blog/`, `components/visualizations/`, `plugins/`, `lib/keyword-map.ts`, `lib/search-index.ts` — 각각 해당 Phase에서 생성.

### 13.2 핵심 의사결정 (변경 금지)

| 결정 | 이유 | 영향 |
|---|---|---|
| pnpm 9.15.4 pinned via corepack | Node 23.5의 corepack keyid 버그 회피 | 새 워크스테이션 셋업 시 `COREPACK_ENABLE_STRICT=0 corepack prepare pnpm@9.15.4 --activate` 필요 |
| `eslint-config-next: ^15` | Next 15와 메이저 버전 일치 | Next 16으로 올릴 때 `^16`으로 동반 승격 |
| `@vitejs/plugin-react: ^4` | Vitest 2가 번들한 Vite 5와 호환 (v6는 Vite 8 요구) | Vitest 3+로 올릴 때 `^6`으로 동반 승격 |
| Frontmatter schema 이중화 | Velite `s.slug()`이 빌드 타임 cache를 요구 → 테스트에서 `.parse()` 불가 | `postFrontmatterShape`(regex 기반, 테스트용) + 콜렉션 스키마에서 `.extend({slug: s.slug('post')})` 재적용 |
| Velite `useMDXComponent` 헬퍼 | Velite 컴파일 본문은 `arguments[0]` 구조분해 형태 — 공식 "Use in React" 패턴 | `components/mdx/MDXContent.tsx`는 Server Component로 유지 (`'use client'` 금지). 본문 문자열은 Velite 컴파일러의 결정적 출력이므로 안전 (§7.2 감사됨) |
| `dynamicParams = false` | Phase 1은 100% SSG, 알 수 없는 slug는 즉시 404 | **dev HMR 한계**: 새 MDX 파일 추가 시 인덱스 링크는 갱신되지만 `/posts/<새slug>`는 dev 서버 재시작 전까지 404. 프로덕션 `pnpm build`는 정상 반영 |
| `params: Promise<{ slug: string }>` | Next.js 15 async params API | 페이지 컴포넌트는 반드시 `async` + `await params` |
| `draft` 필터는 `lib/posts.ts`에서만 | 스키마 단에서 걸러내면 `pnpm build` 자체가 실패 | `draft: true` MDX는 Velite 빌드 통과, `getAllPosts()`에서 제외되어 런타임 404 |

### 13.3 명령어 치트시트

```bash
pnpm dev            # 개발 서버 (Velite watch 모드 포함)
pnpm build          # Next 프로덕션 빌드 (Velite 선행)
pnpm test           # velite build && vitest run (Phase 1 기준 17개 테스트; Phase 2 이후 46개 — §14.3 참고)
pnpm test:unit      # vitest run만 (velite build 없이 — 일부 테스트는 실패 가능)
pnpm type-check     # tsc --noEmit
pnpm lint           # next lint (Next 16에서 제거 예정)
pnpm velite         # Velite만 1회 실행
```

### 13.4 알려진 미결 사항 (후속 Phase에서 처리)

- **`next lint` deprecated**: Next 16 업그레이드 시 `npx @next/codemod@canary next-lint-to-eslint-cli .`로 ESLint CLI + flat config 전환.
- **Shiki 라인 하이라이트 미구현**: CLAUDE.md §4.4의 ` ```kotlin {3-5} ` 표기는 `@shikijs/transformers`의 `transformerNotationHighlight`가 필요. Phase 2에서 실제 코드 블록 스타일링 시 함께 도입. → ✅ **Phase 2에서 완료** (§14 참고)
- **`series` / `seriesOrder` 정합성 검증 부재**: 한쪽만 있는 경우 스키마 에러 없음. Phase 2 시리즈 UI 도입 전 `.refine()` 추가 필요.
- **`@types/node: ^25`**: LTS 아님. 안정성 필요 시 `^22`로 다운그레이드 검토.
- **임시 `prose` 스타일링**: `@tailwindcss/typography`는 Phase 1 간이 스타일용. Phase 2에서 §7.2 커스텀 컬러 토큰 + §7.3 타이포그래피로 대체. → ✅ **Phase 2에서 `.prose-kr`로 교체** (§14 참고)

### 13.5 리포지토리

- **원격**: `https://github.com/ing9990/backend-notes` (private)
- **브랜치 전략**: 단일 `main` 브랜치에 직접 커밋 (greenfield, Phase 1 기간). Phase 2부터는 feature 브랜치 도입 검토 가능.
- **Phase 1 태그**: `phase-1-complete` (커밋 `ebd09e9`)

---

## 14. Phase 2 구현 현황

> 이 섹션은 Phase 2 완료 시점(2026-04-15)의 실제 구현 상태와 향후 에이전트가 반드시 알아야 할 의사결정/제약을 기록합니다. §13과 같은 포맷.

### 14.1 존재하는 파일 (Phase 2에서 추가·변경)

```
app/
├── layout.tsx                  # [수정] Pretendard + JetBrains Mono + ThemeProvider + Header + Footer
├── page.tsx                    # [재작성] 인덱스 페이지 (URL 동기화 검색/필터/정렬)
├── globals.css                 # [재작성] shadcn 토큰 + prose-kr + Shiki highlighted 라인
└── posts/[slug]/page.tsx       # [수정] 2열 레이아웃 + TOC 사이드바 + 모바일 접이식

components/
├── ui/                         # shadcn/ui 프리미티브 (4개)
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── select.tsx
├── blog/
│   ├── Header.tsx              # server, sticky, GitHub 링크 + ThemeToggle
│   ├── Footer.tsx              # server, 중앙 정렬 카피라이트
│   ├── PostCard.tsx            # server, 인덱스 카드
│   ├── PostList.tsx            # server, 빈 상태 + 카드 스택
│   ├── PostMeta.tsx            # server, 태그 + 날짜 + 읽기 시간
│   ├── ReadingTime.tsx         # server, "읽기 N분"
│   ├── TableOfContents.tsx     # 'use client', IntersectionObserver
│   ├── TagChip.tsx             # 'use client', aria-pressed 토글 버튼
│   ├── TagFilterBar.tsx        # 'use client', useRouter URL 동기화
│   ├── SearchBar.tsx           # 'use client', 250ms debounce + 한글 IME 처리 + refs로 stale closure 방지
│   ├── SortSelect.tsx          # 'use client', isSortKey 타입 가드
│   └── ThemeToggle.tsx         # 'use client', mounted 패턴으로 hydration 안전
├── mdx/
│   ├── index.ts                # barrel re-export
│   ├── components.tsx          # mdxComponents 매핑 (h1, a)
│   └── MDXContent.tsx          # (Phase 1 파일, Phase 2에서 MDXComponents 타입으로 정리)
└── providers/
    └── ThemeProvider.tsx       # 'use client', next-themes with attribute="data-theme"

lib/
├── posts.ts                    # (Phase 1 유지, 수정 없음)
├── filters.ts                  # filterByTag / searchPosts / sortPosts / applyFilters / extractAllTags (koCollator 공유)
├── reading-time.ts             # calculateReadingTime (500자/분, 마크다운 제거)
├── toc.ts                      # flattenToc (Velite 계층 → flat)
└── utils.ts                    # cn() + buildPostsUrl() + formatDate() (UTC getters)

public/fonts/
├── PretendardVariable.woff2    # ~2.0MB
└── JetBrainsMono-Variable.ttf  # ~293KB

content/posts/
├── hello-world.mdx             # [확장] 다중 섹션 + Shiki [!code highlight] 예시
├── database-index-basics.mdx   # Phase 2 더미
├── jvm-gc-intro.mdx            # Phase 2 더미
└── kafka-consumer-group.mdx    # Phase 2 더미

tests/                          # Phase 1 17 + Phase 2 29 = 46 테스트
├── filters.test.ts             # 16 케이스
├── reading-time.test.ts        # 5 케이스
├── toc.test.ts                 # 6 케이스
└── velite-build.test.ts        # Phase 1 4 + Phase 2 추가 2 케이스 = 6

components.json                 # shadcn/ui 설정
velite.config.ts                # [수정] rehype-slug, readingTime, @shikijs/transformers
tailwind.config.ts              # [수정] darkMode: ['selector', '[data-theme="dark"]']
```

**§3에 있지만 아직 없는 디렉토리**: `components/visualizations/`, `plugins/`, `lib/keyword-map.ts`, `lib/search-index.ts` — Phase 3/4/5에서 생성.

### 14.2 핵심 의사결정 (변경 금지)

| 결정 | 이유 | 영향 |
|---|---|---|
| shadcn/ui 토큰 네이밍 채택 | Toss/Doodlin/pathsdog 벤치마크가 shadcn neutral 테마 범위와 광학적으로 일치 | CSS 변수는 `--background/--foreground/--primary/...` 등 shadcn 컨벤션. 프로젝트 고유는 `--keyword`, `--keyword-bg`, `--border-strong`로 공존 |
| `next-themes` with `attribute="data-theme"` | CSS 선택자 `[data-theme="dark"]`와 정합 | `ThemeProvider`의 `attribute` prop을 절대 바꾸지 말 것. 변경 시 CSS 매칭이 깨짐 |
| Velite `s.toc()` + `rehype-slug` 조합 | 양쪽 모두 `github-slugger` 기반이라 id 일치 구조적 보장 | 자체 TOC 플러그인 미작성. 계층 구조는 `lib/toc.ts`의 `flattenToc()`로 flat 변환 |
| 서버 사이드 필터링 (`applyFilters` in `app/page.tsx`) | 클라이언트 번들에 필터 로직 미포함 + Phase 5 FlexSearch 교체 시 서버 함수만 변경 | `SearchBar`/`TagFilterBar`/`SortSelect`는 URL 쿼리만 변경. Next.js가 `searchParams` 변경을 감지해 재렌더. `router.push(url, { scroll: false })`로 스크롤 위치 보존 |
| 검색 debounce 250ms + 한글 IME 체크 | 한글 조합 중에는 debounce 연기 | `SearchBar`의 `onChange`는 `e.nativeEvent.isComposing` 검사, `onCompositionEnd`로 최종 커밋. refs로 stale closure 방지 (`currentTagRef`, `currentSortRef`, `defaultQueryRef`) |
| 폰트 local 셀프 호스팅 | 로컬 전용 프로젝트 원칙 + Next.js CLS 방어 | 외부 CDN 금지. `public/fonts/` 하위 2개 파일 커밋 (Pretendard woff2 2MB, JetBrains Mono TTF 293KB) |
| `formatDate`는 UTC getters | Velite `s.isodate()`는 `YYYY-MM-DD` → midnight UTC 파싱 | `lib/utils.ts`의 `formatDate`는 `getUTC*` 사용. 로컬 getter 사용 금지 |
| `koCollator` 공유 | `sortPosts('title')`과 `extractAllTags` 타이브레이크에 일관된 한글-aware 정렬 | `lib/filters.ts`의 모듈 레벨 `Intl.Collator('ko', { sensitivity: 'base' })` 인스턴스를 두 함수가 공유 |
| Shiki 라인 하이라이트는 `.highlighted` 클래스 선택자 | `@shikijs/transformers@4`의 `transformerNotationHighlight`는 `data-*` 속성이 아닌 `className`을 생성 | `app/globals.css`의 `.prose-kr .highlighted` 선택자. `[data-highlighted-line]`로 바꾸지 말 것 |
| 테스트 범위: 순수 함수만 | `@testing-library/react` + jsdom 모킹 비용 대비 효용 낮음 | UI 회귀는 `pnpm build` + dev 서버 수동 확인으로 방어. Phase 6에서 Playwright 검토 |
| `Intl.Collator('ko')` 정렬 순서 | V8 ICU 기본 빌드: Hangul → Latin 순 | `sortPosts('title')` 테스트 기대값 작성 시 이 순서를 반영. 다른 Node 환경에서는 재검증 필요 |

### 14.3 명령어 치트시트

```bash
pnpm dev              # 개발 서버
pnpm build            # 프로덕션 빌드 (Velite 선행)
pnpm test             # velite build && vitest run (46 테스트)
pnpm test:unit        # vitest run만 (velite 스킵)
pnpm type-check       # tsc --noEmit
pnpm lint             # next lint (Next 16에서 ESLint CLI 전환 예정)
pnpm velite           # Velite만 실행
```

### 14.4 알려진 미결 사항 (후속 Phase에서 처리)

- **관련 글 추천** — Phase 5 ("탐색 기능")
- **태그 전용 페이지 `/tags/[tag]`** — Phase 5
- **키워드 자동 링크** — Phase 3
- **검색 대상에 본문 포함** — Phase 5 FlexSearch 도입 시
- **`series`/`seriesOrder` 정합성 `.refine()`** — 한쪽만 있는 경우 스키마 에러 없음. Phase 5 시리즈 UI 도입 전 추가 필요
- **반응형 미세 조정** — Phase 6
- **성능 최적화** (이미지 blur placeholder, 폰트 preload 최적화 등) — Phase 6
- **shadcn Button / Badge 프리미티브**는 도입되었지만 아직 사용 컴포넌트 없음 — Phase 3+에서 KeywordLink Popover, CalloutBox 등이 소비 예정

### 14.5 리포지토리

- **원격**: `https://github.com/ing9990/backend-notes` (private)
- **Phase 2 태그**: `phase-2-complete`
- **브랜치 전략**: Phase 1과 동일하게 단일 `main`에 직접 커밋 (`phase-2-core-ui` 브랜치에서 작업 후 fast-forward merge). Phase 3부터 feature 브랜치 유지 검토.

---

## 15. Phase 3 구현 현황

> Phase 3 완료 시점(2026-04-15)의 실제 구현 상태. §13/§14와 동일 포맷.

### 15.1 존재하는 파일 (Phase 3에서 추가·변경)

```
scripts/
└── generate-keyword-map.ts      # pre-build I/O 스크립트 (tsx)

lib/
├── generated/
│   └── keyword-map.ts           # 빌드 타임 생성 TS 상수 (커밋 대상)
└── keyword-matcher.ts           # findMatches, hasBoundary 순수 함수

plugins/
└── remark-auto-link.ts          # MDAST text → link 치환, visitParents 기반

components/
├── blog/
│   └── KeywordLink.tsx          # 'use client', shadcn Popover 래퍼
├── mdx/
│   └── components.tsx           # [수정] a override에 data-keyword-link 분기
└── ui/
    └── popover.tsx              # shadcn CLI 생성

velite.config.ts                 # [수정] mdx.remarkPlugins 추가
package.json                     # [수정] prebuild/predev/pretest + tsx/gray-matter/unist-util-visit-parents/@radix-ui/react-popover
content/posts/
├── hello-world.mdx              # [수정] B-Tree 본문 참조 추가
└── b-tree-structure.mdx         # 신규, B-Tree 키워드 선언

tests/
├── keyword-matcher.test.ts      # 19 케이스 (hasBoundary 8 + findMatches 11)
├── generate-keyword-map.test.ts # 10 케이스
├── remark-auto-link.test.ts     # 10 케이스
└── velite-build.test.ts         # [수정] +2 통합 테스트 (self-link 방지 + 마커 존재)
```

### 15.2 핵심 의사결정 (변경 금지)

| 결정 | 이유 | 영향 |
|---|---|---|
| Remark (MDAST) 단계에서 치환 | 코드/링크 ancestor 판정이 MDAST 노드 타입으로 선언적 | Rehype 단계(code block이 `<pre>`로 감싸진 후)에서 탐지가 어려움 |
| `lib/generated/keyword-map.ts` 커밋 대상 | Clean clone에서 즉시 빌드 가능 + 히스토리 추적 | 키워드 변경 시 diff 노이즈 발생 (수용) |
| 키워드 맵 키는 lowercase | 대소문자 무시 매칭 (`B-Tree` = `b-tree`) | `generate-keyword-map`이 정규화, `findMatches`가 lowercase 비교, 원본 case는 `text.slice`로 복원 |
| 한글 뒤 경계 완화 | 한국어 조사(`를/가/의/는/...`) 허용 필수 | 드문 오탐은 긴 복합어를 별도 키워드로 등록해 해결 |
| `currentSlug`는 파일 basename | Velite API 의존 없음 | Velite `s.slug('post')` 규칙과 일치 (파일명 = slug 전제) |
| `scanPosts`는 재귀적 | 미래 `content/posts/<category>/` 서브디렉토리 지원 | `readdir` 결과에서 디렉토리면 재귀 호출 |
| 충돌 시 빌드 실패 | 1:1 매핑 원칙을 즉시 강제 | 작성자가 30초 내 해결 가능한 에러 메시지 |
| `serializeMap` 출력 정렬 결정적 | git diff 노이즈 최소화 | 키워드를 `localeCompare`로 정렬 후 직렬화 |
| 데스크톱/모바일 이중 렌더 | `@media (hover: hover)` 기반 분기를 JS 런타임 없이 달성 | 두 벌 렌더 비용은 짧은 키워드 텍스트라 무시 가능 |
| `KEYWORDS_BY_LENGTH` 사전 정렬 | Greedy matching 시 매 호출마다 재정렬 방지 | 빌드 타임에 한 번만 정렬 |

### 15.3 명령어 치트시트

```bash
pnpm dev                    # Velite + Next (prebuild/predev로 키워드 맵 자동 생성)
pnpm build                  # 프로덕션 빌드 (prebuild 포함)
pnpm test                   # pretest로 키워드 맵 생성 + velite + vitest (총 ~87 테스트)
pnpm test:unit              # vitest only (키워드 맵은 기존 상태 유지)
pnpm generate-keyword-map   # 수동 재생성 (frontmatter 수정 후)
pnpm type-check             # tsc --noEmit
pnpm velite                 # Velite만 실행
```

### 15.4 알려진 미결 사항 (후속 Phase에서 처리)

- **HMR 지원**: dev 모드에서 새 MDX 파일 추가 시 자동 재생성 — Phase 6 polish
- **키워드 변형/별칭**: `B-Tree` ↔ `B트리` ↔ `비트리` — Phase 5+
- **Aho-Corasick 매칭 최적화**: Greedy + claimed O(K×T) 성능 문제 발생 시 Phase 6
- **키워드 역링크 표시** ("이 글을 참조하는 글들"): Phase 5 관련 글 추천에 흡수
- **Reference-style 링크 ancestor 제외**: 현재 `link`/`inlineCode`/`code`만 제외하고 `linkReference`는 제외하지 않음. 실제 사용 시 문제 발생하면 Phase 6에서 추가

### 15.5 리포지토리

- **원격**: `https://github.com/ing9990/backend-notes` (private)
- **Phase 3 태그**: `phase-3-complete`
- **브랜치 전략**: Phase 2와 동일하게 단일 `main` 브랜치에 직접 또는 `phase-3-keyword-system` feature 브랜치 후 squash merge.

---

## 16. Phase 4.1 구현 현황

> Phase 4.1 완료 시점(2026-04-15)의 구현 상태. §13–15와 동일 포맷.

### 16.1 존재하는 파일 (Phase 4.1에서 추가·변경)

```
components/visualizations/
├── common/                          [신규 디렉토리]
│   ├── colors.ts                    VIZ_STATES + vizStateClasses()
│   ├── useStepController.ts         상태 관리 훅 (4 useState + 3 useEffect)
│   ├── VisualContainer.tsx          figure 래퍼 (server component)
│   ├── SpeedSlider.tsx              5 세그먼트 배터리 게이지
│   └── StepController.tsx           컨트롤 행 + 진행 바 + 스텝 설명
└── QuickSort.tsx                    [수정] 새 프레임워크 사용

app/globals.css                      [수정] --viz-* 18 + @theme inline 매핑 18

tests/
└── use-step-controller.test.ts      [신규] jsdom 파일 pragma, 16 케이스

package.json                         [수정] @testing-library/react, @testing-library/dom, jsdom
```

### 16.2 핵심 의사결정 (변경 금지)

| 결정 | 이유 | 영향 |
|---|---|---|
| Step-by-step only | 실제 사례 1개(QuickSort)만 존재 → API 추출 근거 유일 | Playground/Timeline은 Phase 4.2/4.3로 이월 |
| 훅 + dumb 컴포넌트 | 보일러플레이트 제거 + `renderHook` 단위 테스트 가능 | `<StepController {...controller} />` spread 패턴 강제 |
| `@vitest-environment jsdom` 파일 pragma | 전역 `vitest.config.ts`는 `environment: 'node'` 유지 | 새 훅/DOM 테스트 파일마다 상단 pragma 필수 |
| 6 상태 × 3 슬롯 일괄 정의 | 확장성 우선 (사용자 명시적 요구) | 현재 blocked/waiting/highlight는 미사용이지만 CSS 변수만 추가되므로 비용 적음 |
| `vizStateClasses()` switch literal | Tailwind content scanner는 리터럴 클래스만 감지 | `` `border-viz-${state}` `` 같은 동적 문자열 사용 금지 |
| `goTo()` 호출 시 자동 중지 | 수동 점프 = 사용자 의도적 개입 | auto-play 중 스크러빙 시 명시적 재생 요구 |
| QuickSort 2-커밋 refactor | Pure refactor 검증 가능 | 커밋 1은 visual-identical, 커밋 2에서 SpeedSlider/progress 노출 |

### 16.3 명령어 치트시트

```bash
pnpm dev                                          # 개발 서버
pnpm build                                        # 프로덕션 빌드
pnpm test                                         # velite build + vitest run (~103 테스트)
pnpm test:unit tests/use-step-controller.test.ts  # 훅 테스트만
pnpm type-check                                   # tsc --noEmit
```

### 16.4 알려진 미결 사항 (후속 서브 페이즈)

- **Phase 4.2 (Interactive Playground)**: `ControlPanel`, `SegmentedControl` 등. Isolation Level/GC 임계값/Cache TTL 시각화 첫 등장 시 도입.
- **Phase 4.3 (Timeline/Concurrent)**: `TimelineTrack`, `ActorSwimlane` + `--viz-actor-1~4` 토큰. Lock 경합/MVCC/Cache Stampede 시각화 첫 등장 시 도입.
- **시각화 간 state 공유**: 현재 각 시각화는 독립. 한 글에 여러 시각화 연동 필요 시 Context API 도입 검토.

### 16.5 리포지토리

- **Phase 4.1 태그**: `phase-4-1-complete`
- **브랜치 전략**: Phase 2/3과 동일, `main` 직접 또는 feature 브랜치 squash merge.
