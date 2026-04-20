'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'

type Mode = 'cp' | 'ap'

interface NodeState {
  value: string
  state: VizState
  label: string
}

interface ActorState {
  action: string
  state: VizState
}

interface Snapshot {
  n1: NodeState
  n2: NodeState
  link: 'ok' | 'broken' | 'healing'
  clientA: ActorState
  clientB: ActorState
  note: string
}

function snapshotsForMode(mode: Mode): Snapshot[] {
  const steps: Snapshot[] = []

  steps.push({
    n1: { value: 'x=1', state: 'confirmed', label: 'Primary' },
    n2: { value: 'x=1', state: 'confirmed', label: 'Replica' },
    link: 'ok',
    clientA: { action: '대기', state: 'waiting' },
    clientB: { action: '대기', state: 'waiting' },
    note: '정상 상태. N1과 N2는 복제가 동기화되어 있으며 양쪽 모두 x=1을 가집니다.',
  })

  steps.push({
    n1: { value: 'x=1', state: 'confirmed', label: 'Primary' },
    n2: { value: 'x=1', state: 'confirmed', label: 'Replica' },
    link: 'broken',
    clientA: { action: '대기', state: 'waiting' },
    clientB: { action: '대기', state: 'waiting' },
    note: '네트워크 파티션 발생. N1과 N2 사이 링크가 끊겼습니다. 각 노드는 여전히 클라이언트와 통신 가능합니다.',
  })

  if (mode === 'cp') {
    steps.push({
      n1: { value: 'x=1', state: 'blocked', label: 'quorum 실패' },
      n2: { value: 'x=1', state: 'waiting', label: 'Replica' },
      link: 'broken',
      clientA: { action: 'x=2 쓰기 거절됨', state: 'blocked' },
      clientB: { action: '대기', state: 'waiting' },
      note: '클라A가 x=2 쓰기를 요청. N1은 N2와 합의할 수 없어 quorum을 확보하지 못합니다. 결과는 쓰기 거절 (CP: C를 지키기 위해 A를 버림).',
    })
    steps.push({
      n1: { value: 'x=1', state: 'waiting', label: 'Primary' },
      n2: { value: 'x=1', state: 'blocked', label: '최신성 확신 불가' },
      link: 'broken',
      clientA: { action: '대기', state: 'waiting' },
      clientB: { action: '읽기 실패', state: 'blocked' },
      note: '클라B가 N2에 읽기를 요청. N2는 N1의 최신 상태를 확신할 수 없어 에러를 반환합니다. 낡은 값을 내보내지 않고 일관성을 보호합니다.',
    })
    steps.push({
      n1: { value: 'x=1', state: 'confirmed', label: 'Primary' },
      n2: { value: 'x=1', state: 'confirmed', label: 'Replica' },
      link: 'healing',
      clientA: { action: '대기', state: 'waiting' },
      clientB: { action: '대기', state: 'waiting' },
      note: '파티션 복구 중. 양쪽 모두 x=1을 유지했으므로 불일치가 없습니다. 로그 replay 없이 즉시 정상 동작으로 복귀합니다.',
    })
    steps.push({
      n1: { value: 'x=1', state: 'confirmed', label: 'Primary' },
      n2: { value: 'x=1', state: 'confirmed', label: 'Replica' },
      link: 'ok',
      clientA: { action: '대기', state: 'waiting' },
      clientB: { action: '대기', state: 'waiting' },
      note: '복구 완료. CP 시스템은 파티션 동안 가용성을 일부 희생했지만 일관성을 지속적으로 보장했습니다.',
    })
  } else {
    steps.push({
      n1: { value: 'x=2', state: 'highlight', label: '로컬 쓰기 성공' },
      n2: { value: 'x=1', state: 'waiting', label: 'stale' },
      link: 'broken',
      clientA: { action: 'x=2 쓰기 성공', state: 'confirmed' },
      clientB: { action: '대기', state: 'waiting' },
      note: '클라A가 x=2 쓰기를 요청. N1은 N2와 합의 없이도 로컬에 쓰고 즉시 성공을 반환합니다 (AP: A를 지키기 위해 C를 양보). N2는 여전히 x=1.',
    })
    steps.push({
      n1: { value: 'x=2', state: 'waiting', label: 'Primary' },
      n2: { value: 'x=1', state: 'highlight', label: 'stale 응답' },
      link: 'broken',
      clientA: { action: '대기', state: 'waiting' },
      clientB: { action: 'x=1 수신 (stale)', state: 'highlight' },
      note: '클라B가 N2에 읽기를 요청. N2는 자신이 가진 x=1을 그대로 반환합니다. 실제 최신은 x=2이지만 N2는 이를 알지 못합니다. 낡은 값이라도 응답은 돌아왔습니다.',
    })
    steps.push({
      n1: { value: 'x=2', state: 'pivot', label: '병합 중' },
      n2: { value: 'x=1', state: 'pivot', label: '병합 중' },
      link: 'healing',
      clientA: { action: '대기', state: 'waiting' },
      clientB: { action: '대기', state: 'waiting' },
      note: '파티션 복구. N1(x=2)과 N2(x=1)의 값이 다릅니다. vector clock, LWW, CRDT 같은 conflict resolution 로직이 더 최신 값을 선택합니다.',
    })
    steps.push({
      n1: { value: 'x=2', state: 'confirmed', label: 'Primary' },
      n2: { value: 'x=2', state: 'confirmed', label: 'Replica' },
      link: 'ok',
      clientA: { action: '대기', state: 'waiting' },
      clientB: { action: '대기', state: 'waiting' },
      note: '병합 완료. 양쪽 모두 x=2로 수렴했습니다 (eventual consistency). AP 시스템은 가용성을 포기하지 않은 대신 일시적 불일치를 감수했습니다.',
    })
  }

  return steps
}

