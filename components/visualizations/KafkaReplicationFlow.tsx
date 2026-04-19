'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface ReplicationFlowProps {
  description?: string
}

type Role = 'leader' | 'follower-1' | 'follower-2'

interface BrokerState {
  log: (string | null)[]
  leo: number
}

interface Snapshot {
  leader: BrokerState
  follower1: BrokerState
  follower2: BrokerState
  hw: number
  activeRole: Role | 'producer' | 'consumer' | null
  producerMessage: string | null
  consumerVisibleUpTo: number
  note: string
}

const TOTAL_SLOTS = 4

function emptyBroker(): BrokerState {
  return { log: Array(TOTAL_SLOTS).fill(null), leo: 0 }
}

function withAppend(b: BrokerState, ...msgs: string[]): BrokerState {
  const log = b.log.slice()
  let leo = b.leo
  for (const m of msgs) {
    if (leo < TOTAL_SLOTS) {
      log[leo] = m
      leo++
    }
  }
  return { log, leo }
}

function buildSnapshots(): Snapshot[] {
  const s: Snapshot[] = []

  let leader = emptyBroker()
  let f1 = emptyBroker()
  let f2 = emptyBroker()
  let hw = 0

  const computeHw = (L: BrokerState, A: BrokerState, B: BrokerState): number =>
    Math.min(L.leo, A.leo, B.leo)

  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: null,
    producerMessage: null,
    consumerVisibleUpTo: 0,
    note: '초기 상태. 모든 replica의 LEO=0, HW=0. Consumer가 볼 수 있는 메시지는 아직 없습니다.',
  })

  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'producer',
    producerMessage: 'A',
    consumerVisibleUpTo: 0,
    note: 'Producer가 메시지 A 를 Leader 에게 보냅니다.',
  })

  leader = withAppend(leader, 'A')
  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'leader',
    producerMessage: null,
    consumerVisibleUpTo: 0,
    note: 'Leader 가 A 를 로그 끝에 append 합니다. Leader LEO=1. Followers 는 아직 복제 전이므로 HW=0 유지.',
  })

  f1 = withAppend(f1, 'A')
  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'follower-1',
    producerMessage: null,
    consumerVisibleUpTo: 0,
    note: 'Follower-1 이 Leader 에게 Fetch 요청을 보내고 A 를 받아 자기 로그에 기록합니다. F1 LEO=1.',
  })

  f2 = withAppend(f2, 'A')
  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'follower-2',
    producerMessage: null,
    consumerVisibleUpTo: 0,
    note: 'Follower-2 도 Fetch 로 A 를 받아 기록합니다. F2 LEO=1. 이제 ISR 전체가 A 를 보유.',
  })

  hw = computeHw(leader, f1, f2)
  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'leader',
    producerMessage: null,
    consumerVisibleUpTo: 0,
    note: 'Leader 가 HW 를 전진시킵니다. HW = min(1, 1, 1) = 1. 이제 A 는 "안전한" 데이터입니다.',
  })

  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'consumer',
    producerMessage: null,
    consumerVisibleUpTo: hw,
    note: 'Consumer 가 Leader 에게서 읽습니다. HW=1 까지만 가시화되므로 A 가 읽힙니다.',
  })

  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'producer',
    producerMessage: 'B, C',
    consumerVisibleUpTo: hw,
    note: 'Producer 가 다음 배치로 B, C 를 보냅니다.',
  })

  leader = withAppend(leader, 'B', 'C')
  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'leader',
    producerMessage: null,
    consumerVisibleUpTo: hw,
    note: 'Leader LEO=3. 하지만 HW 는 여전히 1 (Followers 가 복제하기 전이므로). B, C 는 Leader 에만 존재.',
  })

  f1 = withAppend(f1, 'B', 'C')
  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'follower-1',
    producerMessage: null,
    consumerVisibleUpTo: hw,
    note: 'Follower-1 이 Fetch 로 B, C 모두 수신. F1 LEO=3. 그런데 F2 는 아직이라 HW 는 그대로.',
  })

  f2 = withAppend(f2, 'B')
  hw = computeHw(leader, f1, f2)
  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'follower-2',
    producerMessage: null,
    consumerVisibleUpTo: hw,
    note: 'Follower-2 가 Fetch. 이번엔 B 만 수신 (네트워크 지연 등). F2 LEO=2. HW = min(3, 3, 2) = 2.',
  })

  f2 = withAppend(f2, 'C')
  hw = computeHw(leader, f1, f2)
  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'follower-2',
    producerMessage: null,
    consumerVisibleUpTo: hw,
    note: 'Follower-2 가 다시 Fetch 로 C 수신. F2 LEO=3. HW = min(3, 3, 3) = 3. 모두 동기화 완료.',
  })

  s.push({
    leader,
    follower1: f1,
    follower2: f2,
    hw,
    activeRole: 'consumer',
    producerMessage: null,
    consumerVisibleUpTo: hw,
    note: 'Consumer 가 HW=3 까지 읽을 수 있습니다. 이 지점까지가 "ISR 전체에 복제되어 Leader 가 죽어도 살아남는" 구간.',
  })

  return s
}

