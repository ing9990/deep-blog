'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VisualContainer } from './common/VisualContainer'
import { StepController } from './common/StepController'
import { useStepController } from './common/useStepController'
import { vizStateClasses, type VizState } from './common/colors'

interface CacheStampedeDefenseTimelineProps {
  description?: string
}

type CacheState = 'fresh' | 'expired' | 'updating' | 'stale'
type RequestFate = 'idle' | 'hit' | 'fetch' | 'wait' | 'stale-return' | 'done'

interface PatternRow {
  cache: CacheState
  requestFates: RequestFate[]
  dbFetchesCumulative: number
  note: string
}

interface Snapshot {
  timeLabel: string
  globalNote: string
  patterns: {
    none: PatternRow
    mutex: PatternRow
    per: PatternRow
    swr: PatternRow
  }
}

const NUM_REQUESTS = 5

function buildSnapshots(): Snapshot[] {
  return [
    {
      timeLabel: 't = 0s',
      globalNote: '캐시 신선. TTL 3초 후 만료 예정. 평시 트래픽.',
      patterns: {
        none: row('fresh', ['idle', 'idle', 'idle', 'idle', 'idle'], 0, '평시: 캐시 hit'),
        mutex: row('fresh', ['idle', 'idle', 'idle', 'idle', 'idle'], 0, '평시: 캐시 hit'),
        per: row('fresh', ['idle', 'idle', 'idle', 'idle', 'idle'], 0, '평시: 캐시 hit'),
        swr: row('fresh', ['idle', 'idle', 'idle', 'idle', 'idle'], 0, '평시: 캐시 hit'),
      },
    },
    {
      timeLabel: 't = 2s',
      globalNote: 'TTL 만료 임박. 단일 요청 도착.',
      patterns: {
        none: row('fresh', ['hit', 'idle', 'idle', 'idle', 'idle'], 0, '캐시 hit'),
        mutex: row('fresh', ['hit', 'idle', 'idle', 'idle', 'idle'], 0, '캐시 hit'),
        per: row('updating', ['hit', 'idle', 'idle', 'idle', 'idle'], 1, 'PER이 확률적으로 BG 갱신 시작'),
        swr: row('fresh', ['hit', 'idle', 'idle', 'idle', 'idle'], 0, '캐시 hit'),
      },
    },
    {
      timeLabel: 't = 3s ⚠️',
      globalNote: 'TTL 만료. 동시 5개 요청 도착 (이벤트 발생).',
      patterns: {
        none: row('expired', ['fetch', 'fetch', 'fetch', 'fetch', 'fetch'], 5, '5개 모두 DB로 직행 (스탬피드)'),
        mutex: row('expired', ['fetch', 'wait', 'wait', 'wait', 'wait'], 1, '1개 락 획득 + fetch, 4개 대기'),
        per: row('fresh', ['hit', 'hit', 'hit', 'hit', 'hit'], 1, '이미 BG 갱신 완료 → 5개 hit'),
        swr: row('stale', ['stale-return', 'stale-return', 'stale-return', 'stale-return', 'stale-return'], 1, 'stale 값 즉시 반환 + 1개 BG 갱신'),
      },
    },
    {
      timeLabel: 't = 4s',
      globalNote: '처리 중. DB 부하 차이가 극명히 드러남.',
      patterns: {
        none: row('updating', ['fetch', 'fetch', 'fetch', 'fetch', 'fetch'], 5, 'DB 부하 5x, 응답 지연'),
        mutex: row('updating', ['fetch', 'wait', 'wait', 'wait', 'wait'], 1, '락 holder fetch 진행 중'),
        per: row('fresh', ['done', 'done', 'done', 'done', 'done'], 1, '5개 정상 응답 완료'),
        swr: row('updating', ['done', 'done', 'done', 'done', 'done'], 1, '5개 즉시 응답 완료, BG fetch 진행'),
      },
    },
    {
      timeLabel: 't = 5s',
      globalNote: '결과 비교. DB fetch 누적 횟수의 차이.',
      patterns: {
        none: row('fresh', ['done', 'done', 'done', 'done', 'done'], 5, 'DB fetch 5회 발생'),
        mutex: row('fresh', ['done', 'done', 'done', 'done', 'done'], 1, 'DB fetch 1회 + 4개 latency 증가'),
        per: row('fresh', ['done', 'done', 'done', 'done', 'done'], 1, 'DB fetch 1회, 정상 latency'),
        swr: row('fresh', ['done', 'done', 'done', 'done', 'done'], 1, 'DB fetch 1회, 응답 stale 1주기'),
      },
    },
  ]
}

