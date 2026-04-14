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

### 5.1 동작 원리

이 시스템은 **빌드 타임**에 동작하며, 런타임 비용은 0입니다.

```
[빌드 시작]
    │
    ▼
1. 전체 MDX 파일 스캔 → keyword-to-slug 맵 생성
    │  예: { "B-Tree": "/posts/b-tree-structure",
    │        "Kafka Consumer": "/posts/kafka-consumer-group" }
    ▼
2. 각 MDX 파일 파싱 시 remark-auto-link 플러그인 실행
    │  - 본문 텍스트 노드에서 키워드 매칭
    │  - 자기 자신의 키워드는 제외
    │  - 매칭된 키워드를 <KeywordLink> 컴포넌트로 치환
    ▼
3. 결과: 본문의 "B-Tree를 사용합니다" →
         "<KeywordLink href='/posts/b-tree-structure'>B-Tree</KeywordLink>를 사용합니다"
```

### 5.2 remark-auto-link 플러그인 명세

```typescript
// plugins/remark-auto-link.ts

interface AutoLinkOptions {
  keywordMap: Map<string, string>;  // keyword → slug
  currentSlug: string;              // 현재 처리 중인 글의 slug
}

/**
 * 규칙:
 * 1. 자기 자신의 slug로 연결되는 키워드는 링크하지 않음
 * 2. 코드 블록(`code`, `inlineCode`) 내부의 키워드는 링크하지 않음
 * 3. 이미 링크(`link`) 안에 있는 키워드는 이중 링크하지 않음
 * 4. 한 글에서 같은 키워드는 첫 번째 등장만 링크 (반복 링크 방지)
 * 5. 긴 키워드부터 먼저 매칭 (greedy matching)
 *    예: "Kafka Consumer Group"이 "Kafka"보다 먼저 매칭
 * 6. 단어 경계 체크: "B-Tree" 키워드가 "AB-Tree"에 매칭되면 안 됨
 */
```

### 5.3 KeywordLink 컴포넌트

```tsx
// components/blog/KeywordLink.tsx
// - 일반 하이퍼링크와 시각적으로 구분: 점선 밑줄 + 살짝 다른 색상
// - 호버 시 글 제목 + 요약을 보여주는 프리뷰 팝업 (Popover)
// - 팝업은 키보드 접근 가능 (a11y)
```

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

**공통 컴포넌트:**

```typescript
// components/visualizations/common/VisualContainer.tsx
interface VisualContainerProps {
  title: string;           // 시각화 제목
  description?: string;    // 한 줄 설명
  children: React.ReactNode;
  onReset?: () => void;    // 초기 상태로 리셋
}

// components/visualizations/common/StepController.tsx
interface StepControllerProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;      // 자동 재생 토글
  isPlaying: boolean;
  stepDescription?: string; // 현재 단계 설명 텍스트
}

// components/visualizations/common/SpeedSlider.tsx
interface SpeedSliderProps {
  speed: number;           // 1~5 (1=느림, 5=빠름)
  onChange: (speed: number) => void;
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

**색상 — 시각화 전용 시맨틱 토큰:**

```typescript
// components/visualizations/common/colors.ts
export const vizColors = {
  // 상태 색상
  active:    'var(--color-accent)',        // 현재 처리 중
  comparing: 'var(--color-keyword)',       // 비교 중
  confirmed: '#22C55E',                    // 확정/완료 (green)
  pivot:     '#F59E0B',                    // 피벗/기준 (amber)
  waiting:   '#9CA3AF',                    // 대기 중 (gray)
  blocked:   '#EF4444',                    // 차단/충돌 (red)
  highlight: '#8B5CF6',                    // 특별 강조 (purple)

  // 주체 구분 (최대 4개 주체)
  actor1:    '#3B82F6',                    // blue
  actor2:    '#F97316',                    // orange
  actor3:    '#8B5CF6',                    // purple
  actor4:    '#06B6D4',                    // cyan
} as const;
```

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

```css
/* globals.css — CSS 변수 */
:root {
  --color-bg:         #FFFFFF;
  --color-bg-subtle:  #F8F9FA;
  --color-text:       #1A1A2E;
  --color-text-secondary: #6B7280;
  --color-border:     #E5E7EB;
  --color-accent:     #3B82F6;      /* 프라이머리 액센트 */
  --color-accent-soft: #EFF6FF;     /* 액센트 배경 */
  --color-keyword:    #6366F1;      /* 키워드 링크 색상 */
  --color-keyword-bg: #EEF2FF;      /* 키워드 호버 배경 */
}

[data-theme="dark"] {
  --color-bg:         #0F0F1A;
  --color-bg-subtle:  #1A1A2E;
  --color-text:       #E5E7EB;
  --color-text-secondary: #9CA3AF;
  --color-border:     #2D2D3F;
  --color-accent:     #60A5FA;
  --color-accent-soft: #1E293B;
  --color-keyword:    #818CF8;
  --color-keyword-bg: #1E1B4B;
}
```

### 7.3 타이포그래피

- **본문**: Pretendard (또는 시스템 폰트 스택), 16px, line-height 1.8
- **제목 h1**: 28px, font-weight 700
- **제목 h2**: 22px, font-weight 600
- **제목 h3**: 18px, font-weight 600
- **코드**: JetBrains Mono (또는 Fira Code), 14px
- **카드 제목**: 18px, font-weight 600
- **카드 요약**: 14px, color: text-secondary

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

1. **Phase 1 — 기반 구축**: Next.js 프로젝트 초기화, Velite 설정, MDX 파이프라인, 샘플 글 1개 `/posts/[slug]` 렌더링
2. **Phase 2 — 핵심 UI**: 인덱스 페이지 (카드 리스트 + 검색 + 필터), 글 상세 페이지 (본문 + TOC)
3. **Phase 3 — 키워드 시스템**: remark-auto-link 플러그인, KeywordLink 컴포넌트, 키워드 맵
4. **Phase 4 — 시각화 프레임워크**: VisualContainer, StepController, SpeedSlider 공통 컴포넌트 구축
5. **Phase 5 — 탐색 기능**: FlexSearch 통합, 관련 글 추천, 태그 페이지
6. **Phase 6 — 마무리**: 다크모드, 반응형, 성능 최적화

> **시각화 컴포넌트 개별 구현**은 Phase 4 이후 각 글을 작성할 때 해당 주제에 맞게 함께 구현합니다.
> 예: "퀵소트" 글 작성 시 → `QuickSort.tsx` 시각화 컴포넌트도 함께 구현
