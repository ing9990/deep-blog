'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

type Mode = 'RC' | 'RR'

interface Frame {
  time: string
  t1: { sql: string | null; note: string }
  t2: { sql: string | null; note: string }
  rowCommitted: number
  t2ReadRC: number | null
  t2ReadRR: number | null
  diverges: boolean
}

function buildFrames(): Frame[] {
  return [
    {
      time: 't = 0ms',
      t1: { sql: null, note: '대기 중' },
      t2: { sql: 'BEGIN', note: '트랜잭션 시작' },
      rowCommitted: 1000,
      t2ReadRC: null,
      t2ReadRR: null,
      diverges: false,
    },
    {
      time: 't = 5ms',
      t1: { sql: null, note: '대기 중' },
      t2: { sql: 'SELECT balance FROM accounts WHERE id = 42', note: '첫 번째 SELECT' },
      rowCommitted: 1000,
      t2ReadRC: 1000,
      t2ReadRR: 1000,
      diverges: false,
    },
    {
      time: 't = 15ms',
      t1: { sql: 'BEGIN; UPDATE accounts SET balance = 5000 WHERE id = 42', note: '잔액을 5000으로 변경' },
      t2: { sql: null, note: '진행 중 (아무 동작 안 함)' },
      rowCommitted: 1000,
      t2ReadRC: 1000,
      t2ReadRR: 1000,
      diverges: false,
    },
    {
      time: 't = 20ms',
      t1: { sql: 'COMMIT', note: '커밋. 5000이 확정됨' },
      t2: { sql: null, note: '진행 중' },
      rowCommitted: 5000,
      t2ReadRC: 1000,
      t2ReadRR: 1000,
      diverges: false,
    },
    {
      time: 't = 30ms',
      t1: { sql: null, note: '종료' },
      t2: { sql: 'SELECT balance FROM accounts WHERE id = 42', note: '두 번째 SELECT (같은 SQL)' },
      rowCommitted: 5000,
      t2ReadRC: 5000,
      t2ReadRR: 1000,
      diverges: true,
    },
  ]
}

export function NonRepeatableReadTimeline() {
  const frames = useMemo(() => buildFrames(), [])
  const controller = useStepController(frames.length)
  const [mode, setMode] = useState<Mode>('RC')
  const f = frames[controller.step]
  const first = mode === 'RC' ? frames[1].t2ReadRC : frames[1].t2ReadRR
  const second = mode === 'RC' ? f.t2ReadRC : f.t2ReadRR
  const showDiverge = mode === 'RC' && f.diverges
  const showSecondRead = controller.step >= 4

  return (
    <VisualContainer
      title="같은 SELECT를 두 번 했더니 값이 달라지는 순간"
      description="T2가 잔액을 두 번 SELECT 합니다. 그 사이에 T1이 잔액을 1000에서 5000으로 UPDATE하고 커밋합니다."
    >
      <div className="mb-3 flex gap-2">
        {(['RC', 'RR'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'rounded-[var(--radius-card)] border-2 px-3 py-1.5 text-[11px] font-semibold transition-colors',
              mode === m
                ? vizStateClasses('highlight')
                : 'border-border bg-background text-muted-foreground hover:bg-muted',
            )}
            aria-pressed={mode === m}
          >
            {m === 'RC' ? 'READ COMMITTED' : 'REPEATABLE READ'}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
        <div className="mb-3 font-mono text-[length:var(--text-meta)] font-semibold text-foreground">
          {f.time}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border-2 border-viz-comparing bg-viz-comparing-bg p-2">
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-viz-comparing-fg">
              Transaction T1
            </div>
            <div className="mt-1 min-h-[2.5em] font-mono text-[11.5px] text-viz-comparing-fg">
              {f.t1.sql ?? '—'}
            </div>
            <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{f.t1.note}</div>
          </div>

          <div className="rounded-[var(--radius-card)] border-2 border-viz-pivot bg-viz-pivot-bg p-2">
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-viz-pivot-fg">
              Transaction T2
            </div>
            <div className="mt-1 min-h-[2.5em] font-mono text-[11.5px] text-viz-pivot-fg">
              {f.t2.sql ?? '—'}
            </div>
            <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{f.t2.note}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className={cn('rounded-[var(--radius-card)] border-2 p-2', vizStateClasses('confirmed'))}>
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] opacity-80">
              커밋된 값
            </div>
            <div className="mt-0.5 font-mono text-[11.5px] font-semibold">balance={f.rowCommitted}</div>
          </div>

          <div className={cn('rounded-[var(--radius-card)] border-2 p-2', vizStateClasses(first === null ? 'pivot' : 'confirmed'))}>
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] opacity-80">
              T2 첫 SELECT
            </div>
            <div className="mt-0.5 font-mono text-[11.5px] font-semibold">
              {first === null ? '—' : `balance=${first}`}
            </div>
          </div>

          <div
            className={cn(
              'rounded-[var(--radius-card)] border-2 p-2',
              vizStateClasses(!showSecondRead ? 'pivot' : showDiverge ? 'blocked' : 'confirmed'),
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] opacity-80">
              T2 두 번째 SELECT
            </div>
            <div className="mt-0.5 font-mono text-[11.5px] font-semibold">
              {!showSecondRead ? '—' : `balance=${second}`}
            </div>
            {showDiverge && (
              <div className="mt-1 inline-block rounded-sm border border-current px-1 py-0.5 text-[9px] font-bold uppercase tracking-[var(--tracking-wide)]">
                NON-REPEATABLE READ
              </div>
            )}
          </div>
        </div>
      </div>

      <StepController {...controller} />

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {mode === 'RC'
          ? 'READ COMMITTED: 매 SELECT마다 최신 커밋 값을 본다. T1이 사이에 커밋했으므로 두 번째 SELECT는 5000을 본다.'
          : 'REPEATABLE READ: 트랜잭션 시작 시점의 스냅샷에서 읽는다. 같은 행에 대한 모든 SELECT가 1000을 본다.'}
      </p>
    </VisualContainer>
  )
}
