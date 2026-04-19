# Visualization Rules

Stage 2 노트 작성 시 스킬이 시각화 필요 신호를 자동 감지하고, Stage 3 진입 직전 사용자에게 후보 + 옵션을 제시한다. 신규 시각화 컴포넌트는 v1에서 일회성으로 생성되지만 Phase 4 프레임워크 리팩토링을 전제로 한다.

이 블로그의 시각화 품질 기준은 `content/posts/quick-sort.mdx`가 best-case이며, 모든 신규 글은 그 수준을 목표로 한다.

---

## 최우선 원칙: 구현 비용은 판단 기준이 아니다

시각화 제안·설계 단계에서 **구현 비용(복잡도·작성 시간·컴포넌트 수)은 평가 축이 아니다**. 평가하는 것은 단 두 가지뿐이다:

1. **효과 (이해 가능성)**: 이 시각화가 실제로 독자의 이해를 끌어올리는가? 없을 때와 있을 때 차이가 체감되는가?
2. **가시성 (디자인 품질)**: 라이트/다크·모바일 375px·스크린 리더 모두에서 의도한 정보가 선명히 전달되는가? 디자인 토큰·viz state·반응형이 제대로 녹아 있는가?

**금지된 rationalization**: "구현이 복잡하니 더 단순한 안으로 가자", "비용이 크니 범위를 줄이자", "일단 정적으로만 하자(사실은 인터랙티브가 맞지만)". AI 생산성을 전제로 하므로 구현 난이도가 옵션 A↔B 선택을 바꿔선 안 된다. 옵션 비교 시 trade-off는 효과·가시성 축에서만 서술한다 (예: "A안은 정보량이 많아 첫 인지 부담이 크다" ← OK / "A안은 구현이 복잡하다" ← 금지).

복수 viz를 한 글에 넣어야 효과가 극대화된다면 넣는다. 기존 컴포넌트가 있어도 pedagogically 다른 그림이 필요하면 신규 작성한다. 사용자가 명시적으로 "간소화해라"라고 요청하지 않는 한, 기본 스탠스는 "최대 효과의 설계를 구현한다"이다.

---

## 시각화 수단 (A-1, A-2 두 가지만)

이 스킬에서 시각화 수단은 **React 컴포넌트 두 종류뿐**이다. 정적 SVG·이미지 파일 시각화는 **폐기**되었다 (모바일 축소 시 가독성 붕괴, 다크모드 미대응, 디자인 시스템 토큰 접근 불가 때문). 기존에 작성된 `public/images/*.svg`는 그대로 두되, 신규 글에서는 생성하지 않는다.

- **[A-1] 인터랙티브 React 컴포넌트** — 상태 변화·단계 진행·사용자 조작
- **[A-2] 정적 React 컴포넌트** — viz state 컬러 시스템이 필요한 비교·트레이드오프 시각화 (인터랙션 불필요)

---

## 금지 사항 (예외 없음)

아래 두 가지 위반은 블로그 스타일의 근본을 흔드므로 예외 없이 금지된다. 이 섹션은 하단의 판단 기준·템플릿보다 우선하며, 충돌 시 이 섹션이 이긴다.

### 1. ASCII art로 시각화를 대체하는 것

