import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'
import { cn } from '@/lib/utils'

interface ConsumerGroup {
  name: string
  currentOffset: number
  state: VizState
  description: string
}

const TOTAL_OFFSETS = 10

const GROUPS: ConsumerGroup[] = [
  {
    name: 'payment-svc',
    currentOffset: 3,
    state: 'comparing',
    description: '결제 처리 (느림)',
  },
  {
    name: 'analytics-svc',
    currentOffset: 7,
    state: 'pivot',
    description: '로그 집계 (빠름)',
  },
]

function Triangle({ state }: { state: VizState }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'mx-auto h-0 w-0 border-x-[7px] border-b-[11px] border-x-transparent',
        state === 'comparing' && 'border-b-viz-comparing',
        state === 'pivot' && 'border-b-viz-pivot',
      )}
    />
  )
}

export function KafkaConsumerGroupScopes() {
  const offsets = Array.from({ length: TOTAL_OFFSETS }, (_, i) => i)

  return (
    <VisualContainer
      title="Consumer Group 독립 소비"
      description="같은 Topic을 여러 Consumer Group이 각자의 offset으로 읽습니다. 한 쪽이 읽어도 메시지는 삭제되지 않습니다."
    >
      <div className="space-y-4 rounded-[var(--radius-panel)] border border-border bg-muted/20 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Topic: orders (Partition 0)
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="flex items-center gap-1">
              {offsets.map((o) => (
                <div
                  key={o}
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-[11px] font-semibold',
                    vizStateClasses('confirmed'),
                  )}
                >
                  #{o}
                </div>
              ))}
              <span className="ml-2 text-[14px] font-medium text-muted-foreground">→</span>
            </div>

            {GROUPS.map((g) => (
              <div key={g.name} className="mt-2 flex items-center gap-1">
                {offsets.map((o) => (
                  <div
                    key={o}
                    className="flex h-6 w-10 shrink-0 items-center justify-center"
                  >
                    {o === g.currentOffset && <Triangle state={g.state} />}
                  </div>
                ))}
                <div
                  className={cn(
                    'ml-2 shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-mono font-semibold',
                    vizStateClasses(g.state),
                  )}
                >
                  {g.name}
                  <span className="ml-1.5 opacity-70">at #{g.currentOffset}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5 border-t border-border/40 pt-3 text-[11px] leading-relaxed text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">읽기 ≠ 삭제</span>: analytics-svc가 offset 6까지 읽고 commit해도 메시지는 그대로 남아있습니다.
          </p>
          <p>
            <span className="font-semibold text-foreground">독립 진행</span>: payment-svc(offset 3)와 analytics-svc(offset 7)는 서로의 진행 상태를 알 필요 없이 각자의 속도로 읽습니다.
          </p>
        </div>
      </div>
    </VisualContainer>
  )
}
