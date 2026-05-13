'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

type Mode = 'RU' | 'RC'

interface Frame {
  time: string
  t1: { sql: string | null; note: string }
  t2: { sql: string | null; note: string }
  rowValue: number
  committedValue: number
  t2ReadsRU: number | null
  t2ReadsRC: number | null
  dirty: boolean
}

function buildFrames(): Frame[] {
  return [
    {
      time: 't = 0ms',
      t1: { sql: 'BEGIN', note: '트랜잭션 시작' },
      t2: { sql: null, note: '대기 중' },
      rowValue: 1000,
      committedValue: 1000,
      t2ReadsRU: null,
      t2ReadsRC: null,
      dirty: false,
    },
    {
      time: 't = 5ms',
      t1: { sql: 'UPDATE accounts SET balance = 5000 WHERE id = 42', note: '값을 5000으로 변경. 아직 커밋 안 함' },
      t2: { sql: null, note: '대기 중' },
      rowValue: 5000,
      committedValue: 1000,
      t2ReadsRU: null,
      t2ReadsRC: null,
      dirty: false,
    },
    {
      time: 't = 10ms',
      t1: { sql: '...', note: '아직 진행 중 (미커밋 상태)' },
      t2: { sql: 'BEGIN', note: '트랜잭션 시작' },
      rowValue: 5000,
      committedValue: 1000,
      t2ReadsRU: null,
      t2ReadsRC: null,
      dirty: false,
    },
    {
      time: 't = 15ms',
      t1: { sql: '...', note: '아직 진행 중' },
      t2: { sql: 'SELECT balance FROM accounts WHERE id = 42', note: '읽기 시도' },
      rowValue: 5000,
      committedValue: 1000,
      t2ReadsRU: 5000,
      t2ReadsRC: 1000,
      dirty: true,
    },
    {
      time: 't = 25ms',
      t1: { sql: 'ROLLBACK', note: '롤백. 변경을 모두 되돌린다' },
      t2: { sql: null, note: '읽은 값으로 후속 처리' },
      rowValue: 1000,
      committedValue: 1000,
      t2ReadsRU: 5000,
      t2ReadsRC: 1000,
      dirty: true,
    },
  ]
}

export function DirtyReadTimeline() {
  const frames = useMemo(() => buildFrames(), [])
  const controller = useStepController(frames.length)
  const [mode, setMode] = useState<Mode>('RU')
  const f = frames[controller.step]
  const t2Read = mode === 'RU' ? f.t2ReadsRU : f.t2ReadsRC
  const showDirty = mode === 'RU' && f.dirty

  return (
    <VisualContainer
      title="T1이 미커밋 상태에서 T2가 읽는 순간"
      description="잔액 1000원이 5000원으로 UPDATE된 후 아직 커밋되지 않은 시점에 T2가 SELECT를 실행합니다. 격리 수준에 따라 T2가 보는 값이 달라집니다."
    >
      <div className="mb-3 flex gap-2">
        {(['RU', 'RC'] as Mode[]).map((m) => (
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
            {m === 'RU' ? 'READ UNCOMMITTED' : 'READ COMMITTED'}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
        <div className="mb-3 flex items-center justify-between gap-3 text-[length:var(--text-meta)]">
          <span className="font-mono font-semibold text-foreground">{f.time}</span>
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
          <Cell label="id=42 row" value={`balance=${f.rowValue}`} state={f.rowValue !== f.committedValue ? 'highlight' : 'confirmed'} />
          <Cell label="커밋된 값" value={`balance=${f.committedValue}`} state="confirmed" />
          <Cell
            label="T2가 본 값"
            value={t2Read === null ? '아직 읽지 않음' : `balance=${t2Read}`}
            state={showDirty ? 'blocked' : t2Read === null ? 'pivot' : 'confirmed'}
            badge={showDirty ? 'DIRTY READ' : undefined}
          />
        </div>
      </div>

      <StepController {...controller} />

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {mode === 'RU'
          ? 'READ UNCOMMITTED: T2는 미커밋 상태의 5000을 그대로 읽습니다. T1이 ROLLBACK한 후 그 값은 존재하지 않습니다.'
          : 'READ COMMITTED: T2는 마지막 커밋 값(1000)만 봅니다. T1이 ROLLBACK해도 어긋남이 없습니다.'}
      </p>
    </VisualContainer>
  )
}

function Cell({
  label,
  value,
  state,
  badge,
}: {
  label: string
  value: string
  state: 'confirmed' | 'highlight' | 'blocked' | 'pivot'
  badge?: string
}) {
  return (
    <div className={cn('rounded-[var(--radius-card)] border-2 p-2', vizStateClasses(state))}>
      <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] opacity-80">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[11.5px] font-semibold">{value}</div>
      {badge && (
        <div className="mt-1 inline-block rounded-sm border border-current px-1 py-0.5 text-[9px] font-bold uppercase tracking-[var(--tracking-wide)]">
          {badge}
        </div>
      )}
    </div>
  )
}
