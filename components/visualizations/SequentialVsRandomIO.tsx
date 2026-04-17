import { cn } from '@/lib/utils'
import { vizStateClasses, type VizState } from './common/colors'
import { VisualContainer } from './common/VisualContainer'

const PAGE_COUNT = 12
const MATCH_INDICES = new Set([2, 5, 8])

type PageState = 'read' | 'match' | 'skipped'

function pageState(variant: 'sequential' | 'random', index: number): PageState {
  if (MATCH_INDICES.has(index)) return 'match'
  return variant === 'sequential' ? 'read' : 'skipped'
}

const STATE_CLASS: Record<PageState, string> = {
  read: vizStateClasses('comparing' as VizState),
  match: vizStateClasses('confirmed' as VizState),
  skipped:
    'border-dashed border-border bg-muted/30 text-muted-foreground/60',
}

function PageStrip({ variant }: { variant: 'sequential' | 'random' }) {
  return (
    <div className="grid grid-cols-12 gap-1">
      {Array.from({ length: PAGE_COUNT }).map((_, i) => {
        const state = pageState(variant, i)
        return (
          <div
            key={i}
            className={cn(
              'flex aspect-square items-center justify-center rounded-md border-2 text-[10px] font-semibold tabular-nums sm:text-xs',
              STATE_CLASS[state],
            )}
          >
            {i + 1}
          </div>
        )
      })}
    </div>
  )
}

function Scenario({
  title,
  description,
  strip,
  motion,
  stats,
}: {
  title: string
  description: string
  strip: React.ReactNode
  motion: React.ReactNode
  stats: Array<{ label: string; value: string }>
}) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {description}
        </p>
      </div>

      {strip}

      <div className="mt-2 h-6">{motion}</div>

      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px]">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">{s.label}</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function SequentialVsRandomIO() {
  return (
    <VisualContainer
      title="Sequential I/O vs Random I/O"
      description="같은 12개 페이지에서 Full Table Scan은 전부 훑고, Index Scan은 3개만 골라 읽지만 매번 점프합니다"
    >
      <div className="space-y-6">
        <Scenario
          title="Sequential I/O (Full Table Scan)"
          description="모든 페이지를 순서대로 읽는다"
          strip={<PageStrip variant="sequential" />}
          motion={
            <div className="relative flex h-full items-center">
              <div className="h-0.5 w-full rounded-full bg-viz-comparing/70" />
              <div
                className="absolute inset-y-0 right-0 flex items-center"
                aria-hidden="true"
              >
                <span className="text-viz-comparing">▶</span>
              </div>
              <span className="absolute inset-x-0 -top-0.5 text-center text-[10px] text-muted-foreground">
                한 방향 sweep
              </span>
            </div>
          }
          stats={[
            { label: '읽은 페이지', value: '12 / 12' },
            { label: '헤드 이동', value: '1회 연속 sweep' },
          ]}
        />

        <div className="h-px bg-border/60" aria-hidden="true" />

        <Scenario
          title="Random I/O (Index Scan)"
          description="필요한 페이지만 골라 읽는다"
          strip={<PageStrip variant="random" />}
          motion={
            <div className="relative flex h-full items-center justify-center gap-6 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="text-viz-highlight">↷</span>
                seek
              </span>
              <span className="flex items-center gap-1">
                <span className="text-viz-highlight">↷</span>
                seek
              </span>
              <span className="flex items-center gap-1">
                <span className="text-viz-highlight">↷</span>
                seek
              </span>
            </div>
          }
          stats={[
            { label: '읽은 페이지', value: '3 / 12' },
            { label: '헤드 이동', value: '3회 seek (점프)' },
          ]}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-block h-3 w-3 rounded-sm border-2',
              vizStateClasses('comparing'),
            )}
          />
          읽었지만 버린 페이지
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-block h-3 w-3 rounded-sm border-2',
              vizStateClasses('confirmed'),
            )}
          />
          조건에 매칭된 페이지
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-dashed border-border bg-muted/30" />
          읽지 않고 건너뛴 페이지
        </span>
      </div>
    </VisualContainer>
  )
}
