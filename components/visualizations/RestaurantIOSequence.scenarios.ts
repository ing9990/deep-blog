import type { VizState } from './common/colors'

export type ScenarioKey =
  | 'sync-blocking'
  | 'sync-nonblocking'
  | 'async-blocking'
  | 'async-nonblocking'

export type ActorRole = 'customer-a' | 'customer-b' | 'customer-c' | 'staff' | 'kitchen'

export type ArrowKind = 'request' | 'response' | 'eagain' | 'bell' | 'free'

export interface Activity {
  fromStep: number
  toStep: number
  state: VizState
}

export interface Arrow {
  atStep: number
  from: ActorRole
  to: ActorRole
  kind: ArrowKind
  label: string
}

export interface Step {
  note: string
  activeCustomer: 'customer-a' | 'customer-b' | 'customer-c' | null
}

export interface Scenario {
  key: ScenarioKey
  axis: string
  title: string
  subtitle: string
  realWorld: string
  steps: Step[]
  activities: Record<ActorRole, Activity[]>
  arrows: Arrow[]
}

const EMPTY_ACTIVITIES: Record<ActorRole, Activity[]> = {
  'customer-a': [],
  'customer-b': [],
  'customer-c': [],
  staff: [],
  kitchen: [],
}

const SYNC_BLOCKING: Scenario = {
  key: 'sync-blocking',
  axis: 'Sync · Blocking',
  title: '카운터 앞에서 직접 기다리기',
  subtitle: '손님이 카운터로 가서 주문하고 음식이 나올 때까지 그 자리에서 멈춰 기다린다.',
  realWorld: '전통 Tomcat read(), JDBC, 옛날 HTTP 클라이언트',
  steps: [
    { note: '손님이 카운터로 가서 주문하려는 순간.', activeCustomer: 'customer-a' },
    { note: '주문이 카운터 도착. 손님은 그 자리에 멈춘다.', activeCustomer: 'customer-a' },
    { note: '주방이 요리를 시작. 손님은 여전히 멈춰 있다.', activeCustomer: 'customer-a' },
    { note: '음식 완성. 직원이 카운터에서 받는다.', activeCustomer: 'customer-a' },
    { note: '손님이 음식을 받고 자리로 돌아간다.', activeCustomer: 'customer-a' },
  ],
  activities: {
    ...EMPTY_ACTIVITIES,
    'customer-a': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 3, state: 'blocked' },
      { fromStep: 4, toStep: 4, state: 'confirmed' },
    ],
    staff: [
      { fromStep: 1, toStep: 2, state: 'comparing' },
      { fromStep: 3, toStep: 3, state: 'highlight' },
    ],
    kitchen: [
      { fromStep: 2, toStep: 2, state: 'pivot' },
      { fromStep: 3, toStep: 3, state: 'confirmed' },
    ],
  },
  arrows: [
    { atStep: 1, from: 'customer-a', to: 'staff', kind: 'request', label: '주문' },
    { atStep: 2, from: 'staff', to: 'kitchen', kind: 'request', label: '주문 전달' },
    { atStep: 3, from: 'kitchen', to: 'staff', kind: 'response', label: '음식' },
    { atStep: 4, from: 'staff', to: 'customer-a', kind: 'response', label: '음식' },
  ],
}