구조도, 다이어그램, 상태 변화, 단계별 흐름이 필요한 부분을 **` ```text `** 또는 일반 코드 블록 내부의 ASCII art(박스 드로잉 문자 `┌─┐└┘├┤`, 화살표 `→↓↑←`, 트리 모양, 타임라인 등)로 대체하는 것은 **금지**된다. 시각화가 필요하면 **React 컴포넌트([A-1] 인터랙티브 또는 [A-2] 정적)만** 사용한다.

"ASCII도 설명이 된다", "시간이 없다", "단순한 다이어그램이다" 같은 rationalization은 허용되지 않는다. 시각화가 필요하다고 판단된 순간부터 React 외의 선택지는 존재하지 않는다.

**예외 (허용되는 코드 블록 내부 텍스트)**:
- 파일 시스템 트리 (`ls -R` 출력 수준)
- 명령어 프롬프트 출력, 터미널 세션 재현 (예: `$ pnpm build` 출력)
- 콘솔 로그, 빌드 로그
- 표 형태의 순수 텍스트 정렬 (예: 수치 비교 열)

이들은 "시각화"가 아니라 **"텍스트 출력 재현"** 이므로 코드 블록에 그대로 둔다. 반면 "B-Tree의 모양을 ASCII 박스로 그린 그림", "페이지 분할 전/후를 ASCII 박스로 비교한 그림", "타임라인을 `---` 막대로 그린 그림"은 전부 시각화에 해당하므로 금지 대상이다.

**판별 기준**: "이 ASCII 블록이 구조·관계·상태 변화를 시각적으로 전달하려는가?" → Yes면 금지. "이 텍스트 블록이 명령어 실행 결과 또는 파일 목록을 재현하는가?" → Yes면 허용.

### 2. 시각화 후보를 self-decide로 건너뛰는 것

Stage 2 노트 작성 중 §감지 휴리스틱 기준으로 시각화 후보가 1개라도 감지되었으면, Claude가 **혼자** "ASCII로 충분하다" 또는 "없음"이라고 결정해 노트에 `시각화 후보: 없음`이라고 쓰는 것은 **금지**된다. 반드시 §제안 단계의 사용자 확인 템플릿을 통해 사용자에게 `[A-1] 인터랙티브 / [A-2] 정적 React / [C] 건너뜀` 중 하나를 선택하게 해야 한다.

사용자가 명시적으로 **`[C] 건너뜀`을 선택한 경우에만** 해당 후보를 생략할 수 있다. 이 단계를 skip하면 Stage 2 노트는 미완성으로 간주한다.

이 규칙의 목적: "편의를 위한 shortcut"으로 React 컴포넌트 생성을 회피하는 것을 구조적으로 차단한다. 사용자는 후보의 존재를 알 권리가 있으며, 생략 결정은 사용자의 몫이다. Claude가 대신 결정하는 것은 정책 위반이다.

---

## 감지 휴리스틱 (시각화 필요 신호)

Stage 2 노트를 작성하는 동안 아래 신호를 감지하면 해당 섹션을 시각화 후보로 표시한다:

- **키워드 빈도**: "동작 방식", "상태 변화", "시간 순서", "동시 실행", "단계별 진행"이 한 섹션에 3회 이상 등장
- **Q&A 난이도**: Stage 1에서 측정한 난이도 점수 3 이상인 섹션
- **개념 키워드**: "race condition", "타이밍", "병렬", "락", "deadlock", "GC", "mark-sweep", "rebalancing", "partition", "context switch" 등 동시성/분산 시스템 관련 핵심어 포함
- **가독성 밀도**: 한 H2 섹션 아래 H3가 2개 이상이거나, 한 덩어리 텍스트가 600자(한국어 기준) 이상 쌓일 것으로 예상되는 섹션. 난이도와 **독립적으로** 작동한다 — 어렵지 않아도 빽빽하면 독자 피로도가 급격히 오르므로, 헤딩 사이 / 텍스트 중간에 구분 요소(시각화 · 비교표 · 코드블록 · 짧은 예시 박스)를 배치한다. 상세 규칙: `stage-2-note.md` §가독성 밀도 체크.
- **사용자의 명시적 요청**: "시각화 넣어줘", "그림으로 보여줘", "애니메이션으로" 등

5가지 신호 중 1개라도 해당하면 후보로 등록한다. 후보 등록은 "반드시 시각화를 만든다"가 아니라 "Stage 3 진입 전 사용자에게 물어본다"는 의미다.

---

## 제안 단계 (Stage 3 진입 직전)

Stage 2 노트가 완성된 뒤 Stage 3 진입 직전에 시각화 후보가 있으면 아래 형식으로 **반드시** 사용자에게 제시한다. 이 단계를 건너뛰고 노트에 "시각화 후보: 없음"으로 self-decide하는 것은 §금지 사항 §2 위반이다.

```
노트 분석 결과 시각화 후보를 발견했습니다:

  1. "<주제 1>" (Section N) — 난이도 X
     기존 컴포넌트: [있음: <컴포넌트명> / 없음]
     [A-1] 인터랙티브 React 컴포넌트
     [A-2] 정적 React 컴포넌트 (비교 바 차트 / 센티먼트 매트릭스)
     [C] 건너뜀

  2. "<주제 2>" (Section M) — 난이도 Y
     기존 컴포넌트: [있음: <컴포넌트명> / 없음]
     [A-1] 인터랙티브 React 컴포넌트
     [A-2] 정적 React 컴포넌트
     [C] 건너뜀

