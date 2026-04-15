# Visualization Rules

Stage 2 노트 작성 시 스킬이 시각화 필요 신호를 자동 감지하고, Stage 3 진입 직전 사용자에게 후보 + 옵션을 제시한다. 신규 시각화 컴포넌트는 v1에서 일회성으로 생성되지만 Phase 4 프레임워크 리팩토링을 전제로 한다.

---

## 감지 휴리스틱 (시각화 필요 신호)

Stage 2 노트를 작성하는 동안 아래 신호를 감지하면 해당 섹션을 시각화 후보로 표시한다:

- **키워드 빈도**: "동작 방식", "상태 변화", "시간 순서", "동시 실행", "단계별 진행"이 한 섹션에 3회 이상 등장
- **Q&A 난이도**: Stage 1에서 측정한 난이도 점수 3 이상인 섹션
- **개념 키워드**: "race condition", "타이밍", "병렬", "락", "deadlock", "GC", "mark-sweep", "rebalancing", "partition", "context switch" 등 동시성/분산 시스템 관련 핵심어 포함
- **사용자의 명시적 요청**: "시각화 넣어줘", "그림으로 보여줘", "애니메이션으로" 등

4가지 신호 중 1개라도 해당하면 후보로 등록한다. 후보 등록은 "반드시 시각화를 만든다"가 아니라 "Stage 3 진입 전 사용자에게 물어본다"는 의미다.

---

## 제안 단계 (Stage 3 진입 직전)

Stage 2 노트가 완성된 뒤 Stage 3 진입 직전에 시각화 후보가 있으면 아래 형식으로 제시한다:

```
노트 분석 결과 시각화 후보를 발견했습니다:

  1. "<주제 1>" (Section N) — 난이도 X
     기존 컴포넌트: [있음: <컴포넌트명> / 없음]
     [A] 신규 컴포넌트 생성
     [B] 정적 SVG로 대체
     [C] 건너뜀

  2. "<주제 2>" (Section M) — 난이도 Y
     기존 컴포넌트: [있음: <컴포넌트명> / 없음]
     [A] 신규 컴포넌트 생성
     [B] 정적 SVG로 대체
     [C] 건너뜀

선택: "1-A, 2-B" 또는 "기본값으로" 라고 응답해주세요.
```

"기본값으로" 응답 시 각 후보에 대해 아래 §기본값 판단 기준에 따라 스킬이 자동 결정한다.

---

## 기본값 판단 기준 (React vs SVG vs 건너뜀)

### [A] React 컴포넌트

**적용 대상**: 시간 변화, 단계 진행, 동시 실행, 사용자 조작으로 결과가 달라지는 개념.

예시:
- 알고리즘 단계별 진행 (퀵소트, 병합정렬, LRU eviction)
- Lock 경합 타임라인 (Shared/Exclusive lock 충돌 과정)
- GC mark-sweep 과정 (힙 상태가 단계별로 변화)
- Transaction Isolation Level playground (사용자가 격리 수준 조절)
- Thread 상태 전이 (NEW → RUNNABLE → WAITING → TERMINATED)
- Consumer Group 리밸런싱 (파티션 재할당 단계)

### [B] 정적 SVG

**적용 대상**: 관계도, 구조도, 함수 곡선, 트레이드오프 매트릭스, 개념도. 한 번 보면 이해되는 정적 구조.

예시:
- 캐시 스탬피드 타임라인 개념도 (시간축 위 요청 폭발 시각화)
- XFetch β 파라미터 확률 곡선 (수식 직관화)
- B-Tree 노드 구조 스냅샷 (분할 전후 상태 비교)
- CAP 정리 삼각형 (C/A/P 선택 관계)
- OSI 7 계층 구조 (레이어 적층 관계)
- 시스템 아키텍처 개념도 (컴포넌트 간 관계)

### [C] 건너뜀

**적용 대상**: 텍스트와 코드만으로 충분히 설명 가능하거나, 시각화가 오히려 혼란을 주는 경우.

예시:
- 단순 비교 ("A는 빠르고 B는 정확함" — 표로 충분)
- 수학 공식 자체가 시각화인 경우 (수식이 곧 개념)
- 설정 방법, API 사용법 (코드 블록으로 충분)
- 안티패턴 vs 올바른 패턴 (before/after 코드 블록으로 충분)

---

## 신규 React 컴포넌트 규약

### 경로 및 선언

- **경로**: `components/visualizations/<PascalCase>.tsx`
  - 예: `LockContention.tsx`, `CacheStampedeTimeline.tsx`, `ConsumerRebalance.tsx`