const SYNC_NONBLOCKING: Scenario = {
  key: 'sync-nonblocking',
  axis: 'Sync · Non-Blocking',
  title: '자꾸 와서 묻기',
  subtitle: '손님이 자리로 돌아가서 다른 일을 하지만, 결과는 자기가 가서 확인한다.',
  realWorld: 'O_NONBLOCK + 폴링 (단독으로는 거의 안 쓰이는 패턴)',
  steps: [
    { note: '손님 주문 직전.', activeCustomer: 'customer-a' },
    { note: '주문 후 손님은 자리로 (멈추지 않음).', activeCustomer: 'customer-a' },
    { note: '"다 됐어요?" "아직요." 즉시 답을 받고 자리로.', activeCustomer: 'customer-a' },
    { note: '다시 묻기, 여전히 아직.', activeCustomer: 'customer-a' },
    { note: '마침 음식이 완성, 받음.', activeCustomer: 'customer-a' },
    { note: '손님이 다른 일은 했지만 폴링에 시간을 계속 썼다.', activeCustomer: 'customer-a' },
  ],
  activities: {
    ...EMPTY_ACTIVITIES,
    'customer-a': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 4, state: 'highlight' },
      { fromStep: 5, toStep: 5, state: 'confirmed' },
    ],
    staff: [{ fromStep: 1, toStep: 4, state: 'comparing' }],
    kitchen: [
      { fromStep: 1, toStep: 3, state: 'pivot' },
      { fromStep: 4, toStep: 4, state: 'confirmed' },
    ],
  },
  arrows: [
    { atStep: 1, from: 'customer-a', to: 'staff', kind: 'request', label: '주문' },
    { atStep: 2, from: 'customer-a', to: 'staff', kind: 'request', label: '확인' },
    { atStep: 2, from: 'staff', to: 'customer-a', kind: 'eagain', label: '아직' },
    { atStep: 3, from: 'customer-a', to: 'staff', kind: 'request', label: '확인' },
    { atStep: 3, from: 'staff', to: 'customer-a', kind: 'eagain', label: '아직' },
    { atStep: 4, from: 'customer-a', to: 'staff', kind: 'request', label: '확인' },
    { atStep: 4, from: 'staff', to: 'customer-a', kind: 'response', label: '음식' },
  ],
}

const ASYNC_BLOCKING: Scenario = {
  key: 'async-blocking',
  axis: 'Async · Blocking',
  title: '진동벨 한 명이 N명 챙기기',
  subtitle: '직원 한 명이 진동벨 N개를 들고 어느 게 울리는지만 본다.',
  realWorld: 'I/O Multiplexing 계열 (Nginx, Node.js, Redis가 쓰는 select / epoll)',
  steps: [
    { note: '손님 3명 모두 주문 직전. 모두 활성.', activeCustomer: null },
    { note: '3명 모두 진동벨 받고 자리로. 직원 한 명이 벨 N개 감시.', activeCustomer: null },
    { note: 'B의 벨 울림 → 시청자 시선이 B로. A·C 흐려짐.', activeCustomer: 'customer-b' },
    { note: '직원이 B에게 음식 전달 → 다시 벨 감시.', activeCustomer: 'customer-b' },
    { note: '다음으로 A의 벨이 울림. 시선이 A로.', activeCustomer: 'customer-a' },
    { note: 'A 음식 받음.', activeCustomer: 'customer-a' },
    { note: '마지막 C의 벨, 시선 C로.', activeCustomer: 'customer-c' },
    { note: '3명 모두 음식 받음. 직원 1명이 N=3 처리. C10K 해결 원리.', activeCustomer: 'customer-c' },
  ],
  activities: {
    'customer-a': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 4, state: 'confirmed' },
      { fromStep: 5, toStep: 7, state: 'confirmed' },
    ],
    'customer-b': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 2, state: 'confirmed' },
      { fromStep: 3, toStep: 7, state: 'confirmed' },
    ],
    'customer-c': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 6, state: 'confirmed' },
      { fromStep: 7, toStep: 7, state: 'confirmed' },
    ],
    staff: [
      { fromStep: 1, toStep: 1, state: 'blocked' },
      { fromStep: 2, toStep: 2, state: 'highlight' },
      { fromStep: 3, toStep: 3, state: 'waiting' },
      { fromStep: 4, toStep: 4, state: 'highlight' },
      { fromStep: 5, toStep: 5, state: 'waiting' },
      { fromStep: 6, toStep: 6, state: 'highlight' },
    ],
    kitchen: [
      { fromStep: 1, toStep: 1, state: 'pivot' },
      { fromStep: 2, toStep: 2, state: 'confirmed' },
      { fromStep: 3, toStep: 3, state: 'pivot' },
      { fromStep: 4, toStep: 4, state: 'confirmed' },
      { fromStep: 5, toStep: 5, state: 'pivot' },
      { fromStep: 6, toStep: 6, state: 'confirmed' },
    ],
  },
  arrows: [
    { atStep: 1, from: 'customer-a', to: 'staff', kind: 'request', label: 'A 주문' },
    { atStep: 1, from: 'customer-b', to: 'staff', kind: 'request', label: 'B 주문' },
    { atStep: 1, from: 'customer-c', to: 'staff', kind: 'request', label: 'C 주문' },
    { atStep: 2, from: 'kitchen', to: 'staff', kind: 'bell', label: '벨 B' },
    { atStep: 3, from: 'staff', to: 'customer-b', kind: 'response', label: '음식 → B' },
    { atStep: 4, from: 'kitchen', to: 'staff', kind: 'bell', label: '벨 A' },
    { atStep: 5, from: 'staff', to: 'customer-a', kind: 'response', label: '음식 → A' },
    { atStep: 6, from: 'kitchen', to: 'staff', kind: 'bell', label: '벨 C' },
    { atStep: 7, from: 'staff', to: 'customer-c', kind: 'response', label: '음식 → C' },
  ],
}