선택: "1-A-1, 2-A-2" 또는 "기본값으로" 라고 응답해주세요.
```

"기본값으로" 응답 시 각 후보에 대해 아래 §기본값 판단 기준에 따라 스킬이 자동 결정한다.

---

## 기본값 판단 기준 (인터랙티브 vs 정적 React vs 건너뜀)

### [A-1] 인터랙티브 React 컴포넌트

**적용 대상**: 시간 변화, 단계 진행, 동시 실행, 사용자 조작으로 결과가 달라지는 개념.

예시:
- 알고리즘 단계별 진행 (퀵소트, 병합정렬, LRU eviction)
- Lock 경합 타임라인 (Shared/Exclusive lock 충돌 과정)
- GC mark-sweep 과정 (힙 상태가 단계별로 변화)
- Transaction Isolation Level playground (사용자가 격리 수준 조절)
- Thread 상태 전이 (NEW → RUNNABLE → WAITING → TERMINATED)
- Consumer Group 리밸런싱 (파티션 재할당 단계)
- B-Tree 노드 분할 전후 (스텝으로 삽입·분할 시퀀스 재현)
- 캐시 스탬피드 타임라인 (시간축 위 요청 폭발, β 파라미터 조절)
- 시스템 구성도 (컴포넌트 간 흐름을 단계별 하이라이트로 표현)

### [A-2] 정적 React 컴포넌트

**적용 대상**: 비교·트레이드오프 시각화에서 **viz state 컬러 시스템**이 필요하지만 단계별 인터랙션은 불필요한 경우. `vizStateClasses()` 헬퍼를 직접 사용할 수 있고, 다크/라이트 모드 대응이 자동이다.

예시:
- 항목별 수치 차이를 색상 코딩된 바 차트로 비교 (CardinalitySpectrum 패턴)
- 트레이드오프 매트릭스에 긍정/부정/조건부 센티먼트 인디케이터 (CardinalityTradeoff 패턴)
- 스펙트럼/그래디언트 위에 항목을 배치하는 포지셔닝 차트
- 개념도·관계도 (CAP 삼각형, OSI 7계층 등 — 과거 SVG였던 정적 구조도도 여기로 수렴)

**판단 기준**: "마크다운 테이블의 숫자/텍스트만으로는 차이의 크기나 유불리가 직관적으로 전달되지 않는가?" → Yes면 정적 React.

**구현 규약**:
- `'use client'` 불필요 — 상태·이벤트 핸들러 없음, 서버 렌더링 호환
- `VisualContainer`로 감싸되 `StepController` 미사용
- `vizStateClasses(state)`로 색상 시맨틱 적용
- 참고 파일: `CardinalitySpectrum.tsx`, `CardinalityTradeoff.tsx`

### [C] 건너뜀

**적용 대상**: 텍스트와 코드만으로 충분히 설명 가능하거나, 시각화가 오히려 혼란을 주는 경우.

예시:
- 단순 비교 ("A는 빠르고 B는 정확함" — 표로 충분)
- 수학 공식 자체가 시각화인 경우 (수식이 곧 개념)
- 설정 방법, API 사용법 (코드 블록으로 충분)
- 안티패턴 vs 올바른 패턴 (before/after 코드 블록으로 충분)

---

## 시각 메타포 선택 가이드

A-1 / A-2 결정 다음 단계는 "어떤 시각 구조(메타포)로 그릴 것인가"이다. 같은 [A-1] 안에서도 시퀀스 다이어그램, 상태 전이도, 타임라인, 위치 이동 그림은 전혀 다른 정보를 효과적으로 전달한다. 개념 타입을 먼저 분류하고, 그에 맞는 메타포를 고른다.

### 개념 타입 → 메타포 매핑

| 개념 타입 | 추천 메타포 | 참고 컴포넌트 |
|---|---|---|
| **순차 알고리즘** (배열/노드의 단계별 변화) | 셀/노드 그리드 + step별 색상 | `QuickSort`, `BTreeInsert`, `TrieBuilder` |
| **공간적 객체 이동** (영역 사이 entity 이동) | 영역 박스 + entity가 이동 | `GCCycle` (Eden→Survivor→Old) |
| **요청 ↔ 응답 메시지 흐름** | 시퀀스 다이어그램 (라이프라인 + 가로 화살표) | `RestaurantIOSequence` |
| **컴포넌트 간 단방향 호출 사슬** | 2~4 column 박스 + 단계별 화살표 인디케이터 | `IdempotencyKeyFlow` |
| **시간축 동시성/경합** | 행=주체, 열=시점, 셀=상태 | `CacheStampedeDefenseTimeline` |
| **인과 사슬 / 논리 단계** | 세로 박스 + step별 강조 | `IdempotencyCausalityChain` |
| **상태 머신 / 단계 전이** | 노드 그래프 + 전이 화살표 | `OptimizerPipeline` |
| **2x2 또는 NxM 비교** | 매트릭스 셀 (A-2) | `IOModelMatrix`, `CardinalityTradeoff` |
| **스펙트럼 / 그래디언트** | 선형 축 + 항목 배치 (A-2) | `CardinalitySpectrum` |
| **시스템 구조도 / 도메인 경계** | 박스 그래프, 포함 관계 | `DDDBoundedContext`, `GCHeapStructure` |
| **트리 구조 변화** | 트리 노드 + 분할/병합 애니메이션 | `BTreeInsert`, `TrieDeleteSnapshot` |

### 메타포 선택 안티패턴

다음은 자주 실수하는 잘못된 메타포 선택이다. 노트에서 발견되면 다른 메타포로 즉시 교체한다.

- **액터 상태 그리드** (각 actor의 "현재 상태"만 칸별로): "프로세스/메시지 흐름"이 핵심인 개념에는 부적합. 흐름이 보이지 않음. → 시퀀스 다이어그램으로 교체
- **정적 매트릭스 단독**: 시간 진행이 핵심인 개념에는 부적합 (4상한 매트릭스가 "왜 그렇게 되는가"의 메커니즘을 못 보여줌). 매트릭스는 요약용 [A-2]로 쓰고, 메커니즘은 별도 [A-1]로 분리.
- **단순 막대 차트**: "왜 그런가"의 메커니즘이 안 보임. 결과 비교일 때만 사용.
- **숫자 라벨만으로 정보 전달**: 색상/위치/모양 같은 시각 채널을 활용 안 하면 "그림"이 아니라 "표". 차라리 마크다운 테이블 사용.

---

## 애니메이션 패턴 가이드

### 언제 애니메이션이 가치 있는가?

다음 4가지 시나리오에서 애니메이션이 단순 정적 그림보다 가치를 더한다:

1. **상태 변화의 인과 관계**: "지금 마킹된 객체 → 그래서 다음 단계에서 sweep됨" (GC mark → sweep)
2. **공간적 이동**: "Eden에 있던 객체가 Survivor로 옮겨짐" (entity의 물리적 위치 변화)
3. **포커스 시프트로 N:1 관계 표현**: "한 서버가 N개 클라이언트를 차례로 처리" (multiplexing)
4. **경쟁 조건 / 타이밍**: "5개 요청이 같은 순간 도착해 stampede 발생" (시간 간격이 결과를 결정)

### 언제 애니메이션이 불필요한가?

- **비교 / 트레이드오프**: 항목들의 차이는 한 장에 보여야 비교가 쉬움 (A-2가 적합)
- **분류 / 스펙트럼**: 위치 자체가 정보 (A-2가 적합)
- **한 장의 상태 사진으로 충분한 개념**: 시스템 구조도, 클래스 다이어그램

### 애니메이션 디자인 원칙

1. **Step controller 우선** (continuous play보다): 독자가 자기 페이스로 학습. 자동 재생은 옵션, 수동 step이 기본
2. **Step description 필수**: "지금 이 단계에서 무슨 일이 일어났는가" 한 줄. 시각만으로는 의도 전달 불충분
3. **상태 transition은 300ms 내외**: 너무 빠르면 따라가기 어렵고, 너무 느리면 답답. `useStepController`의 기본 속도(800ms/step)도 비슷한 원칙
4. **Focus shift로 N개 entity 표현**: 한 화면에 모든 entity 띄우되, 활성만 강조(`opacity 1`), 비활성은 dim(`opacity 0.3`). 이렇게 하면 N=10 이상도 한 화면에 담기지 않고도 표현 가능
5. **`prefers-reduced-motion: reduce` 자동 처리**: `useStepController`가 자동 비활성화. 추가 코드 불필요
6. **상태 변화는 색상 시맨틱으로**: `vizStateClasses(state)`만 바꿔주면 transition은 framework가 처리

### 좋은 사례 1: GCCycle — 공간 이동 + 알고리즘 단계

`components/visualizations/GCCycle.tsx` 는 애니메이션의 가치를 가장 잘 보여주는 사례다. 이유:

- **공간적 이동을 시각화**: 객체 A·B·C가 Eden → Survivor 0 → Survivor 1 → Old generation으로 단계별 이동. 정적 그림으로는 "이동"이 안 보이지만 애니메이션은 자연스럽게 표현
- **알고리즘 단계가 시간 진행과 일치**: Mark → Sweep → Compact가 step으로 분리, 각 step의 노트가 "지금 무슨 일이 일어났는가"를 한 줄로 설명
- **복잡한 상태 변화의 추적**: 알고리즘 진행 중 어떤 객체가 살아남고 어떤 객체가 죽는지를 색상(`alive`/`garbage`/`moving`/`promoting`) + 위치(어느 영역에 있는가)로 한꺼번에 표현. 단순 표로는 불가능

이 패턴은 다음 개념에 그대로 적용 가능:
- LRU eviction (위치 변화)
- Kafka 파티션 리밸런싱 (assignment 이동)
- HashMap rehashing (버킷 재배치)
- B-Tree 노드 분할 (구조 변화)

### 좋은 사례 2: RestaurantIOSequence — 시퀀스 + 포커스 시프트

`components/visualizations/RestaurantIOSequence.tsx` (Sync/Async × Block/Non-Block 포스트)는 "요청 → 응답 메시지 흐름" + "1 서버 N 클라이언트" 두 차원을 동시에 표현한 사례. 특이점:

- **시퀀스 다이어그램 메타포 + 시간 = 세로 축**: 메시지 화살표가 라이프라인 사이를 가로지르며, 라이프라인의 빨간 음영이 "멈춘 시간"을 직접 시각화. 호출자가 free한 구간은 라이프라인이 비어 있어 자체가 신호
- **포커스 시프트 애니메이션으로 1:N 관계 표현**: multiplexing 시나리오에서 손님 A → B → C로 `activeCustomer`가 step별로 전환됨. dim된 손님은 보이긴 하되 흐릿함. "한 직원이 차례로 N명 처리"가 시청자의 시선 이동으로 직접 체험됨
- **시나리오 간 일관 레이아웃**: 4탭 모두 5라이프라인 동일 폭. 단일 손님 시나리오에서는 손님 B/C가 처음부터 끝까지 dim. 탭 전환 시 점프 없음

이 패턴은 다음 개념에 적용 가능:
- 분산 합의 알고리즘 (Paxos, Raft) — 노드 간 메시지 흐름
- Two-Phase Commit — Coordinator ↔ N Participants
- Pub/Sub Broker — Producer N → Broker → Consumer N
- Load Balancer — Client N → LB → Server N
- WebSocket / SSE — 단방향/양방향 메시지 비교

### 좋은 사례 3: IdempotencyKeyFlow — 3-Column 박스 + 화살표 인디케이터

컴포넌트 3개(Client, Keys Table, Business DB) 사이 호출 흐름을 step별로 단일 화살표 인디케이터로 표현. 각 박스의 색상이 step별로 바뀜.

**선택 기준**: 시퀀스 다이어그램이 과한 경우(컴포넌트 3~4개 + 호출이 단방향 사슬), 더 가벼운 시각화로 충분할 때. 라이프라인 음영, 다중 동시 메시지 같은 디테일이 불필요하면 이 패턴.

---

## 신규 React 컴포넌트 규약

### 경로 및 선언

- **경로**: `components/visualizations/<PascalCase>.tsx`
  - 예: `LockContention.tsx`, `CacheStampedeTimeline.tsx`, `ConsumerRebalance.tsx`
- **`'use client'`**: 인터랙티브([A-1]) 컴포넌트는 필수. 정적([A-2]) 컴포넌트는 불필요 (상태·이벤트 핸들러 없음).

### 구현 패턴

Phase 4.1부터 `components/visualizations/common/` 프레임워크를 사용한다. 아래 표준 패턴을 기반으로 새 컴포넌트를 작성한다 (상세 템플릿은 이 파일 하단 §Step-by-step 시각화 작성 템플릿 참고):

- `useStepController(totalSteps)` 훅으로 상태 관리
- `useMemo`로 전체 스냅샷 배열 사전 계산
- `<VisualContainer>` + `<StepController {...controller}>` 조합으로 UI 조립
- `vizStateClasses(state)` 헬퍼로 색상 시맨틱 적용 (CLAUDE.md §6.4):
  - `pivot` — 피벗/기준 요소 (amber)
  - `comparing` — 비교 중 요소 (blue)
  - `confirmed` — 확정/완료 요소 (emerald)
  - `blocked` — 차단/충돌 요소 (red)
  - `waiting` — 대기 중 요소 (gray)
  - `highlight` — 특별 강조 요소 (purple)

**참고**: Phase 4.1 이전에 작성된 파일에는 `// Phase 4 preview — will be refactored...` 주석이 있다. 이 파일들은 Phase 4.1 프레임워크로 이미 리팩토링 완료됐거나 대상이다.

