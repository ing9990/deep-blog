'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

type LockState = 'free' | 'record' | 'gap' | 'nextkey'

interface IndexKey {
  value: number
  lock: LockState
}

interface Gap {
  /** Lower bound of the gap (the left key). `null` means -∞. */
  lower: number | null
  /** Upper bound of the gap (the right key). `null` means +∞. */
  upper: number | null
  lock: LockState
}

interface InsertAttempt {
  value: number
  /** Which gap index it falls into. */
  intoGapIndex: number
  outcome: 'pending' | 'allowed' | 'blocked'
}

interface Frame {
  time: string
  sql: string
  note: string
  keys: IndexKey[]
  gaps: Gap[]
  insertAttempts: InsertAttempt[]
  /** Active range pulse on the index (e.g., `WHERE id >= 20`). */
  rangeFrom?: number
}

/**
 * Index keys: 10, 20, 30, 40 (id column).
 * Gaps: (-∞, 10), (10, 20), (20, 30), (30, 40), (40, +∞)
 */
const BASE_KEYS: IndexKey[] = [
  { value: 10, lock: 'free' },
  { value: 20, lock: 'free' },
  { value: 30, lock: 'free' },
  { value: 40, lock: 'free' },
]

const BASE_GAPS: Gap[] = [
  { lower: null, upper: 10, lock: 'free' },
  { lower: 10, upper: 20, lock: 'free' },
  { lower: 20, upper: 30, lock: 'free' },
  { lower: 30, upper: 40, lock: 'free' },
  { lower: 40, upper: null, lock: 'free' },
]

function clone(keys: IndexKey[], gaps: Gap[]) {
  return {
    keys: keys.map((k) => ({ ...k })),
    gaps: gaps.map((g) => ({ ...g })),
  }
}

function buildFrames(): Frame[] {
  const frames: Frame[] = []

  // Frame 0: idle
  frames.push({
    time: 't = 0ms',
    sql: '— (대기)',
    note: '인덱스 id에 10, 20, 30, 40이 존재합니다. 락 없음.',
    ...clone(BASE_KEYS, BASE_GAPS),
    insertAttempts: [],
  })

  // Frame 1: T1 takes record lock on id=20 via SELECT ... FOR UPDATE WHERE id = 20
  {
    const { keys, gaps } = clone(BASE_KEYS, BASE_GAPS)
    keys.find((k) => k.value === 20)!.lock = 'record'
    frames.push({
      time: 't = 5ms',
      sql: 'T1: SELECT * FROM t WHERE id = 20 FOR UPDATE',
      note: 'T1이 인덱스 항목 id=20에 record lock을 잡습니다. 빈 구간은 잠그지 않습니다.',
      keys,
      gaps,
      insertAttempts: [],
    })
  }

  // Frame 2: T2 tries INSERT id=25 → falls into gap (20, 30), gap is free → allowed
  {
    const { keys, gaps } = clone(BASE_KEYS, BASE_GAPS)
    keys.find((k) => k.value === 20)!.lock = 'record'
    frames.push({
      time: 't = 10ms',
      sql: 'T2: INSERT INTO t (id) VALUES (25)',
      note: 'id=25는 갭 (20, 30)에 들어갑니다. record lock은 빈 구간을 막지 못하므로 INSERT가 통과합니다. → phantom 발생.',
      keys,
      gaps,
      insertAttempts: [{ value: 25, intoGapIndex: 2, outcome: 'allowed' }],
    })
  }

  // Frame 3: Reset, T1 takes gap lock on (20, 30) via SELECT ... FOR UPDATE WHERE id BETWEEN 21 AND 29
  {
    const { keys, gaps } = clone(BASE_KEYS, BASE_GAPS)
    gaps[2].lock = 'gap'
    frames.push({
      time: 't = 20ms',
      sql: 'T1 (다른 시나리오): SELECT * FROM t WHERE id BETWEEN 21 AND 29 FOR UPDATE',
      note: 'WHERE 절이 (20, 30) 갭만 가리킵니다. InnoDB는 갭 자체에 gap lock을 잡습니다.',
      keys,
      gaps,
      insertAttempts: [],
    })
  }

  // Frame 4: T2 INSERT id=25 → blocked
  {
    const { keys, gaps } = clone(BASE_KEYS, BASE_GAPS)
    gaps[2].lock = 'gap'
    frames.push({
      time: 't = 25ms',
      sql: 'T2: INSERT INTO t (id) VALUES (25)',
      note: 'id=25가 잠긴 갭 (20, 30)에 들어가려 하므로 T1 커밋까지 대기합니다.',
      keys,
      gaps,
      insertAttempts: [{ value: 25, intoGapIndex: 2, outcome: 'blocked' }],
    })
  }

  // Frame 5: T2 INSERT id=15 → falls into gap (10, 20), free → allowed
  {
    const { keys, gaps } = clone(BASE_KEYS, BASE_GAPS)
    gaps[2].lock = 'gap'
    frames.push({
      time: 't = 30ms',
      sql: 'T2: INSERT INTO t (id) VALUES (15)',
      note: 'id=15는 갭 (10, 20)에 들어갑니다. 이 갭은 잠겨 있지 않으므로 INSERT가 통과합니다.',
      keys,
      gaps,
      insertAttempts: [
        { value: 25, intoGapIndex: 2, outcome: 'blocked' },
        { value: 15, intoGapIndex: 1, outcome: 'allowed' },
      ],
    })
  }

  return frames
}

