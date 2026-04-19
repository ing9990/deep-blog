'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface FailoverProps {
  description?: string
}

type BrokerRole = 'leader' | 'follower' | 'dead' | 'candidate' | 'new-leader'

interface BrokerNode {
  id: string
  label: string
  role: BrokerRole
  isController: boolean
  inIsr: boolean
}

interface Snapshot {
  brokers: BrokerNode[]
  producerTarget: string | null
  /** 어느 노드가 이번 단계의 핵심인지 — 색상 강조 대상 */
  focusIds: string[]
  note: string
}

function buildSnapshots(): Snapshot[] {
  const base: BrokerNode[] = [
    { id: 'b1', label: 'Broker-1', role: 'leader', isController: false, inIsr: true },
    { id: 'b2', label: 'Broker-2', role: 'follower', isController: false, inIsr: true },
    { id: 'b3', label: 'Broker-3', role: 'follower', isController: true, inIsr: true },
    { id: 'b4', label: 'Broker-4', role: 'follower', isController: false, inIsr: false },
  ]

  const s: Snapshot[] = []

  s.push({
    brokers: base.map((b) => ({ ...b })),
    producerTarget: 'b1',
    focusIds: [],
    note: '정상 상태. Broker-1 이 파티션의 Leader. Broker-3 은 Controller 역할 겸직. ISR = {B1, B2, B3}. Broker-4 는 lag 으로 ISR 에서 탈락된 상태.',
  })

  const snap2 = base.map((b) => (b.id === 'b1' ? { ...b, role: 'dead' as BrokerRole, inIsr: false } : { ...b }))
  s.push({
    brokers: snap2,
    producerTarget: null,
    focusIds: ['b1'],
    note: 'Broker-1 프로세스 다운. Producer 의 쓰기가 실패하기 시작. Broker-1 은 heartbeat 응답 없음.',
  })

  s.push({
    brokers: snap2,
    producerTarget: null,
    focusIds: ['b1', 'b3'],
    note: 'Controller (Broker-3) 가 수 초 내 heartbeat 타임아웃을 감지. "Broker-1 이 죽었고 파티션의 Leader 부재" 라고 판정.',
  })

  const snap4 = snap2.map((b) =>
    b.id === 'b2' ? { ...b, role: 'candidate' as BrokerRole } : { ...b },
  )
  s.push({
    brokers: snap4,
    producerTarget: null,
    focusIds: ['b3', 'b2'],
    note: 'Controller 가 ISR 조회: {B1(dead), B2, B3}. 살아있는 ISR 중 Broker-2 를 새 Leader 후보로 선정. (Broker-4 는 ISR 밖이라 후보 제외.)',
  })

  const snap5 = snap4.map((b) =>
    b.id === 'b2' ? { ...b, role: 'new-leader' as BrokerRole } : { ...b },
  )
  s.push({
    brokers: snap5,
    producerTarget: null,
    focusIds: ['b2'],
    note: 'Broker-2 를 새 Leader 로 승격. Controller 가 클러스터 메타데이터를 갱신하고 모든 Broker 에 전파.',
  })

  s.push({
    brokers: snap5,
    producerTarget: 'b2',
    focusIds: ['b2'],
    note: 'Producer/Consumer 가 메타데이터 변경을 감지하고 Broker-2 에 재연결. 쓰기/읽기 재개. 전체 소요 시간은 보통 수 초 단위.',
  })

  return s
}

export function KafkaLeaderFailover({
  description = 'Leader 가 죽었을 때 Controller 가 ISR 안에서 새 Leader 를 뽑고 Producer 가 다시 연결되기까지의 6 단계를 따라가 보세요.',
}: FailoverProps) {
  const snapshots = useMemo(() => buildSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="Leader 장애와 재선출" description={description}>
      <ProducerRow target={current.producerTarget} brokers={current.brokers} />

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {current.brokers.map((b) => (
          <BrokerTile key={b.id} broker={b} isFocused={current.focusIds.includes(b.id)} />
        ))}
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot state="highlight" label="Leader" />
        <LegendDot state="waiting" label="Follower (ISR)" />
        <LegendDot state="blocked" label="Dead / ISR 밖" />
        <LegendDot state="pivot" label="후보 / 전환 중" />
        <LegendDot state="confirmed" label="새 Leader" />
      </div>
    </VisualContainer>
  )
}

interface ProducerRowProps {
  target: string | null
  brokers: BrokerNode[]
}

function ProducerRow({ target, brokers }: ProducerRowProps) {
  const targetBroker = target ? brokers.find((b) => b.id === target) : null

  return (
    <div className="flex items-center justify-center gap-3">
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-[var(--radius-card)] border-2 bg-background px-3 py-1.5',
          target ? 'border-viz-comparing' : 'border-viz-blocked',
        )}
      >
        <span className="text-[12px] font-semibold text-foreground">Producer</span>
        <span
          className={cn(
            'rounded-[var(--radius-chip)] px-2 py-0.5 text-[11px] font-medium',
            target
              ? 'bg-viz-comparing-bg text-viz-comparing-fg'
              : 'bg-viz-blocked-bg text-viz-blocked-fg',
          )}
        >
          {target ? `→ ${targetBroker?.label ?? ''} 에 쓰는 중` : '쓰기 실패 / 재연결 대기'}
        </span>
      </div>
    </div>
  )
}

function BrokerTile({ broker, isFocused }: { broker: BrokerNode; isFocused: boolean }) {
  const roleState: VizState =
    broker.role === 'leader'
      ? 'highlight'
      : broker.role === 'dead'
        ? 'blocked'
        : broker.role === 'candidate'
          ? 'pivot'
          : broker.role === 'new-leader'
            ? 'confirmed'
            : broker.inIsr
              ? 'waiting'
              : 'blocked'

  const roleLabel =
    broker.role === 'leader'
      ? 'Leader'
      : broker.role === 'dead'
        ? 'Dead'
        : broker.role === 'candidate'
          ? '후보'
          : broker.role === 'new-leader'
            ? 'New Leader'
            : 'Follower'

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border-2 bg-background p-3 transition-all duration-300 motion-reduce:transition-none',
        vizStateClasses(roleState),
        isFocused && 'ring-2 ring-offset-2 ring-offset-background ring-foreground/40',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold">{broker.label}</span>
        {broker.isController && (
          <span className="rounded-[var(--radius-chip)] bg-background/60 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider">
            Controller
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-[var(--radius-chip)] bg-background/60 px-2 py-0.5 text-[10px] font-semibold">
          {roleLabel}
        </span>
        <span
          className={cn(
            'rounded-[var(--radius-chip)] px-2 py-0.5 text-[10px] font-medium',
            broker.inIsr ? 'bg-background/60' : 'bg-background/40 opacity-60 line-through',
          )}
        >
          ISR
        </span>
      </div>
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
