# RestaurantIOSequence — 시퀀스 다이어그램 시각화 디자인 명세

**작성일**: 2026-04-19
**대상 컴포넌트**: `components/visualizations/RestaurantIOSequence.tsx` (신규)
**대체 대상**: `components/visualizations/RestaurantIOModel.tsx` (현행, 액터 상태 그리드)
**관련 포스트**: `content/posts/sync-async-blocking-nonblocking.mdx`
**관련 CLAUDE.md 섹션**: §6 인터랙티브 시각화 시스템

---

## 1. 배경

`sync-async-blocking-nonblocking.mdx` 포스트의 핵심 시각화로 현재 `RestaurantIOModel`이 들어가 있다. 현행 컴포넌트는 4개 액터(손님 / 직원 / 주방 / 음식)의 상태를 한 줄로 카드 4개에 표시하고 step controller로 프레임을 넘기는 구조이다. 사용자 피드백으로 두 가지 한계가 드러났다.

1. **요청 → 응답 과정이 보이지 않는다.** 액터의 "현재 상태"만 칸별로 표시하므로, 메시지가 어디로 가서 어디로 돌아오는지의 흐름이 시각으로 드러나지 않는다.
2. **시간 축 상의 동시작업이 보이지 않는다.** sync vs async, blocking vs non-blocking의 본질적 차이는 "같은 시간 동안 호출자가 다른 일을 할 수 있는가"인데, 4칸 그리드에는 이 시간 비교가 담기지 않는다.

새 컴포넌트는 시퀀스 다이어그램 (UML sequence) 형식 + 라이프라인 음영 + 메시지 화살표 + 다중 손님 라이프라인을 통해 두 한계를 해결한다.

---

## 2. 목표

1. **요청·응답 메시지 흐름 직접 표현**: 손님 → 카운터 → 주방 → 카운터 → 손님 메시지가 가로 화살표로 보임
2. **시간 = 세로 축**: 위에서 아래로 시간 진행. 손님 라이프라인의 빨간 음영 = "멈춘 시간", 빈 라이프라인 = "다른 일 가능"
3. **multiplexing의 본질을 애니메이션으로 표현**: "한 직원이 N명을 차례로 챙긴다"가 손님 활성/비활성 전환 애니메이션으로 자연스럽게 보임
4. **블로그 디자인 톤 일치**: `VisualContainer`, `useStepController`, `vizStateClasses`, Lucide 아이콘 패턴 그대로 사용
5. **4시나리오 일관 레이아웃**: 손님 3행 + 직원 + 주방 = 5라이프라인. 시나리오마다 폭이 달라지지 않음

---

## 3. 비목표 (Out of Scope)

- IOModelMatrix, IOModelTimeline 변경 없음 (기존대로 유지, 포스트 후반부 OS 상세 섹션에 그대로 존재)
- 5종 시스템 콜(select/poll/epoll/kqueue/io_uring) 차이 표현 없음 — 그건 IOModelTimeline의 역할
- 새 VizState 추가 없음 — 기존 6 상태(pivot/comparing/confirmed/blocked/waiting/highlight)로 표현 가능
- Compare mode (4시나리오 동시 비교) 없음. 탭 전환만 (IOModelTimeline 패턴과 동일)

---

## 4. 시각 구조

### 4.1 라이프라인 5개 (좌→우)

```
┌────────┬────────┬────────┬────────┬────────┐
│ 손님 A │ 손님 B │ 손님 C │ 직원   │ 주방   │
│ User   │ User   │ User   │ Clip…  │ ChefHat│
│ (호출자) (호출자) (호출자) (스레드) (커널) │
│   │       │       │       │       │      │
│   │       │       │       │       │      │ ← 점선 라이프라인
│   │       │       │       │       │      │
│   ▼       ▼       ▼       ▼       ▼      │
│  시간 →                                    │
└────────────────────────────────────────────┘
```

각 라이프라인 상단에 아바타 원(borderColor·bgColor가 vizStateClasses 의 `comparing`/`waiting`/`highlight` 등에 매핑)과 한글 라벨 + 영문 부제 (호출자 / 서버 스레드 / 커널).

### 4.2 라이프라인 위 활성 박스

각 라이프라인 위에 단계별로 다음 박스가 표시된다.

