'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

type Holder = 'free' | 'T1' | 'T2'
type TxState = 'idle' | 'running' | 'waiting' | 'rolledback'

interface Frame {
  time: string
  globalNote: string
  t1: { sql: string; state: TxState }
  t2: { sql: string; state: TxState }
  rowA: Holder
  rowB: Holder
  waitsFor: { from: 'T1' | 'T2'; to: 'T1' | 'T2' }[]
  cycleDetected: boolean
}

function buildFrames(): Frame[] {
  return [
    {
      time: 't = 0ms',
      globalNote: '두 트랜잭션이 막 시작했습니다.',
      t1: { sql: 'BEGIN', state: 'running' },
      t2: { sql: 'BEGIN', state: 'running' },
      rowA: 'free',
      rowB: 'free',
      waitsFor: [],
      cycleDetected: false,
    },
    {
      time: 't = 5ms',
      globalNote: 'T1이 row A를 잠급니다.',
      t1: { sql: 'UPDATE t SET x = 1 WHERE id = "A"', state: 'running' },
      t2: { sql: '... (대기 중)', state: 'running' },
      rowA: 'T1',
      rowB: 'free',
      waitsFor: [],
      cycleDetected: false,
    },
    {
      time: 't = 10ms',
      globalNote: 'T2가 row B를 잠급니다. 두 트랜잭션의 락 순서가 어긋났습니다.',
      t1: { sql: '... (다음 SQL 준비)', state: 'running' },
      t2: { sql: 'UPDATE t SET x = 2 WHERE id = "B"', state: 'running' },
      rowA: 'T1',
      rowB: 'T2',
      waitsFor: [],
      cycleDetected: false,
    },
    {
      time: 't = 15ms',
      globalNote: 'T1이 row B를 요청합니다. T2가 잡고 있으므로 T1은 대기.',
      t1: { sql: 'UPDATE t SET x = 1 WHERE id = "B"', state: 'waiting' },
      t2: { sql: '... ', state: 'running' },
      rowA: 'T1',
      rowB: 'T2',
      waitsFor: [{ from: 'T1', to: 'T2' }],
      cycleDetected: false,
    },
    {
      time: 't = 20ms',
      globalNote: 'T2가 row A를 요청합니다. T1이 잡고 있으므로 T2도 대기. wait-for graph에 사이클이 생깁니다.',
      t1: { sql: '... (대기)', state: 'waiting' },
      t2: { sql: 'UPDATE t SET x = 2 WHERE id = "A"', state: 'waiting' },
      rowA: 'T1',
      rowB: 'T2',
      waitsFor: [
        { from: 'T1', to: 'T2' },
        { from: 'T2', to: 'T1' },
      ],
      cycleDetected: true,
    },
    {
      time: 't = 21ms',
      globalNote: 'InnoDB의 데드락 탐지기가 사이클을 발견하고 T2를 ROLLBACK합니다. T1은 락을 유지하고 계속 진행합니다.',
      t1: { sql: '... (대기 해제 임박)', state: 'waiting' },
      t2: { sql: 'ERROR 1213: Deadlock found. ROLLBACK.', state: 'rolledback' },
      rowA: 'T1',
      rowB: 'free',
      waitsFor: [],
      cycleDetected: false,
    },
    {
      time: 't = 22ms',
      globalNote: 'T1이 row B를 획득하고 작업을 마칩니다.',
      t1: { sql: 'UPDATE t SET x = 1 WHERE id = "B"', state: 'running' },
      t2: { sql: '(롤백됨)', state: 'rolledback' },
      rowA: 'T1',
      rowB: 'T1',
      waitsFor: [],
      cycleDetected: false,
    },
  ]
}