export function IndexGapLockVisualizer() {
  const frames = useMemo(() => buildFrames(), [])
  const controller = useStepController(frames.length)
  const f = frames[controller.step]

  return (
    <VisualContainer
      title="record lock과 gap lock: 어디를 잠그는가"
      description="인덱스 id에 10, 20, 30, 40이 정렬되어 있습니다. record lock은 키 한 점만 잠그고, gap lock은 키 사이의 빈 구간을 잠급니다."
    >
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
        <div className="mb-2 font-mono text-[length:var(--text-meta)] font-semibold text-foreground">
          {f.time}
        </div>
        <div className="mb-3 rounded-[var(--radius-card)] border border-border bg-background p-2 font-mono text-[11.5px]">
          {f.sql}
        </div>

        <IndexLine keys={f.keys} gaps={f.gaps} insertAttempts={f.insertAttempts} />

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{f.note}</p>

        {f.insertAttempts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {f.insertAttempts.map((a) => (
              <div
                key={a.value}
                className={cn(
                  'rounded-[var(--radius-card)] border-2 px-2 py-1 text-[11px]',
                  a.outcome === 'allowed'
                    ? vizStateClasses('confirmed')
                    : a.outcome === 'blocked'
                      ? vizStateClasses('blocked')
                      : vizStateClasses('waiting'),
                )}
              >
                INSERT id={a.value}: {a.outcome === 'allowed' ? '통과' : a.outcome === 'blocked' ? '차단 (대기)' : '진행 중'}
              </div>
            ))}
          </div>
        )}
      </div>

      <StepController {...controller} />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <Legend stateClass={vizStateClasses('confirmed')} label="락 없음" />
        <Legend stateClass={vizStateClasses('comparing')} label="record lock (키 한 점)" />
        <Legend stateClass={vizStateClasses('waiting')} label="gap lock (키 사이 빈 구간)" />
      </div>
    </VisualContainer>
  )
}

function IndexLine({
  keys,
  gaps,
  insertAttempts,
}: {
  keys: IndexKey[]
  gaps: Gap[]
  insertAttempts: InsertAttempt[]
}) {
  const segments: Array<{ type: 'gap' | 'key'; index: number }> = []
  for (let i = 0; i < gaps.length; i++) {
    segments.push({ type: 'gap', index: i })
    if (i < keys.length) segments.push({ type: 'key', index: i })
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {segments.map((seg, idx) => {
        if (seg.type === 'key') {
          const k = keys[seg.index]
          return (
            <KeyNode key={`k-${idx}`} value={k.value} lock={k.lock} />
          )
        }
        const g = gaps[seg.index]
        const attempt = insertAttempts.find((a) => a.intoGapIndex === seg.index)
        return (
          <GapSegment
            key={`g-${idx}`}
            lower={g.lower}
            upper={g.upper}
            lock={g.lock}
            attempt={attempt}
          />
        )
      })}
    </div>
  )
}

function KeyNode({ value, lock }: { value: number; lock: LockState }) {
  const state =
    lock === 'record' ? 'comparing' : lock === 'nextkey' ? 'waiting' : 'confirmed'
  return (
    <div
      className={cn(
        'relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 font-mono text-[12.5px] font-bold',
        vizStateClasses(state),
      )}
    >
      {value}
      {lock !== 'free' && (
        <span className="absolute -top-4 text-[9px] font-bold uppercase tracking-[var(--tracking-wide)] opacity-90">
          {lock}
        </span>
      )}
    </div>
  )
}

function GapSegment({
  lower,
  upper,
  lock,
  attempt,
}: {
  lower: number | null
  upper: number | null
  lock: LockState
  attempt?: InsertAttempt
}) {
  const locked = lock === 'gap' || lock === 'nextkey'
  return (
    <div
      className={cn(
        'relative flex h-12 min-w-[64px] flex-1 items-center justify-center border-y-2 border-dashed',
        locked
          ? 'border-viz-waiting bg-viz-waiting-bg text-viz-waiting-fg'
          : 'border-border bg-background text-muted-foreground',
      )}
    >
      <span className="font-mono text-[10px]">
        ({lower ?? '-∞'}, {upper ?? '+∞'})
      </span>
      {locked && (
        <span className="absolute -top-4 text-[9px] font-bold uppercase tracking-[var(--tracking-wide)] opacity-90">
          gap
        </span>
      )}
      {attempt && (
        <span
          className={cn(
            'absolute -bottom-5 rounded-sm border px-1 py-0.5 font-mono text-[10px] font-bold',
            attempt.outcome === 'allowed'
              ? 'border-viz-confirmed bg-viz-confirmed-bg text-viz-confirmed-fg'
              : attempt.outcome === 'blocked'
                ? 'border-viz-blocked bg-viz-blocked-bg text-viz-blocked-fg'
                : 'border-viz-waiting bg-viz-waiting-bg text-viz-waiting-fg',
          )}
        >
          ↑ INSERT {attempt.value}
        </span>
      )}
    </div>
  )
}

function Legend({ stateClass, label }: { stateClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-block h-3 w-3 rounded-sm border-2', stateClass)} aria-hidden="true" />
      {label}
    </span>
  )
}