### MDX 등록

컴포넌트 생성 후 `components/mdx/components.tsx`의 `mdxComponents` 객체에 자동 등록한다. 등록하지 않으면 MDX 파일에서 컴포넌트를 사용할 수 없다.

### 디자인 구조

컴포넌트 내부를 아래 4개 영역으로 구성한다:
1. **제목 + 1~2 문장 설명** (컴포넌트 상단)
2. **시각 영역** (배열, 타임라인, 노드 구조 등 핵심 시각화)
3. **스텝 설명 텍스트** (현재 단계가 무엇을 하고 있는지 — 하단) ([A-1]만 해당)
4. **컨트롤 버튼 + 범례(legend)** ([A-1]만 해당, [A-2]는 범례만)

**참고 파일**:
- [A-1]: `components/visualizations/QuickSort.tsx` — 실제 구현 예시. 새 컴포넌트 작성 전 반드시 읽는다.
- [A-2]: `components/visualizations/CardinalitySpectrum.tsx`, `CardinalityTradeoff.tsx`

---

## 중복 검사

신규 컴포넌트 생성 전에 `components/visualizations/` 디렉토리를 스캔한다.

- **정확 매치**: 동일한 파일이 이미 존재하면 재사용한다. 메시지: "이미 `LockContention.tsx`가 있습니다. 재사용합니다."
- **유사 매치**: 유사한 이름의 파일이 있으면 사용자에게 확인을 요청한다. 메시지: "비슷한 `DatabaseLock.tsx`가 있습니다. 이걸로 충분한가요? 아니면 별도 컴포넌트를 만들까요?"
- **매치 없음**: 신규 생성을 진행한다.

