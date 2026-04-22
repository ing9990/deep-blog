import { VisualContainer } from './common/VisualContainer'

interface Point {
  label: string
  x: number
  y: number
  cluster: 'animal' | 'database' | 'payment'
}

const POINTS: Point[] = [
  { label: '강아지가 공원에서 뛴다', x: 18, y: 22, cluster: 'animal' },
  { label: '반려견이 산책 중이다', x: 24, y: 18, cluster: 'animal' },
  { label: '고양이가 창가에 앉아있다', x: 30, y: 28, cluster: 'animal' },

  { label: '인덱스를 추가하면 조회가 빠르다', x: 70, y: 24, cluster: 'database' },
  { label: 'B+Tree는 디스크 I/O를 줄인다', x: 78, y: 30, cluster: 'database' },
  { label: 'Full Table Scan은 비용이 크다', x: 72, y: 36, cluster: 'database' },

  { label: '결제 승인이 완료되었습니다', x: 42, y: 74, cluster: 'payment' },
  { label: '카드 트랜잭션이 처리됨', x: 50, y: 80, cluster: 'payment' },
  { label: '주문 금액이 청구되었다', x: 56, y: 72, cluster: 'payment' },
]

const CLUSTER_COLOR: Record<Point['cluster'], string> = {
  animal: 'fill-viz-confirmed stroke-viz-confirmed',
  database: 'fill-viz-comparing stroke-viz-comparing',
  payment: 'fill-viz-pivot stroke-viz-pivot',
}

const CLUSTER_LABEL: Record<Point['cluster'], string> = {
  animal: '동물 · 산책',
  database: '데이터베이스 · 인덱스',
  payment: '결제 · 트랜잭션',
}

export function EmbeddingSpace() {
  return (
    <VisualContainer
      title="의미의 기하학화"
      description="의미가 비슷한 문장은 벡터 공간에서 같은 방향으로 수렴합니다 (실제는 고차원, 여기선 2차원으로 축소)"
    >
      <div className="relative">
        <svg
          viewBox="0 0 100 100"
          className="h-72 w-full rounded-[var(--radius-card)] border border-border bg-background"
          aria-label="2차원 임베딩 공간 시각화"
        >
          <line
            x1="5"
            y1="95"
            x2="95"
            y2="95"
            className="stroke-border"
            strokeWidth="0.3"
          />
          <line
            x1="5"
            y1="5"
            x2="5"
            y2="95"
            className="stroke-border"
            strokeWidth="0.3"
          />
          <text
            x="50"
            y="99"
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: '2.5px' }}
          >
            차원 1
          </text>
          <text
            x="2"
            y="50"
            textAnchor="middle"
            transform="rotate(-90 2 50)"
            className="fill-muted-foreground"
            style={{ fontSize: '2.5px' }}
          >
            차원 2
          </text>

          {POINTS.map((p) => (
            <g key={p.label}>
              <circle
                cx={p.x}
                cy={p.y}
                r="1.8"
                className={CLUSTER_COLOR[p.cluster]}
                strokeWidth="0.4"
                fillOpacity="0.5"
              />
              <text
                x={p.x + 2.5}
                y={p.y + 1}
                className="fill-foreground"
                style={{ fontSize: '2.4px' }}
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        {(Object.keys(CLUSTER_LABEL) as Point['cluster'][]).map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-full ${
                c === 'animal'
                  ? 'bg-viz-confirmed'
                  : c === 'database'
                    ? 'bg-viz-comparing'
                    : 'bg-viz-pivot'
              }`}
            />
            {CLUSTER_LABEL[c]}
          </span>
        ))}
      </div>
    </VisualContainer>
  )
}
