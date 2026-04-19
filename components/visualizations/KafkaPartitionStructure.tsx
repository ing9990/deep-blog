import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'
import { cn } from '@/lib/utils'

interface OffsetCell {
  offset: number
  key: string
}

interface Partition {
  id: number
  state: VizState
  cells: OffsetCell[]
}

const PARTITIONS: Partition[] = [
  {
    id: 0,
    state: 'confirmed',
    cells: [
      { offset: 0, key: 'user-42' },
      { offset: 1, key: 'user-42' },
      { offset: 2, key: 'user-17' },
      { offset: 3, key: 'user-42' },
      { offset: 4, key: 'user-17' },
    ],
  },
  {
    id: 1,
    state: 'comparing',
    cells: [
      { offset: 0, key: 'user-8' },
      { offset: 1, key: 'user-8' },
      { offset: 2, key: 'user-3' },
    ],
  },
  {
    id: 2,
    state: 'highlight',
    cells: [
      { offset: 0, key: 'user-55' },
      { offset: 1, key: 'user-29' },
      { offset: 2, key: 'user-55' },
      { offset: 3, key: 'user-29' },
    ],
  },
]

export function KafkaPartitionStructure() {
  return (
    <VisualContainer
      title="Topic: orders — 3개 Partition으로 분산"
      description="각 Partition은 독립된 append-only 로그. 같은 Key는 항상 같은 Partition에 순서대로 쌓입니다."
    >
      <div className="space-y-3 rounded-[var(--radius-panel)] border-2 border-dashed border-border bg-muted/20 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Topic: orders
        </div>
        {PARTITIONS.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <div className="w-24 shrink-0">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Partition
              </div>
              <div className="text-[14px] font-bold text-foreground">#{p.id}</div>
            </div>
            <div className="flex flex-1 items-center gap-1 overflow-x-auto">
              {p.cells.map((c) => (
                <div
                  key={c.offset}
                  className={cn(
                    'flex min-w-[60px] shrink-0 flex-col items-center justify-center rounded-md border px-2 py-1.5',
                    vizStateClasses(p.state),
                  )}
                >
                  <span className="text-[9px] uppercase tracking-wider opacity-70">
                    #{c.offset}
                  </span>
                  <span className="text-[10px] font-mono font-semibold">{c.key}</span>
                </div>
              ))}
              <div className="ml-1 shrink-0 text-[12px] font-medium text-muted-foreground">
                append →
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border/40 pt-3 text-[11px] leading-relaxed text-muted-foreground sm:grid-cols-2">
        <p>
          <span className="font-semibold text-foreground">Offset</span>: Partition 안에서 0부터 1씩 증가하는 불변 번호. 소비자가 어디까지 읽었는지의 북마크가 됩니다.
        </p>
        <p>
          <span className="font-semibold text-foreground">Key hashing</span>: 같은 Key(<code className="rounded bg-muted px-1 font-mono text-[10px]">user-42</code>)는 항상 같은 Partition으로 해싱되어 순서가 보장됩니다.
        </p>
      </div>
    </VisualContainer>
  )
}