중복 검사를 생략하면 거의 동일한 컴포넌트가 여러 개 생길 수 있다. 반드시 스캔 후 생성을 결정한다.

---

## Phase 4.1 프레임워크 현황

Phase 4.1(2026-04-15 완료)에서 Step-by-step 시각화 공통 프레임워크가 구현되었다. 신규 Step-by-step 시각화는 반드시 아래 프레임워크를 사용한다.

**사용 가능한 공통 컴포넌트** (`components/visualizations/common/`):
- `useStepController` — 훅, 전체 상태 관리
- `VisualContainer` — 외곽 래퍼 (figure + figcaption)
- `StepController` — 컨트롤 행 (리셋/이전/재생/다음 + 진행 바 + 속도 슬라이더)
- `SpeedSlider` — 속도 조절 (5 세그먼트 배터리 게이지)
- `vizStateClasses(state)` — 색상 시맨틱 헬퍼

**중요**: 프레임워크가 이미 존재하므로, 시각화 구현을 미루는 이유가 없다. 지금 독자에게 가치 있는 시각화를 지금 만든다.

---

## Step-by-step 시각화 작성 템플릿 (Phase 4.1 프레임워크)

Phase 4.1부터 모든 Step-by-step 시각화는 `components/visualizations/common/` 프레임워크를 사용합니다. 새 시각화 작성 시 아래 템플릿을 복사해 시작합니다.