- **손님 라인**: BLOCKED 구간 = `vizStateClasses('blocked')` (빨간 톤). FREE 구간 = 박스 없음 (비어 있음 자체가 "자유" 신호).
- **직원 라인**: 처리 중 = `vizStateClasses('comparing')` (회색/중립). 벨 감시 중 = `vizStateClasses('blocked')`. 손님에게 음식 전달 중 = `vizStateClasses('highlight')`.
- **주방 라인**: 요리 중 = `vizStateClasses('pivot')` (주황 톤). 완성 = `vizStateClasses('confirmed')` (초록).

### 4.3 메시지 화살표

라이프라인 사이를 가로지르는 화살표. SVG `<line>` + `<marker>`로 화살촉.

| 화살표 종류 | 색상 토큰 | 라벨 (텍스트만, 이모지 금지) |
|---|---|---|
| 요청 (주문) | `text-primary` 톤 | "주문" |
| 응답 (음식) | `text-viz-confirmed` 톤 | "음식" |
| EAGAIN (실패 폴링) | `text-viz-waiting` 톤 점선 | "아직" |
| 벨 알림 | `text-viz-highlight` 톤 | "벨 K" |
| 자유 시간 (손님이 다른 일) | (회색 텍스트 라벨만) | "자유 시간" |

### 4.4 시간 축

가장 왼쪽에 세로 축 (`<line>` + 화살촉). 라벨 "시간".

### 4.5 손님 dim 처리

비활성 손님 라이프라인은 `opacity-30` 적용. 라이프라인 점선과 아바타 원 모두 dim. 활성 시 `opacity-100`로 부드럽게 transition (`transition-opacity duration-300 motion-reduce:transition-none`).

---

## 5. 4시나리오 정의

각 시나리오는 step 배열을 가진다. step의 각 요소는 라이프라인별 상태 + 활성 손님 ID + 화살표 종류 + 노트.

### 5.1 Sync + Blocking — "카운터 앞에서 직접 기다리기"

활성 손님: A 고정. B, C는 dim.

| Step | 손님A | 직원 | 주방 | 화살표 | 노트 |
|---|---|---|---|---|---|
| 0 | comparing | waiting | waiting | (없음) | 손님이 카운터로 가서 주문하려는 순간 |
| 1 | blocked (멈춤 시작) | comparing | waiting | A→직원 (요청) | 주문이 카운터 도착. 손님은 그 자리에 멈춘다 |
| 2 | blocked | comparing | pivot (요리 중) | 직원→주방 (요청 전달) | 주방이 요리 시작. 손님은 여전히 멈춰있다 |
| 3 | blocked | highlight (전달) | confirmed (완성) | 주방→직원 (음식) | 음식 완성. 직원이 카운터에서 받음 |
| 4 | confirmed (받음) | waiting | waiting | 직원→A (음식) | 손님이 음식을 받고 자리로 돌아간다 |

### 5.2 Sync + Non-Blocking — "자꾸 와서 묻기"

활성 손님: A 고정. B, C는 dim.

| Step | 손님A | 직원 | 주방 | 화살표 | 노트 |
|---|---|---|---|---|---|
| 0 | comparing | waiting | waiting | (없음) | 손님 주문 직전 |
| 1 | confirmed (자리로) | comparing | pivot (요리 중) | A→직원 (요청), A→자리 | 주문 후 손님은 자리로 (멈추지 않음) |
| 2 | highlight (1회 묻기) | comparing | pivot | A→직원 (확인), 직원→A "아직" 점선 | "다 됐어요?" "아직요" — 즉시 리턴 |
| 3 | highlight (2회 묻기) | comparing | pivot | A→직원 (확인), 직원→A "아직" 점선 | 다시 묻기, 여전히 아직 |
| 4 | highlight (3회 묻기) | highlight (전달) | confirmed (완성) | A→직원 (확인), 직원→A (음식) | 마침 완성됨, 음식 받음 |
| 5 | confirmed (받음) | waiting | waiting | (없음) | 자유시간 + 폴링 시간 트레이드오프 강조 |

### 5.3 Async + Blocking — "진동벨 한 명이 N명 챙기기"

활성 손님: A → B → C 차례로 전환. **이 시나리오만 multiplexing의 본질.**

> **읽기 가이드**: "dim"은 상태(state)가 아니라 visibility(focus). 해당 step에서 `activeCustomer ≠ 이 손님`이므로 라이프라인 opacity가 0.3으로 내려간 상태이다. 손님의 실제 라이프라인 상태(activity 박스)는 그 직전에 설정된 값을 유지한다 (예: step 1에서 confirmed로 설정된 후 step 2에서 dim 처리되어도 confirmed 박스는 그대로 그려짐, 다만 흐릿하게).