- **`'use client'` 필수**: 상호작용이 있으므로 서버 컴포넌트로 작성하지 않는다.

### 구현 패턴

`QuickSort.tsx` 패턴을 재사용한다:
- `useState`로 현재 스텝 인덱스 관리
- `useMemo`로 전체 스냅샷 배열 사전 계산
- Prev / Next / Play / Reset 컨트롤 제공
- 색상 시맨틱 준수 (CLAUDE.md §6.4):
  - `amber` — 피벗/기준 요소
  - `blue` — 비교 중/대기 중
  - `emerald` — 확정/완료
  - `red` — 충돌/오류

### 상단 주석 필수

모든 신규 시각화 컴포넌트 파일 최상단에 아래 주석을 붙인다:

```tsx
// Phase 4 preview — will be refactored with VisualContainer/StepController when Phase 4 ships
```

이 주석이 Phase 4 리팩토링 대상을 grep으로 찾을 수 있게 해준다.

### MDX 등록

컴포넌트 생성 후 `components/mdx/components.tsx`의 `mdxComponents` 객체에 자동 등록한다. 등록하지 않으면 MDX 파일에서 컴포넌트를 사용할 수 없다.

### 디자인 구조

컴포넌트 내부를 아래 4개 영역으로 구성한다:
1. **제목 + 1~2 문장 설명** (컴포넌트 상단)
2. **시각 영역** (배열, 타임라인, 노드 구조 등 핵심 시각화)
3. **스텝 설명 텍스트** (현재 단계가 무엇을 하고 있는지 — 하단)
4. **컨트롤 버튼 + 범례(legend)**

**참고 파일**: `components/visualizations/QuickSort.tsx` — 실제 구현 예시. 새 컴포넌트 작성 전 반드시 읽는다.

---

## 신규 SVG 규약

### 경로

`public/images/<slug>-<descriptor>.svg`

예: `cache-stampede-timeline.svg`, `b-tree-node-split.svg`, `cap-theorem-triangle.svg`

### 기술 규칙

- **viewBox**: `600 200` 내외. 본문 max-width(720px)에 맞게 조정.
- **접근성**: `role="img"` + `aria-label="..."` 필수. 스크린 리더 사용자가 내용을 이해할 수 있어야 한다.
- **색상**: `globals.css`의 CSS 변수와 대응하는 hex 사용. 라이트/다크 모드 모두에서 구분 가능한 색상을 선택한다. CSS 변수를 SVG에 직접 쓰면 일부 환경에서 렌더링 실패하므로 hex로 명시한다.
- **텍스트**: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` 시스템 폰트 스택 사용.

### MDX 삽입

마크다운 이미지 문법으로 삽입한다:

```mdx
![alt text — 이미지 내용 설명](/images/<파일명>.svg)
```

스킬의 `img` MDX override가 라운드 코너(`rounded-lg`)를 자동 적용하므로 별도 스타일링 불필요.

**참고 파일**: `public/images/quicksort-diagram.svg` — 실제 구현 예시.

---

## 중복 검사

신규 컴포넌트 또는 SVG 생성 전에 기존 파일을 스캔한다.

- **정확 매치**: 동일한 파일이 이미 존재하면 재사용한다. 메시지: "이미 `LockContention.tsx`가 있습니다. 재사용합니다."
- **유사 매치**: 유사한 이름의 파일이 있으면 사용자에게 확인을 요청한다. 메시지: "비슷한 `DatabaseLock.tsx`가 있습니다. 이걸로 충분한가요? 아니면 별도 컴포넌트를 만들까요?"
- **매치 없음**: 신규 생성을 진행한다.

중복 검사를 생략하면 거의 동일한 컴포넌트가 여러 개 생길 수 있다. 반드시 스캔 후 생성을 결정한다.

---

## Phase 4 프레임워크 준비

v1에서 생성된 시각화는 모두 **일회성 자립형 컴포넌트**다. `VisualContainer`, `StepController`, `SpeedSlider` 같은 공통 프레임워크가 아직 없으므로, 각 컴포넌트가 컨트롤 UI와 레이아웃을 직접 구현한다.

Phase 4에서 공통 프레임워크가 도입되면 v1 컴포넌트들이 리팩토링된다. 상단 주석(`// Phase 4 preview — will be refactored...`)이 대상을 명시하므로, Phase 4 진행 시 grep으로 전체 목록을 찾을 수 있다.

**중요**: v1에서는 공통 프레임워크가 없다는 이유로 시각화 생성을 미루지 않는다. 지금 독자에게 가치 있는 시각화를 지금 만든다. 리팩토링은 Phase 4에서 일괄 처리한다.
