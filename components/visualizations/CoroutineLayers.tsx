import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses } from './common/colors'
import { cn } from '@/lib/utils'

const COROUTINES_ON_T1 = ['A', 'B', 'C', 'D', 'E']
const COROUTINES_ON_T2 = ['F', 'G', 'H', 'I', 'J']

export function CoroutineLayers() {
  return (
    <VisualContainer
      title="실행 단위의 3계층"
      description="1개의 CPU Core 위에 OS Thread가 올라가고, 1개의 Thread 위에 여러 Coroutine이 올라갑니다"
    >
      <div className="space-y-3">
        {/* Coroutine layer (top) */}
        <LayerRow
          label="Coroutine"
          sublabel="논리 실행 단위 / 런타임 관리"
          colorState="highlight"
          tone="lightest"
        >
          <div className="grid grid-cols-2 gap-2">
            <CoroutineCluster ids={COROUTINES_ON_T1} />
            <CoroutineCluster ids={COROUTINES_ON_T2} />
          </div>
        </LayerRow>

        <ConnectorArrow />

        {/* OS Thread layer (middle) */}
        <LayerRow
          label="OS Thread"
          sublabel="커널 스케줄 대상 / 선점형"
          colorState="comparing"
          tone="mid"
        >
          <div className="grid grid-cols-2 gap-2">
            <ThreadBox name="Thread 1" />
            <ThreadBox name="Thread 2" />
          </div>
        </LayerRow>

        <ConnectorArrow />

        {/* CPU Core layer (bottom) */}
        <LayerRow
          label="CPU Core"
          sublabel="물리 실행 자원"
          colorState="confirmed"
          tone="darkest"
        >
          <div className="grid grid-cols-2 gap-2">
            <CoreBox name="Core 1" />
            <CoreBox name="Core 2" />
          </div>
        </LayerRow>
      </div>

      {/* Comparison table */}
      <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-border">
        <table className="w-full text-[length:var(--text-meta)]">
          <thead>
            <tr className="bg-muted/40 text-muted-foreground">
              <th className="px-3 py-2 text-left font-semibold">구분</th>
              <th className="px-3 py-2 text-left font-semibold">OS Thread</th>
              <th className="px-3 py-2 text-left font-semibold">Coroutine</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-3 py-2 font-medium text-foreground">스위칭 주체</td>
              <td className="px-3 py-2 text-muted-foreground">커널 (선점형)</td>
              <td className="px-3 py-2 text-muted-foreground">언어 런타임 (협력형)</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium text-foreground">스택 크기</td>
              <td className="px-3 py-2 text-muted-foreground">1–8 MB</td>
              <td className="px-3 py-2 text-muted-foreground">수십 B – 수 KB</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium text-foreground">최대 동시 개수</td>
              <td className="px-3 py-2 text-muted-foreground">수천</td>
              <td className="px-3 py-2 text-muted-foreground">수만–수십만</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium text-foreground">중단 지점</td>
              <td className="px-3 py-2 text-muted-foreground">커널이 아무 때나 강제</td>
              <td className="px-3 py-2 text-muted-foreground">
                <code className="rounded bg-muted/60 px-1 text-[11px]">
                  await
                </code>{' '}
                /{' '}
                <code className="rounded bg-muted/60 px-1 text-[11px]">
                  suspend
                </code>{' '}
                명시
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </VisualContainer>
  )
}

interface LayerRowProps {
  label: string
  sublabel: string
  colorState: 'highlight' | 'comparing' | 'confirmed'
  tone: 'lightest' | 'mid' | 'darkest'
  children: React.ReactNode
}

function LayerRow({ label, sublabel, colorState, children }: LayerRowProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border-2 p-3',
        vizStateClasses(colorState),
      )}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold">{label}</span>
        <span className="text-[11px] opacity-70">{sublabel}</span>
      </div>
      {children}
    </div>
  )
}

function CoroutineCluster({ ids }: { ids: string[] }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-[var(--radius-chip)] border border-border/50 bg-background/50 p-2">
      {ids.map((id) => (
        <span
          key={id}
          className="inline-flex h-6 min-w-6 items-center justify-center rounded-[var(--radius-chip)] border border-current px-1.5 text-[11px] font-mono font-semibold"
        >
          {id}
        </span>
      ))}
    </div>
  )
}

function ThreadBox({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center rounded-[var(--radius-chip)] border border-current bg-background/40 px-3 py-2 text-[12px] font-semibold">
      {name}
    </div>
  )
}

function CoreBox({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center rounded-[var(--radius-chip)] border border-current bg-background/40 px-3 py-3 text-[13px] font-semibold tracking-wide">
      {name}
    </div>
  )
}

function ConnectorArrow() {
  return (
    <div
      className="flex justify-center text-muted-foreground"
      aria-hidden="true"
    >
      <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
        <path
          d="M6 0v10m0 0l-4-4m4 4l4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