| Step | 손님A (state·focus) | 손님B (state·focus) | 손님C (state·focus) | 직원 | 주방 | 화살표 | 노트 |
|---|---|---|---|---|---|---|---|
| 0 | comparing · A=focus | comparing · A=focus | comparing · A=focus | waiting | waiting | (없음) | 손님 3명 모두 주문 직전. 모두 활성 (강조 X) |
| 1 | confirmed · A=focus | confirmed · A=focus | confirmed · A=focus | blocked (벨 감시) | pivot (3개 요리) | A→직원, B→직원, C→직원 (모두 등록) | 3명 모두 진동벨 받고 자리로. 직원 한 명이 벨 N개 감시 |
| 2 | confirmed · dim | confirmed · B=focus | confirmed · dim | highlight (B 처리) | confirmed (B 완성) | 주방→직원 "벨 B" | B의 벨 울림 → 시청자 시선이 B로. A·C 라이프라인 흐려짐 |
| 3 | confirmed · dim | confirmed · B=focus | confirmed · dim | waiting (다시 감시) | pivot (A,C 요리) | 직원→B (음식) | 직원이 B에게 음식 전달 → 다시 벨 감시 |
| 4 | confirmed · A=focus | confirmed · dim | confirmed · dim | highlight (A 처리) | confirmed (A 완성) | 주방→직원 "벨 A" | 다음으로 A의 벨이 울림. 시선이 A로 점프 |
| 5 | confirmed · A=focus | confirmed · dim | confirmed · dim | waiting | pivot (C 요리) | 직원→A (음식) | A 음식 받음 |
| 6 | confirmed · dim | confirmed · dim | confirmed · C=focus | highlight (C 처리) | confirmed (C 완성) | 주방→직원 "벨 C" | 마지막 C의 벨, 시선 C로 |
| 7 | confirmed · dim | confirmed · dim | confirmed · C=focus | waiting | waiting | 직원→C (음식) | 3명 모두 음식 받음. 직원 1명이 N=3 처리. 이게 C10K 해결 원리 |

**애니메이션 핵심**: step 2~7에서 활성 손님 라인이 A → B → C로 highlight되며 다른 손님은 dim. 시청자가 "한 직원이 여러 명을 차례로 챙긴다"를 시간 진행으로 직접 본다.

### 5.4 Async + Non-Blocking — "직원이 자리까지 자동 배달"

활성 손님: A 고정. B, C는 dim.

| Step | 손님A | 직원 | 주방 | 화살표 | 노트 |
|---|---|---|---|---|---|
| 0 | comparing | waiting | waiting | (없음) | 주문 직전 |
| 1 | confirmed (자리로) | confirmed (다른 일) | pivot (요리) | A→주방 (큐 등록), 직원→자유 | 주문은 주방 큐로 직접 등록. 직원도 다른 일 |
| 2 | confirmed (자유 시간) | confirmed (다른 일) | pivot (요리) | (라이프라인 비어 있음 — 자유시간 강조) | 손님도 직원도 모두 자유. 주방만 일함 |
| 3 | highlight (자리에서 받음) | confirmed (알림 수령) | highlight (직접 배달) | 주방→A (음식 직접), 주방→직원 (완료 알림) | 음식 완성 → 주방이 직접 손님 자리로 (커널이 유저 버퍼로 직접 복사) |
| 4 | confirmed (식사) | waiting | waiting | (없음) | 손님 0초 멈춤. 직원 0초 대기 |

---

## 6. API 및 데이터 모델

### 6.1 컴포넌트 시그니처

```ts
'use client'

interface RestaurantIOSequenceProps {
  // 기본 시나리오 (탭 초기값). 생략 시 'sync-blocking'.
  initial?: ScenarioKey
}

type ScenarioKey =
  | 'sync-blocking'
  | 'sync-nonblocking'
  | 'async-blocking'
  | 'async-nonblocking'

export function RestaurantIOSequence(props: RestaurantIOSequenceProps): JSX.Element
```

### 6.2 내부 데이터 모델