export function DeadlockLifecycle() {
  const frames = useMemo(() => buildFrames(), [])
  const controller = useStepController(frames.length)
  const f = frames[controller.step]

  return (
    <VisualContainer
      title="데드락의 형성과 탐지: 두 트랜잭션의 락 순서가 어긋날 때"
      description="T1은 A → B 순서로, T2는 B → A 순서로 잠그려 합니다. 사이클이 형성되고 InnoDB가 한쪽을 ROLLBACK 합니다."
    >
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
        <div className="mb-3 flex items-center justify-between gap-3 text-[length:var(--text-meta)]">
          <span className="font-mono font-semibold text-foreground">{f.time}</span>
          {f.cycleDetected && (
            <span className="rounded-sm border-2 border-viz-blocked bg-viz-blocked-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-viz-blocked-fg">
              CYCLE DETECTED
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <TxCard label="T1" sql={f.t1.sql} state={f.t1.state} stateClass={vizStateClasses('comparing')} />
          <TxCard label="T2" sql={f.t2.sql} state={f.t2.state} stateClass={vizStateClasses('pivot')} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <RowCell name="row A" holder={f.rowA} />
          <RowCell name="row B" holder={f.rowB} />
        </div>

        <WaitForGraph waitsFor={f.waitsFor} cycleDetected={f.cycleDetected} />

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{f.globalNote}</p>
      </div>

      <StepController {...controller} />
    </VisualContainer>
  )
}

function TxCard({
  label,
  sql,
  state,
  stateClass,
}: {
  label: string
  sql: string
  state: TxState
  stateClass: string
}) {
  const stateLabel: Record<TxState, string> = {
    idle: 'IDLE',
    running: 'RUNNING',
    waiting: 'WAITING',
    rolledback: 'ROLLED BACK',
  }
  const stateBadgeClass: Record<TxState, VizState> = {
    idle: 'confirmed',
    running: 'confirmed',
    waiting: 'waiting',
    rolledback: 'blocked',
  }
  return (
    <div className={cn('rounded-[var(--radius-card)] border-2 p-2', stateClass)}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)]">{label}</div>
        <div
          className={cn(
            'rounded-sm border px-1 py-0.5 text-[9px] font-bold uppercase tracking-[var(--tracking-wide)]',
            vizStateClasses(stateBadgeClass[state]),
          )}
        >
          {stateLabel[state]}
        </div>
      </div>
      <div className="mt-1 min-h-[2.5em] font-mono text-[11.5px]">{sql}</div>
    </div>
  )
}

function RowCell({ name, holder }: { name: string; holder: Holder }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border-2 p-2',
        holder === 'free' ? vizStateClasses('confirmed') : vizStateClasses('waiting'),
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] opacity-80">
        {name}
      </div>
      <div className="mt-0.5 font-mono text-[11.5px] font-semibold">
        {holder === 'free' ? '자유' : `${holder} 락 중`}
      </div>
    </div>
  )
}

function WaitForGraph({
  waitsFor,
  cycleDetected,
}: {
  waitsFor: { from: 'T1' | 'T2'; to: 'T1' | 'T2' }[]
  cycleDetected: boolean
}) {
  return (
    <div className="mt-3 rounded-[var(--radius-card)] border border-border bg-background p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-muted-foreground">
        wait-for graph
      </div>
      <svg viewBox="0 0 200 80" className="h-20 w-full" aria-hidden="true">
        <defs>
          <marker id="arrow-wf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
          </marker>
        </defs>

        <g className={cn(cycleDetected ? 'text-viz-blocked' : 'text-muted-foreground')}>
          <circle cx="50" cy="40" r="20" fill="var(--viz-comparing-bg)" stroke="var(--viz-comparing-border)" strokeWidth="2" />
          <text x="50" y="44" textAnchor="middle" className="fill-current font-mono text-[12px] font-bold" style={{ fill: 'var(--viz-comparing-fg)' }}>
            T1
          </text>

          <circle cx="150" cy="40" r="20" fill="var(--viz-pivot-bg)" stroke="var(--viz-pivot-border)" strokeWidth="2" />
          <text x="150" y="44" textAnchor="middle" className="fill-current font-mono text-[12px] font-bold" style={{ fill: 'var(--viz-pivot-fg)' }}>
            T2
          </text>

          {waitsFor.map((w, idx) => {
            const isT1ToT2 = w.from === 'T1' && w.to === 'T2'
            const x1 = isT1ToT2 ? 70 : 130
            const x2 = isT1ToT2 ? 130 : 70
            const y = isT1ToT2 ? 30 : 50
            return (
              <line
                key={idx}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke="currentColor"
                strokeWidth="2"
                markerEnd="url(#arrow-wf)"
              />
            )
          })}
        </g>
      </svg>
      <p className="mt-1 text-[11px] text-muted-foreground">
        화살표 <span className="font-mono">A → B</span> 는 &quot;A가 B의 락이 풀리길 기다린다&quot;는 뜻입니다. 두 화살표가 양방향으로 생기면 사이클입니다.
      </p>
    </div>
  )
}
