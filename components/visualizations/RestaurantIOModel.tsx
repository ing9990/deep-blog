'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

type ScenarioKey =
  | 'sync-blocking'
  | 'sync-nonblocking'
  | 'async-blocking'
  | 'async-nonblocking'

interface Actor {
  state: VizState
  label: string
}

interface Frame {
  customer: Actor
  staff: Actor
  kitchen: Actor
  food: Actor
  note: string
}

interface Scenario {
  key: ScenarioKey
  axis: string
  title: string
  subtitle: string
  realWorld: string
  frames: Frame[]
}

const SCENARIOS: Scenario[] = [
  {
    key: 'sync-blocking',
    axis: 'Sync · Blocking',
    title: '카운터 앞에서 직접 기다리기',
    subtitle: '손님이 음식이 나올 때까지 카운터에 서서 멈춰 있는다',
    realWorld: '전통 Tomcat read(), JDBC, 옛날 HTTP 클라이언트',
    frames: [
      {
        customer: { state: 'comparing', label: '주문' },
        staff: { state: 'waiting', label: '대기' },
        kitchen: { state: 'waiting', label: '대기' },
        food: { state: 'waiting', label: '없음' },
        note: '손님이 카운터로 가서 주문한다.',
      },
      {
        customer: { state: 'blocked', label: '서서 대기' },
        staff: { state: 'comparing', label: '접수' },
        kitchen: { state: 'comparing', label: '요리 중' },
        food: { state: 'waiting', label: '없음' },
        note: '주문 접수. 손님은 그 자리에 멈춰 서서 기다린다 (다른 일은 못 한다).',
      },
      {
        customer: { state: 'blocked', label: '서서 대기' },
        staff: { state: 'waiting', label: '대기' },
        kitchen: { state: 'comparing', label: '요리 중' },
        food: { state: 'waiting', label: '없음' },
        note: '주방은 아직 요리 중. 손님은 카운터 앞에서 가만히 서 있다.',
      },
      {
        customer: { state: 'blocked', label: '서서 대기' },
        staff: { state: 'highlight', label: '전달' },
        kitchen: { state: 'highlight', label: '완성' },
        food: { state: 'highlight', label: '카운터' },
        note: '음식 완성. 직원이 카운터에서 손님에게 건넨다.',
      },
      {
        customer: { state: 'confirmed', label: '받음' },
        staff: { state: 'waiting', label: '대기' },
        kitchen: { state: 'waiting', label: '대기' },
        food: { state: 'confirmed', label: '손님' },
        note: '손님이 음식을 받고 자리로 돌아간다. 주문 → 수령까지 손님은 한 가지 일만 했다.',
      },
    ],
  },
  {
    key: 'sync-nonblocking',
    axis: 'Sync · Non-Blocking',
    title: '계속 와서 묻기',
    subtitle: '손님이 자리로 돌아가서 다른 일을 하지만, 결과는 자기가 가서 확인한다',
    realWorld: 'O_NONBLOCK + 폴링 (단독으로는 거의 안 쓰이는 패턴)',
    frames: [
      {
        customer: { state: 'comparing', label: '주문' },
        staff: { state: 'waiting', label: '대기' },
        kitchen: { state: 'waiting', label: '대기' },
        food: { state: 'waiting', label: '없음' },
        note: '손님이 주문하고 자리로 돌아간다.',
      },
      {
        customer: { state: 'highlight', label: '1회 묻기' },
        staff: { state: 'comparing', label: '아직' },
        kitchen: { state: 'comparing', label: '요리 중' },
        food: { state: 'waiting', label: '없음' },
        note: '1회차: 손님이 카운터로 와서 "다 됐어요?" → "아직요." 즉시 답을 받고 자리로 돌아간다.',
      },
      {
        customer: { state: 'highlight', label: '2회 묻기' },
        staff: { state: 'comparing', label: '아직' },
        kitchen: { state: 'comparing', label: '요리 중' },
        food: { state: 'waiting', label: '없음' },
        note: '2회차: 다시 와서 묻는다. 여전히 아직. 손님은 멈추지 않지만, 계속 왔다 갔다 해야 한다.',
      },
      {
        customer: { state: 'highlight', label: '3회 묻기' },
        staff: { state: 'highlight', label: '전달' },
        kitchen: { state: 'highlight', label: '완성' },
        food: { state: 'highlight', label: '카운터' },
        note: '3회차: 마침 음식이 나왔다. 손님이 직접 받아간다.',
      },
      {
        customer: { state: 'confirmed', label: '받음' },
        staff: { state: 'waiting', label: '대기' },
        kitchen: { state: 'waiting', label: '대기' },
        food: { state: 'confirmed', label: '손님' },
        note: '손님은 다른 일은 했지만 "다 됐냐고 묻는 일"에 시간을 계속 썼다.',
      },
    ],
  },
  {
    key: 'async-blocking',
    axis: 'Async · Blocking',
    title: '진동벨 한 명이 N명 챙기기',
    subtitle: '직원 한 명이 진동벨 N개를 들고 어느 게 울리는지만 본다',
    realWorld: 'I/O Multiplexing 계열 (Nginx, Node.js, Redis가 쓰는 select / epoll)',
    frames: [
      {
        customer: { state: 'comparing', label: '손님 N명 주문' },
        staff: { state: 'waiting', label: '벨 N개 보유' },
        kitchen: { state: 'comparing', label: 'N개 요리 중' },
        food: { state: 'waiting', label: '없음' },
        note: '손님 N명이 모두 진동벨을 받아 자리에 앉았다. 직원 한 명이 진동벨 N개를 들고 있다.',
      },
      {
        customer: { state: 'confirmed', label: '자리에서 자유' },
        staff: { state: 'blocked', label: '벨 감시' },
        kitchen: { state: 'comparing', label: '요리 중' },
        food: { state: 'waiting', label: '없음' },
        note: '직원은 어떤 진동벨이라도 울리길 기다린다 (이 부분이 blocking). 손님들은 자유롭게 다른 일을 한다.',
      },
      {
        customer: { state: 'confirmed', label: '자리에서 자유' },
        staff: { state: 'highlight', label: '벨 K 울림' },
        kitchen: { state: 'highlight', label: 'K 완성' },
        food: { state: 'comparing', label: '카운터' },
        note: '손님 K의 음식 완성 → 진동벨 K가 울린다. 직원이 어느 벨이 울렸는지 즉시 안다.',
      },
      {
        customer: { state: 'confirmed', label: '자리에서 자유' },
        staff: { state: 'highlight', label: 'K 음식 받음' },
        kitchen: { state: 'waiting', label: '대기' },
        food: { state: 'highlight', label: '직원 → K' },
        note: '직원이 주방에서 K의 음식을 받아 손님 K의 자리로 가져다준다 (이 전달 구간은 sync).',
      },
      {
        customer: { state: 'confirmed', label: 'K 받음, 나머지 대기' },
        staff: { state: 'waiting', label: '다시 벨 감시' },
        kitchen: { state: 'comparing', label: '나머지 요리 중' },
        food: { state: 'confirmed', label: '손님 K' },
        note: '직원은 다시 진동벨 감시로 돌아간다. 한 명이 N명을 동시에 챙기는 구조이다.',
      },
    ],
  },
  {
    key: 'async-nonblocking',
    axis: 'Async · Non-Blocking',
    title: '직원이 자리까지 알아서 배달',
    subtitle: '손님은 주문만 하고, 음식이 나오면 직원이 알아서 자리로 가져다준다',
    realWorld: '진짜 비동기 (Linux io_uring, Windows IOCP)',
    frames: [
      {
        customer: { state: 'comparing', label: '주문 후 자리' },
        staff: { state: 'highlight', label: '주방 큐 등록' },
        kitchen: { state: 'comparing', label: '요리 중' },
        food: { state: 'waiting', label: '없음' },
        note: '손님 주문. 직원은 주방에 "손님 X 자리로 배달" 메모만 남기고 즉시 다른 일을 한다.',
      },
      {
        customer: { state: 'confirmed', label: '자리에서 자유' },
        staff: { state: 'confirmed', label: '다른 일' },
        kitchen: { state: 'comparing', label: '요리 중' },
        food: { state: 'waiting', label: '없음' },
        note: '손님도 직원도 모두 자유. 주방만 요리하고 있다.',
      },
      {
        customer: { state: 'confirmed', label: '자리에서 자유' },
        staff: { state: 'confirmed', label: '다른 일' },
        kitchen: { state: 'highlight', label: '완성 → 배달' },
        food: { state: 'highlight', label: '주방 → 자리' },
        note: '음식 완성. 주방이 직접 손님 자리로 가져다 놓는다 (커널이 유저 버퍼로 직접 복사).',
      },
      {
        customer: { state: 'highlight', label: '자리에서 받음' },
        staff: { state: 'confirmed', label: '완료 알림 수령' },
        kitchen: { state: 'waiting', label: '대기' },
        food: { state: 'confirmed', label: '손님 자리' },
        note: '손님은 자리에서 음식을 받는다. 직원에겐 "X에게 배달 완료" 알림만 도착한다.',
      },
      {
        customer: { state: 'confirmed', label: '식사' },
        staff: { state: 'waiting', label: '대기' },
        kitchen: { state: 'waiting', label: '대기' },
        food: { state: 'confirmed', label: '손님' },
        note: '손님은 단 한 번도 카운터에 가지 않았고, 직원도 음식을 기다리지 않았다.',
      },
    ],
  },
]