const ASYNC_NONBLOCKING: Scenario = {
  key: 'async-nonblocking',
  axis: 'Async · Non-Blocking',
  title: '직원이 자리까지 자동 배달',
  subtitle: '손님은 주문만 하고, 음식이 나오면 주방이 알아서 자리로 가져다준다.',
  realWorld: '진짜 비동기 (Linux io_uring, Windows IOCP)',
  steps: [
    { note: '주문 직전.', activeCustomer: 'customer-a' },
    { note: '주문은 주방 큐로 직접 등록. 직원도 다른 일.', activeCustomer: 'customer-a' },
    { note: '손님도 직원도 모두 자유. 주방만 일한다.', activeCustomer: 'customer-a' },
    { note: '음식 완성 → 주방이 직접 손님 자리로 (커널이 유저 버퍼로 직접 복사).', activeCustomer: 'customer-a' },
    { note: '손님 0초 멈춤. 직원 0초 대기.', activeCustomer: 'customer-a' },
  ],
  activities: {
    ...EMPTY_ACTIVITIES,
    'customer-a': [
      { fromStep: 0, toStep: 0, state: 'comparing' },
      { fromStep: 1, toStep: 2, state: 'confirmed' },
      { fromStep: 3, toStep: 3, state: 'highlight' },
      { fromStep: 4, toStep: 4, state: 'confirmed' },
    ],
    staff: [{ fromStep: 1, toStep: 3, state: 'confirmed' }],
    kitchen: [
      { fromStep: 1, toStep: 2, state: 'pivot' },
      { fromStep: 3, toStep: 3, state: 'highlight' },
    ],
  },
  arrows: [
    { atStep: 1, from: 'customer-a', to: 'kitchen', kind: 'request', label: '주문 → 큐' },
    { atStep: 3, from: 'kitchen', to: 'customer-a', kind: 'response', label: '음식 (직접 배달)' },
    { atStep: 3, from: 'kitchen', to: 'staff', kind: 'bell', label: '완료 알림' },
  ],
}

export const SCENARIOS: Scenario[] = [
  SYNC_BLOCKING,
  SYNC_NONBLOCKING,
  ASYNC_BLOCKING,
  ASYNC_NONBLOCKING,
]

export function getActivitiesActiveAt(
  activities: Activity[],
  step: number,
): Activity[] {
  return activities.filter((a) => step >= a.fromStep && step <= a.toStep)
}

export function getArrowsAt(arrows: Arrow[], step: number): Arrow[] {
  return arrows.filter((a) => a.atStep === step)
}