export function KafkaReplicationFlow({
  description = 'Producer → Leader → Follower fetch → HW 전진 → Consumer 가시화의 전체 흐름. 각 단계에서 LEO와 HW가 어떻게 변하는지 직접 따라가 보세요.',
}: ReplicationFlowProps) {
  const snapshots = useMemo(() => buildSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="Kafka Replication 데이터 흐름" description={description}>
      <div className="space-y-4">
        <ClientRow
          label="Producer"
          activeMessage={current.producerMessage}
          isActive={current.activeRole === 'producer'}
          placement="top"
        />

        <div className="grid gap-3 md:grid-cols-3">
          <BrokerCard
            role="Leader"
            state={current.leader}
            highlightLeo={current.activeRole === 'leader'}
            hw={current.hw}
            isActive={current.activeRole === 'leader'}
          />
          <BrokerCard
            role="Follower-1"
            state={current.follower1}
            highlightLeo={current.activeRole === 'follower-1'}
            isActive={current.activeRole === 'follower-1'}
          />
          <BrokerCard
            role="Follower-2"
            state={current.follower2}
            highlightLeo={current.activeRole === 'follower-2'}
            isActive={current.activeRole === 'follower-2'}
          />
        </div>

        <ClientRow
          label="Consumer"
          consumerVisibleUpTo={current.consumerVisibleUpTo}
          isActive={current.activeRole === 'consumer'}
          placement="bottom"
        />
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot state="confirmed" label="HW 이하 (안전, Consumer 가시)" />
        <LegendDot state="comparing" label="LEO 위 (복제 진행 중)" />
        <LegendDot state="waiting" label="미기록" />
      </div>
    </VisualContainer>
  )
}

interface BrokerCardProps {
  role: string
  state: BrokerState
  highlightLeo: boolean
  hw?: number
  isActive: boolean
}

function BrokerCard({ role, state, highlightLeo, hw, isActive }: BrokerCardProps) {
  const isLeader = role === 'Leader'
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border-2 bg-background p-3 transition-all duration-300 motion-reduce:transition-none',
        isActive
          ? 'border-viz-pivot bg-viz-pivot-bg'
          : isLeader
            ? 'border-viz-highlight bg-viz-highlight-bg/30'
            : 'border-border',
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-foreground">{role}</span>
        {isLeader && (
          <span className="rounded-[var(--radius-chip)] bg-viz-highlight-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-viz-highlight-fg">
            Leader
          </span>
        )}
      </div>

      <div className="mb-2 flex gap-1">
        {state.log.map((msg, idx) => {
          const isBelowHw = isLeader && hw !== undefined && idx < hw
          const isFilled = msg !== null
          const state2: VizState = isBelowHw
            ? 'confirmed'
            : isFilled
              ? 'comparing'
              : 'waiting'
          return (
            <div
              key={idx}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-[6px] border-2 text-[12px] font-semibold',
                vizStateClasses(state2),
              )}
              aria-label={`offset ${idx}: ${msg ?? '비어있음'}`}
            >
              {msg ?? ''}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 text-[11px]">
        <span
          className={cn(
            'rounded-[var(--radius-chip)] px-2 py-0.5 font-mono font-semibold',
            highlightLeo
              ? 'bg-viz-comparing-bg text-viz-comparing-fg'
              : 'bg-muted text-muted-foreground',
          )}
        >
          LEO={state.leo}
        </span>
        {isLeader && hw !== undefined && (
          <span className="rounded-[var(--radius-chip)] bg-viz-confirmed-bg px-2 py-0.5 font-mono font-semibold text-viz-confirmed-fg">
            HW={hw}
          </span>
        )}
      </div>
    </div>
  )
}

interface ClientRowProps {
  label: string
  activeMessage?: string | null
  consumerVisibleUpTo?: number
  isActive: boolean
  placement: 'top' | 'bottom'
}

function ClientRow({
  label,
  activeMessage,
  consumerVisibleUpTo,
  isActive,
  placement,
}: ClientRowProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-[var(--radius-card)] border-2 bg-background px-3 py-1.5 transition-all duration-300 motion-reduce:transition-none',
          isActive ? 'border-viz-pivot bg-viz-pivot-bg' : 'border-border',
        )}
      >
        <span className="text-[12px] font-semibold text-foreground">{label}</span>
        {activeMessage && (
          <span className="rounded-[var(--radius-chip)] bg-viz-comparing-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-viz-comparing-fg">
            → {activeMessage}
          </span>
        )}
        {label === 'Consumer' && consumerVisibleUpTo !== undefined && (
          <span className="text-[11px] text-muted-foreground">
            읽기 가능: offset 0 ~ {Math.max(0, consumerVisibleUpTo - 1)}
            {consumerVisibleUpTo === 0 ? ' (아직 없음)' : ''}
          </span>
        )}
      </div>
      {placement === 'top' && <span className="text-muted-foreground">↓</span>}
    </div>
  )
}

function LegendDot({ state, label }: { state: VizState; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-sm border-2', vizStateClasses(state))}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