function row(
  cache: CacheState,
  requestFates: RequestFate[],
  dbFetchesCumulative: number,
  note: string,
): PatternRow {
  return { cache, requestFates, dbFetchesCumulative, note }
}

const PATTERN_LABELS = {
  none: 'No Defense',
  mutex: 'Mutex Lock',
  per: 'PER',
  swr: 'SWR',
} as const

const PATTERN_KEYS = ['none', 'mutex', 'per', 'swr'] as const

function cacheStateClass(state: CacheState): string {
  switch (state) {
    case 'fresh':
      return vizStateClasses('confirmed')
    case 'expired':
      return vizStateClasses('blocked')
    case 'updating':
      return vizStateClasses('highlight')
    case 'stale':
      return vizStateClasses('pivot')
  }
}

function cacheStateLabel(state: CacheState): string {
  switch (state) {
    case 'fresh':
      return 'FRESH'
    case 'expired':
      return 'EXPIRED'
    case 'updating':
      return 'UPDATING'
    case 'stale':
      return 'STALE'
  }
}

function requestFateClass(fate: RequestFate): string {
  if (fate === 'idle') return 'border-border bg-background text-muted-foreground'
  const map: Record<Exclude<RequestFate, 'idle'>, VizState> = {
    hit: 'confirmed',
    fetch: 'blocked',
    wait: 'waiting',
    'stale-return': 'pivot',
    done: 'confirmed',
  }
  return vizStateClasses(map[fate])
}

function requestFateGlyph(fate: RequestFate): string {
  switch (fate) {
    case 'idle':
      return '·'
    case 'hit':
      return 'H'
    case 'fetch':
      return 'F'
    case 'wait':
      return 'W'
    case 'stale-return':
      return 'S'
    case 'done':
      return '✓'
  }
}

export function CacheStampedeDefenseTimeline({
  description = 'TTL 만료 시점에 동시 5개 요청이 도착할 때, 4가지 방어 패턴이 어떻게 다르게 처리하는지 step별로 비교합니다.',
}: CacheStampedeDefenseTimelineProps) {
  const snapshots = useMemo(() => buildSnapshots(), [])
  const controller = useStepController(snapshots.length)
  const current = snapshots[controller.step]

  return (
    <VisualContainer title="4가지 방어 패턴 시간축 비교" description={description}>
      <div className="rounded-[var(--radius-card)] bg-muted/30 p-3">
        <div className="mb-3 flex items-center justify-between gap-3 text-[length:var(--text-meta)]">
          <span className="font-semibold text-foreground">{current.timeLabel}</span>
          <span className="text-muted-foreground">{current.globalNote}</span>
        </div>

        <div className="space-y-2">
          {PATTERN_KEYS.map((key) => {
            const pattern = current.patterns[key]
            return (
              <div
                key={key}
                className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-card)] border border-border bg-background p-2"
              >
                <div className="text-[length:var(--text-meta)] font-semibold text-foreground">
                  {PATTERN_LABELS[key]}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'inline-flex h-7 w-[78px] items-center justify-center rounded-[6px] border-2 text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] transition-colors',
                      cacheStateClass(pattern.cache),
                    )}
                  >
                    {cacheStateLabel(pattern.cache)}
                  </div>
                  <div className="flex items-center gap-1">
                    {pattern.requestFates.map((fate, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-[5px] border-2 text-[11px] font-bold transition-colors',
                          requestFateClass(fate),
                        )}
                        aria-label={`Request ${idx + 1}: ${fate}`}
                      >
                        {requestFateGlyph(fate)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground">DB fetches</span>
                  <span className="text-[length:var(--text-h4)] font-bold tabular-nums text-foreground">
                    {pattern.dbFetchesCumulative}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
          {PATTERN_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-[6px] border border-border bg-background px-2 py-1.5 text-[10px] leading-snug text-muted-foreground"
            >
              <span className="font-semibold text-foreground">{PATTERN_LABELS[key]}:</span>{' '}
              {current.patterns[key].note}
            </div>
          ))}
        </div>
      </div>

      <StepController {...controller} stepDescription={current.globalNote} />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
        <LegendDot stateClass={vizStateClasses('confirmed')} label="Fresh / Hit / 완료" />
        <LegendDot stateClass={vizStateClasses('blocked')} label="Expired / Fetch (스탬피드)" />
        <LegendDot stateClass={vizStateClasses('waiting')} label="Wait (락 대기)" />
        <LegendDot stateClass={vizStateClasses('pivot')} label="Stale 반환" />
        <LegendDot stateClass={vizStateClasses('highlight')} label="BG 갱신 중" />
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