### 1. 알고리즘 로직 — 스냅샷 배열 사전 계산

```tsx
interface Snapshot {
  // 현재 시점의 시각적 상태 (배열, 인덱스, 포인터, 메모 등)
  note: string  // 이 단계의 한 줄 설명
}

function computeSnapshots(input: MyInput): Snapshot[] {
  const snapshots: Snapshot[] = []
  // 알고리즘 실행, 중요 시점마다 snapshots.push(...)
  return snapshots
}
```

### 2. 컴포넌트 — 프레임워크 조립

```tsx
'use client'

import { useMemo } from 'react'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'
import { cn } from '@/lib/utils'

interface MyVizProps {
  input: MyInput
  description?: string
}

export function MyViz({ input, description }: MyVizProps) {
  const snapshots = useMemo(() => computeSnapshots(input), [input])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="..." description={description}>
      {/* 현재 스냅샷 렌더.
         상태에 따라 vizStateClasses('pivot' | 'comparing' | 'confirmed' |
         'blocked' | 'waiting' | 'highlight')로 시맨틱 색상 적용 */}
      <div className={cn('...', vizStateClasses('confirmed'))}>
        ...
      </div>

      <StepController {...controller} stepDescription={current.note} />
    </VisualContainer>
  )
}
```

### 3. 색상 선택 가이드

