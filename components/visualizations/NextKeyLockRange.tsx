'use client'

import { Fragment, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses } from './common/colors'

type Coverage = 'free' | 'record' | 'gap'

interface KeyState {
  value: number
  coverage: Coverage
}

interface GapState {
  lower: number | null
  upper: number | null
  coverage: Coverage
}

interface Frame {
  time: string
  sql: string
  note: string
  keys: KeyState[]
  gaps: GapState[]
}

/** Index keys: 10, 20, 30, 40. */
function emptyKeys(): KeyState[] {
  return [
    { value: 10, coverage: 'free' },
    { value: 20, coverage: 'free' },
    { value: 30, coverage: 'free' },
    { value: 40, coverage: 'free' },
  ]
}

function emptyGaps(): GapState[] {
  return [
    { lower: null, upper: 10, coverage: 'free' },
    { lower: 10, upper: 20, coverage: 'free' },
    { lower: 20, upper: 30, coverage: 'free' },
    { lower: 30, upper: 40, coverage: 'free' },
    { lower: 40, upper: null, coverage: 'free' },
  ]
}

/**
 * Scenario: T1 runs `SELECT * FROM t WHERE id >= 20 FOR UPDATE` on InnoDB RR.
 * InnoDB's next-key lock = record lock + the gap immediately preceding the record.
 * For range `id >= 20`, the lock covers records 20, 30, 40, plus the supremum,
 * plus the gaps (10, 20), (20, 30), (30, 40), (40, +∞).
 */
function buildFrames(): Frame[] {
  const frames: Frame[] = []

  frames.push({
    time: 't = 0ms',
    sql: '— (대기)',
    note: '인덱스에 10, 20, 30, 40이 존재합니다. 락 없음.',
    keys: emptyKeys(),
    gaps: emptyGaps(),
  })

  // Step 1: scan finds first matching record id=20
  {
    const keys = emptyKeys()
    const gaps = emptyGaps()
    keys[1].coverage = 'record'
    frames.push({
      time: 't = 5ms',
      sql: 'T1: SELECT * FROM t WHERE id >= 20 FOR UPDATE',
      note: 'InnoDB가 인덱스 탐색을 시작합니다. 첫 번째 매치인 id=20에 record lock을 잡습니다.',
      keys,
      gaps,
    })
  }

  // Step 2: next-key includes preceding gap (10, 20)
  {
    const keys = emptyKeys()
    const gaps = emptyGaps()
    keys[1].coverage = 'record'
    gaps[1].coverage = 'gap'
    frames.push({
      time: 't = 6ms',
      sql: 'T1: ... (계속)',
      note: 'next-key lock = record lock + 직전 갭. id=20의 직전 갭 (10, 20)도 함께 잠깁니다.',
      keys,
      gaps,
    })
  }

  // Step 3: extend to id=30 and gap (20, 30)
  {
    const keys = emptyKeys()
    const gaps = emptyGaps()
    keys[1].coverage = 'record'
    keys[2].coverage = 'record'
    gaps[1].coverage = 'gap'
    gaps[2].coverage = 'gap'
    frames.push({
      time: 't = 7ms',
      sql: 'T1: ... (계속)',
      note: '다음 매치 id=30에 next-key lock. 갭 (20, 30)도 잠깁니다.',
      keys,
      gaps,
    })
  }

  // Step 4: extend to id=40 and gap (30, 40)
  {
    const keys = emptyKeys()
    const gaps = emptyGaps()
    keys[1].coverage = 'record'
    keys[2].coverage = 'record'
    keys[3].coverage = 'record'
    gaps[1].coverage = 'gap'
    gaps[2].coverage = 'gap'
    gaps[3].coverage = 'gap'
    frames.push({
      time: 't = 8ms',
      sql: 'T1: ... (계속)',
      note: 'id=40까지 락. 갭 (30, 40)도 포함.',
      keys,
      gaps,
    })
  }

  // Step 5: supremum / right-most gap (40, +∞)
  {
    const keys = emptyKeys()
    const gaps = emptyGaps()
    keys[1].coverage = 'record'
    keys[2].coverage = 'record'
    keys[3].coverage = 'record'
    gaps[1].coverage = 'gap'
    gaps[2].coverage = 'gap'
    gaps[3].coverage = 'gap'
    gaps[4].coverage = 'gap'
    frames.push({
      time: 't = 9ms',
      sql: 'T1: ... (완료)',
      note: 'WHERE 절이 열린 범위이므로 마지막 갭 (40, +∞)까지 잠깁니다. id=41, 100, 1000 INSERT 모두 차단됩니다.',
      keys,
      gaps,
    })
  }

  return frames
}

export function NextKeyLockRange() {
  const frames = useMemo(() => buildFrames(), [])
  const controller = useStepController(frames.length)
  const f = frames[controller.step]

  return (
    <VisualContainer
      title="WHERE id >= 20 FOR UPDATE의 next-key lock 펼침"
      description="InnoDB의 REPEATABLE READ에서 범위 조건이 어디까지 락을 펼치는지 step별로 보여줍니다."
    >
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-3">
        <div className="mb-2 font-mono text-[length:var(--text-meta)] font-semibold text-foreground">
          {f.time}
        </div>
        <div className="mb-3 rounded-[var(--radius-card)] border border-border bg-background p-2 font-mono text-[11.5px]">
          {f.sql}
        </div>

        <div className="flex items-center gap-0 overflow-x-auto py-2">
          {f.gaps.map((g, idx) => (
            <Fragment key={idx}>
              <GapBox lower={g.lower} upper={g.upper} coverage={g.coverage} />
              {idx < f.keys.length && (
                <KeyBox value={f.keys[idx].value} coverage={f.keys[idx].coverage} />
              )}
            </Fragment>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{f.note}</p>
      </div>

      <StepController {...controller} />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <Legend stateClass={vizStateClasses('confirmed')} label="락 없음" />
        <Legend stateClass={vizStateClasses('comparing')} label="record lock" />
        <Legend stateClass={vizStateClasses('waiting')} label="gap (next-key의 일부)" />
      </div>
    </VisualContainer>
  )
}

function KeyBox({ value, coverage }: { value: number; coverage: Coverage }) {
  const state = coverage === 'record' ? 'comparing' : 'confirmed'
  return (
    <div
      className={cn(
        'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 font-mono text-[12.5px] font-bold',
        vizStateClasses(state),
      )}
    >
      {value}
    </div>
  )
}

function GapBox({
  lower,
  upper,
  coverage,
}: {
  lower: number | null
  upper: number | null
  coverage: Coverage
}) {
  const locked = coverage === 'gap'
  return (
    <div
      className={cn(
        'flex h-12 min-w-[64px] flex-1 items-center justify-center border-y-2 border-dashed font-mono text-[10px]',
        locked
          ? 'border-viz-waiting bg-viz-waiting-bg text-viz-waiting-fg'
          : 'border-border bg-background text-muted-foreground',
      )}
    >
      ({lower ?? '-∞'}, {upper ?? '+∞'})
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