```ts
type ActorRole = 'customer-a' | 'customer-b' | 'customer-c' | 'staff' | 'kitchen'
type ArrowKind = 'request' | 'response' | 'eagain' | 'bell' | 'free'

interface Activity {
  // 라이프라인 위에 그려지는 박스의 시작/끝 (step index 단위)
  fromStep: number
  toStep: number
  state: VizState
}

interface Arrow {
  atStep: number
  from: ActorRole
  to: ActorRole
  kind: ArrowKind
  label: string  // "주문", "음식", "아직", "벨 B" 등 — 이모지 금지
}

interface Step {
  note: string
  // 활성 손님 (multiplexing 시나리오에서 step별로 변경됨)
  // 단일 손님 시나리오는 항상 'customer-a'
  activeCustomer: 'customer-a' | 'customer-b' | 'customer-c'
}

interface Scenario {
  key: ScenarioKey
  axis: string         // "Sync · Blocking" 등 (탭 라벨)
  title: string        // "카운터 앞에서 직접 기다리기" (서브타이틀 첫 줄)
  subtitle: string     // 한 줄 설명
  realWorld: string    // "전통 Tomcat read(), JDBC, 옛날 HTTP 클라이언트"
  steps: Step[]
  activities: Record<ActorRole, Activity[]>
  arrows: Arrow[]
}
```

`activities`와 `arrows`는 **선언적**이다 — 컴포넌트는 현재 step index를 보고 "내가 그려야 할 박스/화살표는 어떤 것인가"를 필터링해서 그린다. step 단위 frame 배열을 모두 풀어쓰는 대신 사실 자료 1세트만 두고 step에서 visibility만 결정.

### 6.3 시각 요소 매핑

- **라이프라인**: 각 actor마다 세로 점선 (`<line>` SVG, `stroke-dasharray="3,3"`)
- **활성 박스**: `<rect>` 위에 actor 컬럼 좌표 + step→y 좌표 매핑. 단계 진행에 따라 자라남 (height 보간). `transition: height 0.3s` 적용
- **화살표**: `<line>` + `<marker>`. atStep === currentStep이면 `opacity-100` + 새로 그려진 듯한 강조 (스트로크 두께 +0.5px), 과거 step의 화살표는 `opacity-50`로 dim
- **시간 축**: 왼쪽 세로 화살표 (정적)
- **손님 dim**: `<g opacity={isActive ? 1 : 0.3}>` 그룹으로 라이프라인+아바타+박스 묶음

---

## 7. 인터랙션 모델

### 7.1 탭 전환

상단에 4개 시나리오 탭. `useState<ScenarioKey>` + 전환 시 `controller.reset()`. 기존 `IOModelTimeline` 패턴과 동일.

### 7.2 Step controller

기존 `useStepController` + `<StepController>` 그대로 사용. play/pause/prev/next/reset/speed slider/progress bar 모두 자동.

### 7.3 애니메이션

- **Step 전환 시**: 활성 박스 height 보간 (300ms ease)
- **활성 손님 전환 시**: dim 손님은 `opacity 1 → 0.3`, 활성 손님은 `opacity 0.3 → 1` (300ms ease)
- **새 화살표 등장 시**: stroke-dasharray 애니메이션 (왼→오 그리는 효과) — 단순 fade-in으로 fallback 가능
- **`prefers-reduced-motion: reduce`**: 모든 transition `motion-reduce:transition-none`. `useStepController`가 자동 pause.

### 7.4 키보드 / a11y

- 탭 버튼 `aria-pressed` 속성
- step 컨트롤 버튼 `aria-label` 한글
- SVG 전체에 `role="img"` + `<title>`/`<desc>`로 현재 step 노트 제공
- 색상만으로 정보 구분 금지: 라이프라인 박스에 텍스트 라벨 추가 (예: 손님 BLOCKED 박스에 "멈춤" 텍스트)

---

## 8. 파일 구조

```
components/visualizations/
  RestaurantIOSequence.tsx       (신규, 약 350~450줄 예상)
  RestaurantIOModel.tsx          (제거)
components/mdx/components.tsx    (mdxComponents에서 RestaurantIOModel 제거 + RestaurantIOSequence 등록)
content/posts/sync-async-blocking-nonblocking.mdx  (<RestaurantIOModel /> → <RestaurantIOSequence /> 한 줄 교체)
```

`common/`에 신규 추출 파일 없음. 기존 `VisualContainer`, `useStepController`, `StepController`, `vizStateClasses` 그대로 사용.

---

## 9. 결정 사항 요약