- **pivot** (amber): 피벗/기준이 되는 요소
- **comparing** (blue): 현재 비교 중인 요소
- **confirmed** (emerald): 확정/완료된 요소
- **blocked** (red): 차단/충돌이 발생한 요소
- **waiting** (gray): 대기 중인 요소
- **highlight** (purple): 특별 강조가 필요한 요소

기존 6 상태로 표현 안 되는 의미는 **함부로 새 상태 만들지 말고**, 먼저 기존 상태 재사용을 시도합니다. 정말 의미가 다를 때만 CLAUDE.md §16 및 스펙 §6.6의 절차(4곳 동시 편집)를 따라 추가합니다.

### 4. 반드시 동작해야 하는 것 ([A-1] 인터랙티브 전용)

- Prev/Next 버튼으로 단계 이동
- Play 버튼 클릭 시 자동 재생, 마지막 단계에서 정지
- 속도 슬라이더 (기본 속도 3 = 800ms/step)
- 진행 바 클릭 시 해당 단계로 점프
- `prefers-reduced-motion: reduce` 환경에서 auto-play 및 속도 슬라이더 자동 비활성화
- 라이트/다크 모드 모두에서 상태 색상 구분 가능

---

## 판단 체크리스트 (5가지 질문)

감지 휴리스틱 외에도 글 작성 중 아래 질문에 하나라도 "예"라면 해당 섹션은 시각화 후보로 등록한다:

| 질문 | 해당 예시 |
|---|---|
| 상태가 시간에 따라 변화하는가? | 퀵소트 분할 과정, GC 마킹/스위핑, Kafka 리밸런싱 |
| 여러 주체가 동시에 상호작용하는가? | DB Lock 경합, Thread 컨텍스트 스위칭, 2PC |
| 조건에 따라 결과가 달라지는가? | Transaction Isolation Level, Cache Hit/Miss |
| 공간적 구조가 핵심인가? | B-Tree 노드 분할, HashMap 버킷 충돌, Kafka 파티션 배치 |
| "만약 ~하면 어떻게 되는가?"라는 질문이 자연스러운가? | Deadlock 조건, 낙관적 락 충돌, Consumer 장애 시 리밸런싱 |

**시각화가 필요 없는 경우**: 단순 개념 정의, 설정 방법 나열, API 사용법, 코드 예제만으로 충분한 내용.
