import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'
import { cn } from '@/lib/utils'

interface Cell {
  code: string
  title: string
  systems: string
  note: string
  state: VizState
}

const MATRIX: { row: string; subtitle: string; cells: [Cell, Cell] }[] = [
  {
    row: 'P → A',
    subtitle: '파티션 시 가용성',
    cells: [
      {
        code: 'PA / EL',
        title: '가용성과 지연을 최우선',
        systems: 'DynamoDB · Cassandra · Riak',
        note: '파티션에서 A, 평상시에도 L을 선택. 쓰기 양방향 확산에 최적화된 설계.',
        state: 'highlight',
      },
      {
        code: 'PA / EC',
        title: '평소 엄격, 파티션엔 양보',
        systems: 'MongoDB 일부 모드',
        note: '평상시엔 동기 복제로 일관성을 유지하지만 파티션이 오면 가용성 쪽으로 기움.',
        state: 'comparing',
      },
    ],
  },
  {
    row: 'P → C',
    subtitle: '파티션 시 일관성',
    cells: [
      {
        code: 'PC / EL',
        title: '이론적, 드문 조합',
        systems: '실전 사례 드묾',
        note: '평소엔 비동기 복제로 지연을 줄이다 파티션이 오면 일관성을 우선. 상호 모순적 성향이라 실전에선 보기 어려움.',
        state: 'waiting',
      },
      {
        code: 'PC / EC',
        title: '일관성을 지속적으로 유지',
        systems: 'VoltDB · HBase · Zookeeper · etcd',
        note: '파티션 유무와 무관하게 일관성 우선. 합의(Paxos/Raft) 기반, 지연 비용을 감수.',
        state: 'confirmed',
      },
    ],
  },
]

export function PACELCClassification() {
  return (
    <VisualContainer
      title="PACELC 분류 매트릭스"
      description="파티션 시 선택(PAC)과 평상시 선택(ELC)의 4가지 조합. 세로는 파티션 선택, 가로는 평상시 선택."
    >
      <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
        <div />
        <div className="text-center text-[length:var(--text-caption)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
          E → L (지연)
        </div>
        <div className="text-center text-[length:var(--text-caption)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
          E → C (일관성)
        </div>

        {MATRIX.map((row) => (
          <div key={row.row} className="contents">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[length:var(--text-meta)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
                {row.row}
              </span>
              <span className="mt-0.5 text-[length:var(--text-caption)] text-muted-foreground">
                {row.subtitle}
              </span>
            </div>
            {row.cells.map((cell) => (
              <div
                key={cell.code}
                className={cn(
                  'rounded-[var(--radius-card)] border-2 p-3',
                  vizStateClasses(cell.state),
                )}
              >
                <p className="font-mono text-[length:var(--text-meta)] font-semibold">{cell.code}</p>
                <p className="mt-1 text-[length:var(--text-caption)] font-semibold opacity-90">
                  {cell.title}
                </p>
                <p className="mt-1.5 text-[length:var(--text-caption)] font-mono opacity-80">
                  {cell.systems}
                </p>
                <p className="mt-2 text-[length:var(--text-caption)] leading-relaxed opacity-70">
                  {cell.note}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/40 pt-2 text-[length:var(--text-caption)] text-muted-foreground">
        <LegendDot state="highlight" label="가용성·지연 우선" />
        <LegendDot state="comparing" label="조건부 일관성" />
        <LegendDot state="confirmed" label="일관성 우선" />
        <LegendDot state="waiting" label="드문 조합" />
      </div>
    </VisualContainer>
  )
}

function LegendDot({ state, label }: { state: VizState; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn('inline-block h-3 w-3 rounded-sm border-2', vizStateClasses(state))}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