1. **시퀀스 다이어그램** 메타포 채택 — 요청·응답 메시지 흐름 + 시간 축 동시 표현
2. **5라이프라인 일관 레이아웃** — 4시나리오 모두 동일 폭. 단일 손님 시나리오는 손님 B/C dim 처리
3. **multiplexing은 애니메이션으로 N명 표현** — step 진행에 따라 활성 손님이 A → B → C로 전환
4. **이모지 사용 금지** — 메시지 라벨도 한글 텍스트만, 아바타는 Lucide 아이콘 (User / ClipboardList / ChefHat / Bell)
5. **블로그 디자인 시스템 준수** — `VisualContainer`, `useStepController`, `vizStateClasses` 그대로
6. **기존 RestaurantIOModel 제거** — 새 컴포넌트가 완전 대체

---

## 10. 설계 근거: 시각 메타포 선택 + 애니메이션 사용 원칙

이 컴포넌트의 설계 결정은 일반화 가능한 두 가지 원칙에서 도출되었으며, blog-writer 스킬의 `references/visualization-rules.md` 에도 동기화되었다.

### 10.1 시각 메타포 선택 — "개념 타입 → 메타포" 매핑

신규 시각화를 만들 때 [A-1] / [A-2] 결정 다음 단계는 "어떤 시각 구조(메타포)로 그릴 것인가"이다. 같은 [A-1] 안에서도 시퀀스 다이어그램, 상태 전이도, 타임라인, 위치 이동 그림은 전혀 다른 정보를 효과적으로 전달한다.

| 개념 타입 | 추천 메타포 | 참고 컴포넌트 |
|---|---|---|
| 순차 알고리즘 (배열/노드 단계 변화) | 셀/노드 그리드 + step별 색상 | `QuickSort`, `BTreeInsert`, `TrieBuilder` |
| 공간적 객체 이동 (영역 사이 entity 이동) | 영역 박스 + entity 이동 애니메이션 | `GCCycle` (Eden→Survivor→Old) |
| 요청 ↔ 응답 메시지 흐름 | 시퀀스 다이어그램 (라이프라인 + 가로 화살표) | `RestaurantIOSequence` (이 스펙) |
| 컴포넌트 간 단방향 호출 사슬 | 2~4 column 박스 + 단계별 화살표 인디케이터 | `IdempotencyKeyFlow` |
| 시간축 동시성 / 경합 | 행=주체, 열=시점, 셀=상태 | `CacheStampedeDefenseTimeline` |
| 인과 사슬 / 논리 단계 | 세로 박스 + step별 강조 | `IdempotencyCausalityChain` |
| 2x2 또는 NxM 비교 | 매트릭스 셀 (A-2) | `IOModelMatrix`, `CardinalityTradeoff` |
| 스펙트럼 / 그래디언트 | 선형 축 + 항목 배치 (A-2) | `CardinalitySpectrum` |

**이 컴포넌트의 메타포 선택 근거**: I/O 모델은 "요청 → 응답 메시지가 호출자/커널 사이를 어떻게 오가는가"가 핵심이다. **현행 RestaurantIOModel(액터 상태 그리드)이 실패한 이유는 메시지 흐름이 보이지 않기 때문이다.** 시퀀스 다이어그램이 정확한 메타포다.

### 10.2 메타포 선택 안티패턴

다음 4가지는 자주 실수하는 잘못된 메타포 선택이다.

- **액터 상태 그리드** (각 actor의 "현재 상태"만 칸별로): "프로세스/메시지 흐름"이 핵심인 개념에는 부적합. → 시퀀스 다이어그램 또는 3-column flow로 교체
- **정적 매트릭스 단독**: 시간 진행이 핵심인 개념에는 부적합 (4상한 매트릭스가 "왜 그렇게 되는가"의 메커니즘 못 보여줌). 매트릭스는 요약용 [A-2]로 쓰고, 메커니즘은 별도 [A-1]로 분리
- **단순 막대 차트**: "왜 그런가"의 메커니즘이 안 보임. 결과 비교일 때만 사용
- **숫자 라벨만으로 정보 전달**: 색상/위치/모양 같은 시각 채널을 활용 안 하면 "그림"이 아니라 "표"

### 10.3 애니메이션 사용 원칙

**언제 애니메이션이 가치 있는가?** 다음 4가지 시나리오에서 정적 그림보다 가치를 더한다:

