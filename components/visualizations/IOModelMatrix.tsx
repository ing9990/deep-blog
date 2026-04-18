import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'
import { cn } from '@/lib/utils'

interface Cell {
  title: string
  tech: string
  note: string
  state: VizState
}

const MATRIX: { row: 'Sync' | 'Async'; cells: [Cell, Cell] }[] = [
  {
    row: 'Sync',
    cells: [
      {
        title: 'Sync + Blocking',
        tech: '전통 read() / Tomcat',
        note: '두 단계 모두 스레드가 멈춤. 가장 단순한 모델.',
        state: 'comparing',
      },
      {
        title: 'Sync + Non-Blocking',
        tech: 'O_NONBLOCK + polling',
        note: 'read()가 즉시 리턴하지만 계속 재시도. CPU 낭비.',
        state: 'blocked',
      },
    ],
  },
  {
    row: 'Async',
    cells: [
      {
        title: 'Async + Blocking',
        tech: 'select / poll / epoll',
        note: 'fd 감시는 async, 실제 read()는 여전히 sync. Nginx, Node.js, Redis.',
        state: 'confirmed',
      },
      {
        title: 'Async + Non-Blocking',
        tech: 'io_uring / IOCP',
        note: '두 단계 모두 커널이 처리. 진짜 비동기. Kotlin coroutines + reactive.',
        state: 'highlight',
      },
    ],
  },
]

export function IOModelMatrix() {
  return (
    <VisualContainer
      title="I/O 모델 2x2 매트릭스"
      description="Sync/Async와 Blocking/Non-Blocking은 서로 다른 축이며, 4가지 조합이 모두 존재합니다"
    >
      <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
        <div />
        <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Blocking
        </div>
        <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Non-Blocking
        </div>

        {MATRIX.map((row) => (
          <div key={row.row} className="contents">
            <div className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {row.row}
            </div>
            {row.cells.map((cell) => (
              <div
                key={cell.title}
                className={cn(
                  'rounded-[var(--radius-card)] border-2 p-3',
                  vizStateClasses(cell.state),
                )}
              >
                <p className="text-[13px] font-semibold">{cell.title}</p>
                <p className="mt-1 text-[12px] font-medium opacity-80">
                  {cell.tech}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed opacity-70">
                  {cell.note}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        <LegendDot state="comparing" label="전통 표준" />
        <LegendDot state="blocked" label="비권장" />
        <LegendDot state="confirmed" label="현재 주류" />
        <LegendDot state="highlight" label="차세대" />
      </div>
    </VisualContainer>
  )
}

function LegendDot({ state, label }: { state: VizState; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'inline-block h-3 w-3 rounded-sm border-2',
          vizStateClasses(state),
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
