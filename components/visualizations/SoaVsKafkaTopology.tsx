import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses } from './common/colors'
import { cn } from '@/lib/utils'

const SERVICES = [
  { label: 'Order' },
  { label: 'Payment' },
  { label: 'Inventory' },
  { label: 'Notif' },
  { label: 'Analytics' },
]

const CENTER_X = 140
const CENTER_Y = 140
const RADIUS = 95
const NODE_RADIUS = 26
const VIEWBOX_SIZE = 280

function polarPoint(index: number, total: number): { x: number; y: number } {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  return {
    x: CENTER_X + RADIUS * Math.cos(angle),
    y: CENTER_Y + RADIUS * Math.sin(angle),
  }
}

const POSITIONS = SERVICES.map((_, i) => polarPoint(i, SERVICES.length))

const SOA_CONNECTIONS: [number, number][] = []
for (let i = 0; i < SERVICES.length; i++) {
  for (let j = i + 1; j < SERVICES.length; j++) {
    SOA_CONNECTIONS.push([i, j])
  }
}

function ServiceNode({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={NODE_RADIUS}
        fill="var(--viz-confirmed-bg)"
        stroke="var(--viz-confirmed-border)"
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill="var(--viz-confirmed-fg)"
      >
        {label}
      </text>
    </g>
  )
}

export function SoaVsKafkaTopology() {
  return (
    <VisualContainer
      title="SOA vs Kafka 토폴로지"
      description="서비스가 N개일 때 SOA는 연결 수가 N(N-1)/2로 폭발하지만, Kafka 허브는 N개로 선형 증가합니다."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              SOA: 직접 연결
            </span>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                vizStateClasses('blocked'),
              )}
            >
              {SOA_CONNECTIONS.length}개 선
            </span>
          </div>
          <svg
            viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            className="h-auto w-full"
            role="img"
            aria-label="SOA 토폴로지: 5개 서비스가 서로 모두 직접 연결된 복잡한 그래프"
          >
            {SOA_CONNECTIONS.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={POSITIONS[a].x}
                y1={POSITIONS[a].y}
                x2={POSITIONS[b].x}
                y2={POSITIONS[b].y}
                stroke="var(--viz-blocked-border)"
                strokeWidth={1.2}
                opacity={0.55}
              />
            ))}
            {SERVICES.map((s, i) => (
              <ServiceNode key={s.label} x={POSITIONS[i].x} y={POSITIONS[i].y} label={s.label} />
            ))}
          </svg>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Kafka 허브: 중앙 집중
            </span>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                vizStateClasses('highlight'),
              )}
            >
              {SERVICES.length}개 선
            </span>
          </div>
          <svg
            viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            className="h-auto w-full"
            role="img"
            aria-label="Kafka 토폴로지: 5개 서비스가 중앙 Kafka 허브를 통해 연결된 단순한 그래프"
          >
            {POSITIONS.map((pos, i) => (
              <line
                key={i}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={pos.x}
                y2={pos.y}
                stroke="var(--viz-highlight-border)"
                strokeWidth={1.8}
                opacity={0.75}
              />
            ))}
            <rect
              x={CENTER_X - 36}
              y={CENTER_Y - 18}
              width={72}
              height={36}
              rx={10}
              fill="var(--viz-highlight-bg)"
              stroke="var(--viz-highlight-border)"
              strokeWidth={2}
            />
            <text
              x={CENTER_X}
              y={CENTER_Y + 4}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill="var(--viz-highlight-fg)"
            >
              Kafka
            </text>
            {SERVICES.map((s, i) => (
              <ServiceNode key={s.label} x={POSITIONS[i].x} y={POSITIONS[i].y} label={s.label} />
            ))}
          </svg>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-blocked" />
          동기 호출 사슬, cascading failure 위험
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-highlight" />
          비동기 Pub/Sub, 느슨한 결합
        </span>
      </div>
    </VisualContainer>
  )
}
