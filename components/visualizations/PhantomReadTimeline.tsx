'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

type Mode = 'RR_ANSI' | 'SR'

interface Row {
  id: number
  age: number
  inserted?: boolean
}

interface Frame {
  time: string
  t1: { sql: string | null; note: string }
  t2: { sql: string | null; note: string }
  committedRows: Row[]
  t2VisibleRR: number[] | null
  t2VisibleSR: number[] | null
  t1Blocked?: boolean
  phantom: boolean
}

function buildFrames(): Frame[] {
  return [
    {
      time: 't = 0ms',
      t1: { sql: null, note: '대기 중' },
      t2: { sql: 'BEGIN', note: '트랜잭션 시작' },
      committedRows: [{ id: 1, age: 31 }, { id: 2, age: 35 }],
      t2VisibleRR: null,
      t2VisibleSR: null,
      phantom: false,
    },
    {
      time: 't = 5ms',
      t1: { sql: null, note: '대기 중' },
      t2: { sql: 'SELECT id FROM users WHERE age >= 30', note: '첫 번째 범위 SELECT' },
      committedRows: [{ id: 1, age: 31 }, { id: 2, age: 35 }],
      t2VisibleRR: [1, 2],
      t2VisibleSR: [1, 2],
      phantom: false,
    },
    {
      time: 't = 15ms',
      t1: { sql: 'BEGIN; INSERT INTO users (id, age) VALUES (3, 40)', note: 'SERIALIZABLE에서는 갭/술어 락에 막혀 대기' },
      t2: { sql: null, note: '진행 중' },
      committedRows: [{ id: 1, age: 31 }, { id: 2, age: 35 }],
      t2VisibleRR: [1, 2],
      t2VisibleSR: [1, 2],
      t1Blocked: true,
      phantom: false,
    },
    {
      time: 't = 20ms',
      t1: { sql: 'COMMIT', note: 'ANSI RR: 커밋 성공. SERIALIZABLE: T2 커밋 대기' },
      t2: { sql: null, note: '진행 중' },
      committedRows: [{ id: 1, age: 31 }, { id: 2, age: 35 }, { id: 3, age: 40, inserted: true }],
      t2VisibleRR: [1, 2],
      t2VisibleSR: [1, 2],
      phantom: false,
    },
    {
      time: 't = 30ms',
      t1: { sql: null, note: '종료' },
      t2: { sql: 'SELECT id FROM users WHERE age >= 30', note: '두 번째 범위 SELECT (같은 SQL)' },
      committedRows: [{ id: 1, age: 31 }, { id: 2, age: 35 }, { id: 3, age: 40, inserted: true }],
      t2VisibleRR: [1, 2, 3],
      t2VisibleSR: [1, 2],
      phantom: true,
    },
  ]
}

export function PhantomReadTimeline() {
  const frames = useMemo(() => buildFrames(), [])
  const controller = useStepController(frames.length)
  const [mode, setMode] = useState<Mode>('RR_ANSI')
  const f = frames[controller.step]
  const firstVisible = mode === 'RR_ANSI' ? frames[1].t2VisibleRR : frames[1].t2VisibleSR
  const secondVisible = mode === 'RR_ANSI' ? f.t2VisibleRR : f.t2VisibleSR
  const showSecond = controller.step >= 4
  const showPhantom = mode === 'RR_ANSI' && f.phantom

  return (
    <VisualContainer
      title="범위 쿼리 사이에 새 행이 끼어드는 순간"
      description="T2가 'age >= 30' 범위를 두 번 SELECT 합니다. 그 사이에 T1이 age=40인 행을 INSERT 합니다. (ANSI 스펙 기준 REPEATABLE READ: InnoDB의 RR과 다름은 §6에서 다룹니다.)"
    >
      <div className="mb-3 flex gap-2">
        {(['RR_ANSI', 'SR'] as Mode[]).map((m) => (
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
            {m === 'RR_ANSI' ? 'REPEATABLE READ (ANSI)' : 'SERIALIZABLE'}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
        <div className="mb-3 font-mono text-[length:var(--text-meta)] font-semibold text-foreground">
          {f.time}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className={cn('rounded-[var(--radius-card)] border-2 p-2', mode === 'SR' && f.t1Blocked ? vizStateClasses('waiting') : 'border-viz-comparing bg-viz-comparing-bg text-viz-comparing-fg')}>
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)]">
              Transaction T1 {mode === 'SR' && f.t1Blocked && '(BLOCKED)'}
            </div>
            <div className="mt-1 min-h-[2.5em] font-mono text-[11.5px]">{f.t1.sql ?? '—'}</div>
            <div className="mt-1 text-[11px] leading-snug opacity-80">{f.t1.note}</div>
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

        <div className="mt-3">
          <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-muted-foreground">
            users 테이블 (커밋된 상태)
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {f.committedRows.map((r) => (
              <div
                key={r.id}
                className={cn(
                  'rounded-[var(--radius-card)] border-2 px-2.5 py-1 font-mono text-[11.5px]',
                  r.inserted ? vizStateClasses('highlight') : vizStateClasses('confirmed'),
                )}
              >
                id={r.id}, age={r.age}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className={cn('rounded-[var(--radius-card)] border-2 p-2', vizStateClasses(firstVisible ? 'confirmed' : 'pivot'))}>
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] opacity-80">
              T2 첫 SELECT 결과
            </div>
            <div className="mt-0.5 font-mono text-[11.5px] font-semibold">
              {firstVisible ? `[${firstVisible.join(', ')}]` : '—'}
            </div>
          </div>

          <div
            className={cn(
              'rounded-[var(--radius-card)] border-2 p-2',
              vizStateClasses(!showSecond ? 'pivot' : showPhantom ? 'blocked' : 'confirmed'),
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] opacity-80">
              T2 두 번째 SELECT 결과
            </div>
            <div className="mt-0.5 font-mono text-[11.5px] font-semibold">
              {!showSecond ? '—' : `[${(secondVisible ?? []).join(', ')}]`}
            </div>
            {showPhantom && (
              <div className="mt-1 inline-block rounded-sm border border-current px-1 py-0.5 text-[9px] font-bold uppercase tracking-[var(--tracking-wide)]">
                PHANTOM READ
              </div>
            )}
          </div>
        </div>
      </div>

      <StepController {...controller} />

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {mode === 'RR_ANSI'
          ? 'ANSI REPEATABLE READ: 같은 행 재읽기는 일관되지만, 새로 INSERT된 행이 두 번째 범위 SELECT에 끼어든다.'
          : 'SERIALIZABLE: T1의 INSERT는 T2 커밋까지 대기한다. T2가 보는 결과는 일관된다.'}
      </p>
    </VisualContainer>
  )
}
