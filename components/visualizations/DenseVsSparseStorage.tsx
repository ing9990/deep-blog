import { VisualContainer } from './common/VisualContainer'
import { vizStateClasses, type VizState } from './common/colors'
import { cn } from '@/lib/utils'

const DENSE_VALUES = [0.013, -0.241, 0.087, 0.412, -0.155, 0.073, -0.328, 0.291]

interface SparseEntry {
  termId: number
  token: string
  weight: number
}

const SPARSE_ENTRIES: SparseEntry[] = [
  { termId: 12, token: 'BTS', weight: 4.21 },
  { termId: 947, token: 'RM', weight: 5.37 },
  { termId: 3142, token: '솔로', weight: 2.18 },
  { termId: 8731, token: '앨범', weight: 1.92 },
]

const SPARSE_TOTAL_DIMS = 50_000

function PanelHeader({
  title,
  subtitle,
  state,
}: {
  title: string
  subtitle: string
  state: VizState
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border px-3 py-2',
        vizStateClasses(state),
      )}
    >
      <p className="text-[13px] font-semibold leading-tight">{title}</p>
      <p className="mt-0.5 text-[11px] opacity-80">{subtitle}</p>
    </div>
  )
}

function DenseVectorRow() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>표현: 768d float[] (예시는 8칸)</span>
        <span>비-0 비율 ≈ 100%</span>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {DENSE_VALUES.map((v, i) => (
          <div
            key={i}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-[var(--radius-chip)] border px-1 py-1.5',
              vizStateClasses('pivot'),
            )}
          >
            <span className="font-mono text-[10px]">{v.toFixed(2)}</span>
            <span className="text-[9px] opacity-60">d{i}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        모든 차원이 채워짐 → 배열 그대로 저장 → 검색 시 모든 벡터와 거리 계산은 $O(N \cdot D)$ 비효율
      </p>
    </div>
  )
}

function DenseIndexBlock() {
  const nodes = [
    { x: 50, y: 35, label: 'A' },
    { x: 130, y: 25, label: 'B' },
    { x: 210, y: 50, label: 'C' },
    { x: 90, y: 95, label: 'D' },
    { x: 180, y: 110, label: 'E' },
  ]
  const edges: Array<[number, number]> = [
    [0, 1],
    [0, 3],
    [1, 2],
    [2, 4],
    [3, 4],
    [1, 3],
  ]

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-foreground">
        인덱스 구조: 그래프 (HNSW, IVF)
      </p>
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-2">
        <svg viewBox="0 0 260 140" className="h-32 w-full">
          {edges.map(([from, to], i) => (
            <line
              key={i}
              x1={nodes[from].x}
              y1={nodes[from].y}
              x2={nodes[to].x}
              y2={nodes[to].y}
              className="stroke-viz-pivot/60"
              strokeWidth={1.5}
            />
          ))}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle
                cx={n.x}
                cy={n.y}
                r={11}
                className="fill-viz-pivot-bg stroke-viz-pivot"
                strokeWidth={1.5}
              />
              <text
                x={n.x}
                y={n.y + 3}
                textAnchor="middle"
                className="fill-viz-pivot-fg font-mono text-[10px] font-semibold"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        가까운 벡터끼리 노드-엣지로 연결, 쿼리 벡터에서 그래프를 따라 근사 탐색 → ms 단위 응답
      </p>
    </div>
  )
}

function SparseVectorRow() {
  const axisWidth = 100
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>표현: vocab[{SPARSE_TOTAL_DIMS.toLocaleString()}]</span>
        <span>비-0 비율 ≈ {((SPARSE_ENTRIES.length / SPARSE_TOTAL_DIMS) * 100).toFixed(2)}%</span>
      </div>
      <div className="rounded-[var(--radius-chip)] border border-border bg-muted/20 px-2 py-3">
        <div className="relative h-6">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          {SPARSE_ENTRIES.map((entry) => {
            const left = (entry.termId / SPARSE_TOTAL_DIMS) * axisWidth
            const heightPx = 8 + entry.weight * 3
            return (
              <div
                key={entry.termId}
                className="absolute bottom-1/2 flex flex-col items-center"
                style={{ left: `${left}%` }}
              >
                <div
                  className={cn(
                    'w-[3px] rounded-sm',
                    vizStateClasses('highlight').split(' ')[1],
                  )}
                  style={{ height: `${heightPx}px` }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
          <span>0</span>
          <span>{SPARSE_TOTAL_DIMS.toLocaleString()}</span>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        99.99%가 0 → 배열 저장은 낭비 → {`{term_id: weight}`} 매핑만 저장
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {SPARSE_ENTRIES.map((e) => (
          <div
            key={e.termId}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-[var(--radius-chip)] border px-2 py-1.5',
              vizStateClasses('highlight'),
            )}
          >
            <span className="font-mono text-[10px] opacity-70">d{e.termId}</span>
            <span className="text-[11px] font-semibold">{e.token}</span>
            <span className="font-mono text-[10px]">{e.weight.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SparseIndexBlock() {
  const postings: Array<{ token: string; docs: number[] }> = [
    { token: 'BTS', docs: [42, 117, 256, 891] },
    { token: 'RM', docs: [42, 891] },
    { token: '솔로', docs: [42, 305] },
    { token: '앨범', docs: [305, 891, 1024] },
  ]

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-foreground">
        인덱스 구조: Inverted Index
      </p>
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/20 p-2">
        <div className="flex flex-col gap-1.5">
          {postings.map((p) => (
            <div key={p.token} className="flex items-center gap-2 text-[11px]">
              <div
                className={cn(
                  'w-14 flex-shrink-0 rounded-[var(--radius-chip)] border px-1.5 py-0.5 text-center font-mono',
                  vizStateClasses('highlight'),
                )}
              >
                {p.token}
              </div>
              <span className="text-muted-foreground" aria-hidden="true">
                →
              </span>
              <div className="flex flex-1 flex-wrap gap-1">
                {p.docs.map((id) => (
                  <span
                    key={id}
                    className="rounded-[var(--radius-chip)] border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    doc{id}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        토큰 → 등장 문서 목록만 저장. 0인 차원은 건드리지 않음 → 쿼리 토큰만 훑고 합산
      </p>
    </div>
  )
}

export function DenseVsSparseStorage() {
  return (
    <VisualContainer
      title="Dense vs Sparse: 표현과 인덱스 구조"
      description="0 분포(거의 채움 vs 거의 비움)가 자료구조 선택을 강제한다"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <PanelHeader
            title="Dense Vector"
            subtitle="작은 차원 · 거의 모두 비-0 · 의미 좌표"
            state="pivot"
          />
          <DenseVectorRow />
          <DenseIndexBlock />
        </div>

        <div className="flex flex-col gap-3">
          <PanelHeader
            title="Sparse Vector"
            subtitle="큰 차원 · 대부분 0 · 토큰 = 차원"
            state="highlight"
          />
          <SparseVectorRow />
          <SparseIndexBlock />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-pivot" />
          Dense (그래프/클러스터로 수렴)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-viz-highlight" />
          Sparse (Inverted Index로 수렴)
        </span>
      </div>
    </VisualContainer>
  )
}
