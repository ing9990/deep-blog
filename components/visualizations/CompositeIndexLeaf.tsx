'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

interface LeafEntry {
  status: string
  date: string
}

type EntryState = 'pivot' | 'comparing' | 'confirmed' | 'blocked' | 'waiting' | 'highlight' | null

interface Snapshot {
  indexLabel: string
  entries: LeafEntry[]
  states: EntryState[]
  dateOrderBroken: number[]
  note: string
}

const INDEX_A: LeafEntry[] = [
  { status: 'CANCEL', date: '04-15' },
  { status: 'CANCEL', date: '03-20' },
  { status: 'DELIVER', date: '04-10' },
  { status: 'DELIVER', date: '03-15' },
  { status: 'PAID', date: '04-16' },
  { status: 'PAID', date: '03-25' },
  { status: 'SHIP', date: '04-12' },
  { status: 'SHIP', date: '03-01' },
]

const INDEX_B: LeafEntry[] = [
  { status: 'PAID', date: '04-16' },
  { status: 'CANCEL', date: '04-15' },
  { status: 'SHIP', date: '04-12' },
  { status: 'DELIVER', date: '04-10' },
  { status: 'PAID', date: '03-25' },
  { status: 'CANCEL', date: '03-20' },
  { status: 'DELIVER', date: '03-15' },
  { status: 'SHIP', date: '03-01' },
]

const STATUS_STATE_MAP: Record<string, EntryState> = {
  CANCEL: 'blocked',
  DELIVER: 'highlight',
  PAID: 'confirmed',
  SHIP: 'comparing',
}

function computeSnapshots(): Snapshot[] {
  const allColored = INDEX_A.map((e) => STATUS_STATE_MAP[e.status] ?? null)

  return [
    {
      indexLabel: '(user_id, status, created_at DESC)',
      entries: INDEX_A,
      states: allColored,
      dateOrderBroken: [],
      note: '복합 인덱스의 리프 노드입니다. status별로 그룹화되고, 각 그룹 안에서 created_at이 내림차순입니다.',
    },
    {
      indexLabel: '(user_id, status, created_at DESC)',
      entries: INDEX_A,
      states: INDEX_A.map((e) => (e.status === 'PAID' ? 'confirmed' : 'waiting')),
      dateOrderBroken: [],
      note: 'WHERE status = PAID → PAID 그룹만 스캔. 04-16 → 03-25 이미 정렬됨. filesort 불필요 ✓',
    },
    {
      indexLabel: '(user_id, status, created_at DESC)',
      entries: INDEX_A,
      states: allColored,
      dateOrderBroken: [1, 3, 5],
      note: 'status 조건 없이 ORDER BY created_at DESC → 전체를 읽으면 날짜가 04-15, 03-20, 04-10... 뒤죽박죽! filesort 필요 ✗',
    },
    {
      indexLabel: '(user_id, created_at DESC)',
      entries: INDEX_B,
      states: INDEX_B.map((e) => STATUS_STATE_MAP[e.status] ?? null),
      dateOrderBroken: [],
      note: '인덱스를 (user_id, created_at DESC)로 변경. status 없이 created_at이 전역 내림차순 정렬됩니다.',
    },
    {
      indexLabel: '(user_id, created_at DESC)',
      entries: INDEX_B,
      states: INDEX_B.map(() => 'confirmed' as EntryState),
      dateOrderBroken: [],
      note: 'ORDER BY created_at DESC → 04-16, 04-15, 04-12... forward scan으로 바로 획득. filesort 불필요 ✓',
    },
  ]
}

interface CompositeIndexLeafProps {
  description?: string
}

export function CompositeIndexLeaf({
  description = '복합 인덱스의 컬럼 구성에 따라 리프 노드 배치가 어떻게 달라지는지 확인하세요.',
}: CompositeIndexLeafProps) {
  const snapshots = useMemo(() => computeSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer
      title="복합 인덱스 리프 노드 배치"
      description={description}
    >
      <div className="mb-3 rounded-[8px] border border-border bg-muted/30 px-3 py-2 text-[13px] font-semibold text-foreground">
        인덱스: {current.indexLabel}
        <span className="ml-2 text-muted-foreground font-normal">
          — user_id = 123 내부
        </span>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-[80px_1fr_1fr] gap-1 px-2 text-[12px] font-semibold text-muted-foreground">
          <span>#</span>
          <span>status</span>
          <span>created_at</span>
        </div>
        {current.entries.map((entry, idx) => {
          const state = current.states[idx]
          const isBroken = current.dateOrderBroken.includes(idx)
          const stateClass = state
            ? vizStateClasses(state)
            : 'border-border bg-background text-foreground'

          return (
            <div key={idx} className="relative">
              <div
                className={cn(
                  'grid grid-cols-[80px_1fr_1fr] gap-1 rounded-[6px] border-2 px-2 py-1.5 text-[13px] font-medium transition-all duration-300 motion-reduce:transition-none',
                  stateClass,
                )}
              >
                <span className="text-muted-foreground">{idx}</span>
                <span>{entry.status}</span>
                <span>{entry.date}</span>
              </div>
              {isBroken && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  ↕ 정렬 깨짐
                </div>
              )}
            </div>
          )
        })}
      </div>

      <StepController {...controller} stepDescription={current.note} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot stateClass="bg-viz-blocked-bg border-viz-blocked" label="CANCEL" />
        <LegendDot stateClass="bg-viz-highlight-bg border-viz-highlight" label="DELIVER" />
        <LegendDot stateClass="bg-viz-confirmed-bg border-viz-confirmed" label="PAID" />
        <LegendDot stateClass="bg-viz-comparing-bg border-viz-comparing" label="SHIP" />
      </div>
    </VisualContainer>
  )
}

function LegendDot({ stateClass, label }: { stateClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-sm border-2', stateClass)}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