export function CAPPartitionDecision() {
  const [mode, setMode] = useState<Mode>('cp')
  const snapshots = useMemo(() => snapshotsForMode(mode), [mode])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  const selectMode = (next: Mode): void => {
    setMode(next)
    controller.reset()
  }

  return (
    <VisualContainer
      title="파티션 시나리오: CP vs AP"
      description="두 노드가 파티션으로 단절된 순간 CP와 AP가 각각 어떻게 응답하는지 비교합니다. 모드를 전환하며 step을 진행해보세요."
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectMode('cp')}
          className={cn(
            'rounded-[var(--radius-chip)] border px-3 py-1.5 text-[length:var(--text-meta)] font-medium transition-colors',
            mode === 'cp'
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border bg-background text-muted-foreground hover:bg-muted',
          )}
          aria-pressed={mode === 'cp'}
        >
          CP 시스템 (C 우선)
        </button>
        <button
          type="button"
          onClick={() => selectMode('ap')}
          className={cn(
            'rounded-[var(--radius-chip)] border px-3 py-1.5 text-[length:var(--text-meta)] font-medium transition-colors',
            mode === 'ap'
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border bg-background text-muted-foreground hover:bg-muted',
          )}
          aria-pressed={mode === 'ap'}
        >
          AP 시스템 (A 우선)
        </button>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto_1fr_1fr] sm:items-center">
          <NodeBox title="클라 A" subtitle={current.clientA.action} state={current.clientA.state} />
          <NodeBox
            title="노드 N1"
            value={current.n1.value}
            subtitle={current.n1.label}
            state={current.n1.state}
          />
          <div className="order-first col-span-2 flex items-center justify-center py-2 sm:order-none sm:col-span-1 sm:py-0">
            <LinkIndicator link={current.link} />
          </div>
          <NodeBox
            title="노드 N2"
            value={current.n2.value}
            subtitle={current.n2.label}
            state={current.n2.state}
          />
          <NodeBox title="클라 B" subtitle={current.clientB.action} state={current.clientB.state} />
        </div>
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[length:var(--text-caption)] text-muted-foreground">
        <LegendDot state="confirmed" label="정상 또는 최신" />
        <LegendDot state="highlight" label="불일치 허용 (AP)" />
        <LegendDot state="blocked" label="거절 또는 에러 (CP)" />
        <LegendDot state="pivot" label="병합 중" />
        <LegendDot state="waiting" label="대기" />
      </div>
    </VisualContainer>
  )
}

interface NodeBoxProps {
  title: string
  value?: string
  subtitle: string
  state: VizState
}

function NodeBox({ title, value, subtitle, state }: NodeBoxProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border-2 p-3 text-center transition-colors motion-reduce:transition-none',
        vizStateClasses(state),
      )}
    >
      <div className="text-[length:var(--text-meta)] font-semibold">{title}</div>
      {value && (
        <div className="mt-1 font-mono text-[length:var(--text-caption)]">{value}</div>
      )}
      <div className="mt-1 text-[length:var(--text-caption)] opacity-80">{subtitle}</div>
    </div>
  )
}

function LinkIndicator({ link }: { link: 'ok' | 'broken' | 'healing' }) {
  if (link === 'ok') {
    return (
      <div className="flex flex-col items-center">
        <span
          className="text-xl font-bold"
          style={{ color: 'var(--viz-confirmed-border)' }}
          aria-label="정상 연결"
        >
          ↔
        </span>
        <span className="mt-1 text-[length:var(--text-caption)] text-muted-foreground">연결</span>
      </div>
    )
  }
  if (link === 'broken') {
    return (
      <div className="flex flex-col items-center">
        <span
          className="text-xl font-bold"
          style={{ color: 'var(--viz-blocked-border)' }}
          aria-label="네트워크 파티션"
        >
          ⚡
        </span>
        <span className="mt-1 text-[length:var(--text-caption)] text-muted-foreground">단절</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-xl font-bold"
        style={{ color: 'var(--viz-pivot-border)' }}
        aria-label="복구 중"
      >
        ↻
      </span>
      <span className="mt-1 text-[length:var(--text-caption)] text-muted-foreground">복구</span>
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