1. **상태 변화의 인과 관계**: "지금 마킹된 객체 → 그래서 다음 단계에서 sweep됨" (GC mark → sweep)
2. **공간적 이동**: "Eden에 있던 객체가 Survivor로 옮겨짐" (entity의 물리적 위치 변화)
3. **포커스 시프트로 N:1 관계 표현**: "한 서버가 N개 클라이언트를 차례로 처리" (multiplexing) — **이 스펙의 §5.3 multiplexing 시나리오가 이 패턴**
4. **경쟁 조건 / 타이밍**: "5개 요청이 같은 순간 도착해 stampede 발생" (시간 간격이 결과를 결정)

**언제 애니메이션이 불필요한가?**

- 비교 / 트레이드오프 (정적 [A-2]가 적합)
- 분류 / 스펙트럼 (정적 [A-2]가 적합)
- 한 장의 상태 사진으로 충분한 개념 (시스템 구조도, 클래스 다이어그램)

**애니메이션 디자인 원칙 (이 컴포넌트도 모두 준수)**:

1. **Step controller 우선** (continuous play보다): 독자가 자기 페이스로 학습. 자동 재생은 옵션, 수동 step이 기본
2. **Step description 필수**: "지금 이 단계에서 무슨 일이 일어났는가" 한 줄. 시각만으로는 의도 전달 불충분
3. **상태 transition은 300ms 내외**: 너무 빠르면 따라가기 어렵고, 너무 느리면 답답
4. **Focus shift로 N개 entity 표현**: 한 화면에 모든 entity 띄우되, 활성만 강조(opacity 1), 비활성은 dim(opacity 0.3) — **이 스펙의 §4.5 손님 dim 처리가 정확히 이 패턴**
5. **`prefers-reduced-motion: reduce` 자동 처리**: `useStepController`가 자동 비활성화

### 10.4 좋은 사례 참조

이 컴포넌트는 다음 두 사례의 패턴을 직접 차용한다.

**GCCycle — 공간 이동 + 알고리즘 단계 (참조: 객체가 영역 사이 이동)**

- 객체 A·B·C가 Eden → Survivor 0 → Survivor 1 → Old generation으로 단계별 이동
- 정적 그림으로는 "이동"이 안 보이지만 애니메이션이 자연스럽게 표현
- 색상(`alive`/`garbage`/`moving`/`promoting`) + 위치(어느 영역에 있는가)로 복잡한 상태 변화를 한꺼번에 표현
- → 이 컴포넌트의 음식 화살표가 라이프라인 사이를 가로지르는 패턴이 이 사례의 변형

**IdempotencyKeyFlow — 컴포넌트 3개 단방향 흐름 (참조: 더 가벼운 대안)**

- 컴포넌트 3개(Client, Keys Table, Business DB) 사이 호출 흐름을 step별로 단일 화살표 인디케이터로 표현
- → 이 컴포넌트는 라이프라인 5개 + 동시 다발 메시지가 필요해 시퀀스 다이어그램으로 갔지만, 만약 시나리오가 더 단순했다면 IdempotencyKeyFlow 패턴이 더 적합했을 것

### 10.5 향후 적용 가능 개념

이 컴포넌트의 시퀀스 다이어그램 + 포커스 시프트 패턴은 다음 개념에 그대로 적용 가능:

- 분산 합의 알고리즘 (Paxos, Raft) — 노드 간 메시지 흐름
- Two-Phase Commit — Coordinator ↔ N Participants
- Pub/Sub Broker — Producer N → Broker → Consumer N
- Load Balancer — Client N → LB → Server N
- WebSocket / SSE — 단방향/양방향 메시지 비교

---

## 11. 검증 기준

- [ ] `pnpm type-check` 통과
- [ ] `pnpm lint` 통과 (Stylelint 토큰 강제 + ESLint className 토큰 강제 위반 없음 — `text-[Npx]`, `rounded-[Npx]`, hex color 인라인 금지)
- [ ] `pnpm build` 통과
- [ ] dev 서버에서 4탭 모두 step 진행 시 시각 회귀 없음 (라이트/다크 모두)
- [ ] 모바일 375px 폭에서 SVG가 가로 overflow 없이 렌더 (responsive viewBox)
- [ ] 키워드 맵에 영향 없음 (frontmatter 미변경)
- [ ] `prefers-reduced-motion: reduce` 환경에서 transition 없이 step-only 동작