export function RestaurantIOModel() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('sync-blocking')
  const scenario = useMemo(
    () =>
      SCENARIOS.find((s) => s.key === scenarioKey) ?? SCENARIOS[0],
    [scenarioKey],
  )
  const controller = useStepController(scenario.frames.length)
  const current = scenario.frames[controller.step]

  return (
    <VisualContainer
      title="음식점으로 보는 4가지 I/O 모델"
      description="손님(호출자) · 직원(서버 스레드) · 주방(커널) · 음식(데이터)이 각각 어떤 상태로 움직이는지 비교하세요"
    >
      <div className="mb-3 flex flex-wrap gap-1">
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setScenarioKey(s.key)
              controller.reset()
            }}
            className={cn(
              'rounded-[var(--radius-chip)] border px-3 py-1.5 text-[length:var(--text-meta)] font-medium transition-colors',
              scenarioKey === s.key
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-muted',
            )}
            aria-pressed={scenarioKey === s.key}
          >
            {s.axis}
          </button>
        ))}
      </div>

      <div className="mb-3 rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
        <p className="text-[length:var(--text-meta)] font-semibold text-foreground">
          {scenario.title}
        </p>
        <p className="mt-1 text-[length:var(--text-caption)] leading-relaxed text-muted-foreground">
          {scenario.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-card)] border border-border bg-muted/30 p-3 sm:grid-cols-4">
        <ActorCell role="손님" emoji="👤" actor={current.customer} />
        <ActorCell role="직원" emoji="🧑‍💼" actor={current.staff} />
        <ActorCell role="주방" emoji="👨‍🍳" actor={current.kitchen} />
        <ActorCell role="음식" emoji="🍱" actor={current.food} />
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 rounded-[var(--radius-card)] border border-border bg-background p-3">
        <p className="text-[length:var(--text-caption)] text-muted-foreground">
          <span className="font-semibold text-foreground">현실에서는</span>{' '}
          {scenario.realWorld}
        </p>
      </div>
    </VisualContainer>
  )
}

interface ActorCellProps {
  role: string
  emoji: string
  actor: Actor
}

function ActorCell({ role, emoji, actor }: ActorCellProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 rounded-[var(--radius-card)] border-2 p-3 transition-colors motion-reduce:transition-none',
        vizStateClasses(actor.state),
      )}
    >
      <span aria-hidden="true" className="text-2xl">
        {emoji}
      </span>
      <span className="text-[length:var(--text-caption)] font-semibold opacity-80">
        {role}
      </span>
      <span className="text-center text-[length:var(--text-meta)] font-medium">
        {actor.label}
      </span>
    </div>
  )
}
